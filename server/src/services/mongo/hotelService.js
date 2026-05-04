const Hotel = require("../../models/mongo/Hotel");
const mongoose = require("mongoose");
const { pool } = require("../../config/mysql");

function createServiceError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function upsertMySqlHotel(SqlHotelId) {
  await pool.query(
    `
    INSERT INTO Hotel (HotelId, Status)
    VALUES (?, 1)
    ON DUPLICATE KEY UPDATE
      Status = 1
    `,
    [SqlHotelId]
  );
}

async function createHotel(payload) {
  const mongoId = new mongoose.Types.ObjectId();
  const SqlHotelId = String(mongoId);
  const createPayload = {
    ...payload,
    _id: mongoId,
    SqlHotelId: SqlHotelId
  };

  let hotel;

  try {
    hotel = await Hotel.create(createPayload);
    await upsertMySqlHotel(SqlHotelId);
    return hotel;
  } catch (error) {
    if (hotel?._id) {
      await Hotel.findByIdAndDelete(hotel._id).catch(() => {});
    }

    throw createServiceError(error.message || "Failed to create hotel", error.statusCode || 500);
  }
}

async function getHotels() {
  return Hotel.find().sort({ createdAt: -1 });
}

async function getHotelById(id) {
  return Hotel.findById(id);
}

async function updateHotel(id, payload) {
  const updatePayload = { ...payload };
  delete updatePayload.SqlHotelId;

  const hotel = await Hotel.findByIdAndUpdate(id, updatePayload, {
    new: true,
    runValidators: true
  });

  if (!hotel) {
    return null;
  }

  try {
    await upsertMySqlHotel(hotel.SqlHotelId, hotel.Name);
  } catch (error) {
    throw createServiceError(error.message || "Failed to sync hotel to MySQL", 500);
  }

  return hotel;
}

async function deleteHotel(id) {
  const hotel = await Hotel.findById(id);
  if (!hotel) {
    return null;
  }

  try {
    await pool.query("UPDATE Hotel SET Status = 0 WHERE HotelId = ?", [hotel.SqlHotelId]);
  } catch (error) {
    throw createServiceError(error.message || "Failed to sync hotel deletion to MySQL", 500);
  }

  return Hotel.findByIdAndDelete(id);
}

async function getHotelSuggestions(keyword) {
  if (!keyword) return [];
  return Hotel.find({
    $or: [
      { Name: { $regex: keyword, $options: 'i' } },
      { Location: { $regex: keyword, $options: 'i' } }
    ]
  })
  .select('_id Name Location')
  .limit(5);
}

module.exports = {
  createHotel,
  getHotels,
  getHotelById,
  updateHotel,
  deleteHotel,
  getHotelSuggestions
};
