const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema(
  {
    SqlHotelId: {
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

hotelSchema.pre("validate", function mapSqlHotelIdFromMongoId() {
  if (!this.SqlHotelId && this._id) {
    this.SqlHotelId = String(this._id);
  }
});

hotelSchema.index({ SqlHotelId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Hotel", hotelSchema, "Hotel");
