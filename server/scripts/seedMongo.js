require("dotenv").config();

const mongoose = require("mongoose");
const env = require("../src/config/env");
const Hotel = require("../src/models/mongo/Hotel");
const User = require("../src/models/mongo/User");
const Review = require("../src/models/mongo/Review");

async function seedDatabase() {
  try {
    await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DATABASE });
    console.log("MongoDB connected");

    await Review.create({
      HotelId: "69c9453c97d53daa0f29cce1",
      UserId: "U001",
      Rating: 5,
      Comment: "Hala Madrid!"
    });

    console.log("Seed data created");
  } catch (error) {
    console.error("Seed failed:", error.message);
  } finally {
    await mongoose.connection.close();
  }
}

seedDatabase();
