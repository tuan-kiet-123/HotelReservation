const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema(
  {
    SqlHotelId: {
      type: String,
      trim: true,
      default: null
    },
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

hotelSchema.index({ SqlHotelId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Hotel", hotelSchema, "Hotel");
