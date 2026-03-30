const Hotel = require("../../models/mongo/Hotel");
const mongoose = require("mongoose");
const { pool } = require("../../config/mysql");

function createServiceError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toHotelName(name, SqlHotelId) {
  const fallback = `Hotel ${SqlHotelId}`;
  const normalized = String(name || fallback).trim();
  return normalized.slice(0, 100) || fallback.slice(0, 100);
}

async function upsertMySqlHotel(SqlHotelId, name) {
  const hotelName = toHotelName(name, SqlHotelId);

  await pool.query(
    `
    INSERT INTO Hotel (HotelId, HotelName, Status)
    VALUES (?, ?, 1)
    ON DUPLICATE KEY UPDATE
      HotelName = VALUES(HotelName),
      Status = 1
    `,
    [SqlHotelId, hotelName]
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
    await upsertMySqlHotel(SqlHotelId, hotel.Name);
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

module.exports = {
  createHotel,
  getHotels,
  getHotelById,
  updateHotel,
  deleteHotel
};
