const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema(
  {
    Name: {
      type: String,
      required: true,
      trim: true
    },
    Location: {
      type: String,
      required: true,
      trim: true
    },
    Amenities: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Hotel", hotelSchema, "Hotel");
