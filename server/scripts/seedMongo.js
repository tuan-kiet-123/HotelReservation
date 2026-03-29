require("dotenv").config();

const mongoose = require("mongoose");
const Hotel = require("../src/models/mongo/Hotel");
const User = require("../src/models/mongo/User");
const Review = require("../src/models/mongo/Review");

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");

    await Hotel.deleteMany({});
    await User.deleteMany({});
    await Review.deleteMany({});

    const hotel = await Hotel.create({
      Name: "Santiago Bernabeu Hotel",
      Location: "Madrid, Spain",
      Amenities: ["Free WiFi", "Swimming Pool", "Football Pitch"]
    });

    const user = await User.create({
      _id: "U001",
      FullName: "Thomas Muller",
      Email: "thomas.muller@fcbayern.com",
      Phone: "0901234567"
    });

    await Review.create({
      HotelId: hotel._id,
      UserId: user._id,
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
