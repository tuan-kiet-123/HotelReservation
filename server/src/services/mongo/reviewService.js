const Review = require("../../models/mongo/Review");
const mongoose = require("mongoose");
const Hotel = require("../../models/mongo/Hotel");
const User = require("../../models/mongo/User");
const { pool } = require("../../config/mysql");

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function assertUserHasCompletedTrip(userId, sqlHotelId) {
  const [rows] = await pool.query(
    `
    SELECT 1
    FROM Reservation r
    INNER JOIN Room rm ON rm.RoomId = r.RoomId
    WHERE r.UserId = ?
      AND r.Status = 'Completed'
      AND rm.HotelId = ?
    LIMIT 1
    `,
    [userId, sqlHotelId]
  );

  if (!rows || rows.length === 0) {
    throw createServiceError("User can only review after completing a trip at this hotel", 403);
  }
}

function normalizeCreatePayload(payload) {
  const hotelId = payload.HotelId;
  const userId = String(payload.UserId || "").trim();
  const rating = Number(payload.Rating);
  const comment = String(payload.Comment || "").trim();

  if (!hotelId || !mongoose.isValidObjectId(hotelId)) {
    throw createServiceError("HotelId must be a valid ObjectId", 400);
  }

  if (!userId) {
    throw createServiceError("UserId is required", 400);
  }

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw createServiceError("Rating must be a number between 1 and 5", 400);
  }

  if (!comment) {
    throw createServiceError("Comment is required", 400);
  }

  return {
    HotelId: hotelId,
    UserId: userId,
    Rating: rating,
    Comment: comment
  };
}

async function createReview(payload) {
  const normalizedPayload = normalizeCreatePayload(payload);

  const hotel = await Hotel.findById(normalizedPayload.HotelId).select("_id SqlHotelId");
  if (!hotel) {
    throw createServiceError("Hotel not found", 404);
  }

  if (!hotel.SqlHotelId) {
    throw createServiceError("Hotel is not linked to SQL HotelId (SqlHotelId)", 400);
  }

  const user = await User.findById(normalizedPayload.UserId).select("_id");
  if (!user) {
    throw createServiceError("User not found", 404);
  }

  await assertUserHasCompletedTrip(normalizedPayload.UserId, hotel.SqlHotelId);

  const existing = await Review.findOne({
    HotelId: normalizedPayload.HotelId,
    UserId: normalizedPayload.UserId
  }).select("_id");

  if (existing) {
    throw createServiceError("User already reviewed this hotel", 409);
  }

  return Review.create(normalizedPayload);
}

async function getReviews(filters = {}) {
  const query = {};

  if (filters.hotelId) {
    if (!mongoose.isValidObjectId(filters.hotelId)) {
      throw createServiceError("Invalid hotel id", 400);
    }

    query.HotelId = filters.hotelId;
  }

  if (filters.userId) {
    query.UserId = String(filters.userId).trim();
  }

  return Review.find(query)
    .populate("HotelId")
    .populate({ path: "UserId", model: "User" })
    .sort({ CreatedAt: -1 });
}

async function updateReview(id, payload) {
  if (!mongoose.isValidObjectId(id)) {
    throw createServiceError("Invalid review id", 400);
  }

  const updatePayload = {};

  if (payload.Rating !== undefined) {
    const rating = Number(payload.Rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      throw createServiceError("Rating must be a number between 1 and 5", 400);
    }
    updatePayload.Rating = rating;
  }

  if (payload.Comment !== undefined) {
    const comment = String(payload.Comment).trim();
    if (!comment) {
      throw createServiceError("Comment cannot be empty", 400);
    }
    updatePayload.Comment = comment;
  }

  if (Object.keys(updatePayload).length === 0) {
    throw createServiceError("At least one field (Rating or Comment) is required", 400);
  }

  return Review.findByIdAndUpdate(id, updatePayload, { new: true, runValidators: true });
}

async function deleteReview(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw createServiceError("Invalid review id", 400);
  }

  return Review.findByIdAndDelete(id);
}

async function getHotelAverageRating(hotelId) {
  const [result] = await Review.aggregate([
    {
      $match: {
        HotelId: new mongoose.Types.ObjectId(hotelId)
      }
    },
    {
      $group: {
        _id: "$HotelId",
        averageRating: { $avg: "$Rating" },
        totalReviews: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        hotelId: { $toString: "$_id" },
        averageRating: { $round: ["$averageRating", 2] },
        totalReviews: 1
      }
    }
  ]);

  return result || null;
}

module.exports = {
  createReview,
  getReviews,
  updateReview,
  deleteReview,
  getHotelAverageRating
};
