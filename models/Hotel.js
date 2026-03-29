const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema({
    Name: {
      type: String,
      required: true,
      trim: true,
    },
    Location: {
      type: String,
      required: true,
    },
    Amenities: {
      type: [String],
      default: [],
    }
});

module.exports = mongoose.model("Hotel", hotelSchema, "Hotel");