require("dotenv").config();

const mongoose = require("mongoose");
const env = require("../src/config/env");
const Hotel = require("../src/models/mongo/Hotel");
const User = require("../src/models/mongo/User");
const Review = require("../src/models/mongo/Review");
const { pool } = require("../src/config/mysql");

const HOTEL_CATALOG = [
  {
    SqlHotelId: "HOTEL001",
    Name: "Riverside Hotel & Spa",
    Location: "District 1, Ho Chi Minh City",
    Amenities: ["WiFi", "Breakfast", "Pool", "Spa", "Parking"]
  },
  {
    SqlHotelId: "HOTEL002",
    Name: "Ocean View Villa",
    Location: "Vung Tau, Ba Ria - Vung Tau",
    Amenities: ["WiFi", "Breakfast", "Beach Access", "Pool", "Gym"]
  },
  {
    SqlHotelId: "HOTEL003",
    Name: "Mountain Resort",
    Location: "Da Lat, Lam Dong",
    Amenities: ["WiFi", "Breakfast", "Mountain View", "Spa", "Parking"]
  }
];

const REVIEW_TEMPLATES = [
  {
    Rating: 5,
    Comment: "Dịch vụ rất tốt, phòng sạch và đúng mô tả."
  },
  {
    Rating: 4,
    Comment: "Trải nghiệm ổn, nhân viên hỗ trợ nhanh và nhiệt tình."
  },
  {
    Rating: 5,
    Comment: "Vị trí đẹp, tiện nghi đầy đủ, tôi sẽ quay lại lần sau."
  },
  {
    Rating: 3,
    Comment: "Khá ổn nhưng tốc độ check-in cần cải thiện hơn."
  },
  {
    Rating: 4,
    Comment: "Không gian thoải mái, phù hợp cho chuyến nghỉ dưỡng ngắn ngày."
  }
];

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

    const hotelDocs = [];
    for (const hotelSeed of HOTEL_CATALOG) {
      const hotel = await Hotel.findOneAndUpdate(
        { SqlHotelId: hotelSeed.SqlHotelId },
        {
          $set: {
            SqlHotelId: hotelSeed.SqlHotelId,
            Name: hotelSeed.Name,
            Location: hotelSeed.Location,
            Amenities: hotelSeed.Amenities
          }
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      );

      hotelDocs.push(hotel);
    }

    const completedTrips = await pool.query(
      `
      SELECT r.ReservationId, r.UserId, rm.HotelId, r.CheckInDate, r.CheckOutDate
      FROM Reservation r
      INNER JOIN Room rm ON rm.RoomId = r.RoomId
      WHERE r.Status = 'Completed'
        AND r.CheckInDate >= '2026-01-01'
        AND r.CheckOutDate < '2026-07-01'
      ORDER BY rm.HotelId, r.CheckOutDate DESC
      `
    );

    const reservationRows = completedTrips[0] || [];
    const reservationIds = reservationRows.map((row) => row.ReservationId);

    if (reservationIds.length > 0) {
      await Review.deleteMany({ ReservationId: { $in: reservationIds } });
    }

    const reservationByHotel = new Map();
    for (const row of reservationRows) {
      if (!reservationByHotel.has(row.HotelId)) {
        reservationByHotel.set(row.HotelId, []);
      }
      reservationByHotel.get(row.HotelId).push(row);
      await upsertMongoUser(row.UserId);
    }

    const seededReviews = [];
    for (const hotel of hotelDocs) {
      const reservations = reservationByHotel.get(hotel.SqlHotelId) || [];
      if (reservations.length === 0) {
        continue;
      }

      for (let index = 0; index < reservations.length; index += 1) {
        const reservation = reservations[index];
        const user = await upsertMongoUser(reservation.UserId);
        const template = REVIEW_TEMPLATES[(seededReviews.length + index) % REVIEW_TEMPLATES.length];
        const createdAt = new Date(reservation.CheckOutDate || reservation.CheckInDate);
        createdAt.setHours(10 + (index % 5), (index * 13) % 60, 0, 0);

        const review = await Review.findOneAndUpdate(
          { ReservationId: reservation.ReservationId },
          {
            $set: {
              HotelId: hotel._id,
              ReservationId: reservation.ReservationId,
              UserId: user._id,
              Rating: template.Rating,
              Comment: `${hotel.Name}: ${template.Comment}`,
              CreatedAt: createdAt
            }
          }
          ,
          { upsert: true, returnDocument: "after", setDefaultsOnInsert: true, timestamps: false }
        );

        seededReviews.push({
          hotelId: hotel.SqlHotelId,
          mongoHotelId: String(hotel._id),
          reservationId: reservation.ReservationId,
          reviewId: String(review._id),
          rating: template.Rating,
          createdAt: createdAt.toISOString()
        });
      }
    }

    console.log("Seed data synchronized");
    console.log({
      hotels: hotelDocs.map((hotel) => ({
        sqlHotelId: hotel.SqlHotelId,
        mongoHotelId: String(hotel._id),
        name: hotel.Name
      })),
      reviews: seededReviews
    });
  } catch (error) {
    console.error("Seed failed:", error.message);
  } finally {
    await mongoose.connection.close();
    await pool.end();
  }
}

seedDatabase();
