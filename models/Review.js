const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    HotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true
    },
    UserId: {
      type: String,
      ref: "User",
      required: true
    },
    Rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    Comment: {
      type: String,
      required: true
    }
  },
  { 
    // Mongoose sẽ tự tạo CreateAt thay vì createdAt
    timestamps: { createdAt: 'CreateAt', updatedAt: false } 
  }
);

module.exports = mongoose.model("Review", reviewSchema, "Review");