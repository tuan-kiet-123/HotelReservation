const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema(
  {
    HotelId: {
      type: String,
      trim: true,
      required: true,
      immutable: true
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
    timestamps: true,
    strict: false
  }
);

hotelSchema.pre("validate", function mapSqlHotelIdFromMongoId(next) {
  if (!this.SqlHotelId && this._id) {
    this.SqlHotelId = String(this._id);
  }
  next();
});

hotelSchema.index({ SqlHotelId: 1 }, { unique: true });

module.exports = mongoose.model("Hotel", hotelSchema, "Hotel");
