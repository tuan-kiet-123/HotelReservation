const Review = require("../../models/mongo/Review");

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

module.exports = {
  createReview,
  getReviews,
  updateReview,
  deleteReview
};
