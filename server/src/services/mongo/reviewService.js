const Review = require("../../models/mongo/Review");
const mongoose = require("mongoose");
require("../../models/mongo/User");

async function createReview(payload) {
  return Review.create(payload);
}

async function getReviews() {
  return Review.find().populate("HotelId").populate("UserId").sort({ CreateAt: -1 });
}

async function updateReview(id, payload) {
  return Review.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
}

async function deleteReview(id) {
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
