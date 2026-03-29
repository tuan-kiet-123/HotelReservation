const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true
    },
    FullName: {
      type: String,
      required: true,
      trim: true
    },
    Email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    Phone: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema, "User");
