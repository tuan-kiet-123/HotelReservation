const mongoose = require("mongoose");
const env = require("./env");

async function connectMongo() {
  if (!env.MONGODB_URI) {
    throw new Error("Missing MONGODB_URI in environment variables");
  }

  await mongoose.connect(env.MONGODB_URI);
  return mongoose.connection;
}

module.exports = {
  connectMongo,
  mongoose
};
