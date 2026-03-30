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
      required: true,
      trim: true
    }
  },
  {
    timestamps: { createdAt: "CreatedAt", updatedAt: false }
  }
);

reviewSchema.index({ HotelId: 1, CreatedAt: -1 });
reviewSchema.index({ UserId: 1, CreatedAt: -1 });

module.exports = mongoose.model("Review", reviewSchema, "Review");
