const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
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
    lowercase: true
  },
  Phone: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("User", userSchema);