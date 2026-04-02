require("dotenv").config();

const mongoose = require("mongoose");
const env = require("../src/config/env");
const Hotel = require("../src/models/mongo/Hotel");
const User = require("../src/models/mongo/User");
const Review = require("../src/models/mongo/Review");
const { pool } = require("../src/config/mysql");

async function getOneCompletedTrip() {
  const [rows] = await pool.query(
    `
    SELECT r.ReservationId, r.UserId, rm.HotelId
    FROM Reservation r
    INNER JOIN Room rm ON rm.RoomId = r.RoomId
    WHERE r.Status = 'Completed'
    ORDER BY r.CheckOutDate DESC
    LIMIT 1
    `
  );

  if (!rows || rows.length === 0) {
    throw new Error("No completed trips found in MySQL");
  }

  return rows[0];
}

async function getCompletedReservationsByHotel(sqlHotelId) {
  const [rows] = await pool.query(
    `
    SELECT DISTINCT r.ReservationId, r.UserId
    FROM Reservation r
    INNER JOIN Room rm ON rm.RoomId = r.RoomId
    WHERE r.Status = 'Completed'
      AND rm.HotelId = ?
    ORDER BY r.ReservationId ASC
    `,
    [sqlHotelId]
  );

  return rows;
}

async function upsertMongoUser(sqlUserId) {
  return User.findByIdAndUpdate(
    sqlUserId,
    {
      FullName: `User ${sqlUserId}`,
      Email: `${sqlUserId.toLowerCase()}@example.com`,
      Phone: "0900000000"
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
}

async function seedDatabase() {
  try {
    await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DATABASE });
    console.log("MongoDB connected");

    const completedTrip = await getOneCompletedTrip();
    const sqlReservationId = completedTrip.ReservationId;
    const sqlUserId = completedTrip.UserId;
    const sqlHotelId = completedTrip.HotelId;

    const hotel = await Hotel.findOneAndUpdate(
      { SqlHotelId: sqlHotelId },
      {
        $set: {
          SqlHotelId: sqlHotelId,
          Name: `Hotel ${sqlHotelId}`,
          Location: "N/A",
          Amenities: ["WiFi", "Breakfast"]
        }
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    const eligibleReservations = await getCompletedReservationsByHotel(sqlHotelId);
    for (const eligible of eligibleReservations) {
      await upsertMongoUser(eligible.UserId);
    }

    const user = await upsertMongoUser(sqlUserId);

    const review = await Review.findOneAndUpdate(
      {
        ReservationId: sqlReservationId
      },
      {
        $set: {
          HotelId: hotel._id,
          ReservationId: sqlReservationId,
          UserId: user._id,
          Rating: 5,
          Comment: "Great stay, friendly staff"
        }
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    let readyPayload = null;
    for (const eligible of eligibleReservations) {
      const existing = await Review.findOne({
        ReservationId: eligible.ReservationId
      })
        .select("_id")
        .lean();

      if (!existing) {
        readyPayload = {
          HotelId: String(hotel._id),
          ReservationId: eligible.ReservationId,
          UserId: eligible.UserId,
          Rating: 4,
          Comment: "Service was good and room was clean"
        };
        break;
      }
    }

    console.log("Seed data synchronized");
    console.log({
      sqlHotelId,
      sqlUserId,
      sqlReservationId,
      mongoHotelId: String(hotel._id),
      mongoReviewId: String(review._id),
      readyPayload
    });

    if (!readyPayload) {
      console.log("No eligible user without review found. Delete one review first to test 201 create.");
    }
  } catch (error) {
    console.error("Seed failed:", error.message);
  } finally {
    await mongoose.connection.close();
    await pool.end();
  }
}

seedDatabase();
