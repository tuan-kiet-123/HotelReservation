const Hotel = require("../../models/mongo/Hotel");

async function createHotel(payload) {
  return Hotel.create(payload);
}

async function getHotels() {
  return Hotel.find().sort({ createdAt: -1 });
}

async function getHotelById(id) {
  return Hotel.findById(id);
}

async function updateHotel(id, payload) {
  return Hotel.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
}

async function deleteHotel(id) {
  return Hotel.findByIdAndDelete(id);
}

module.exports = {
  createHotel,
  getHotels,
  getHotelById,
  updateHotel,
  deleteHotel
};
