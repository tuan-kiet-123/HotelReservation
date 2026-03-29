const hotelService = require("../../services/mongo/hotelService");
const { success, fail } = require("../../utils/apiResponse");

async function createHotel(req, res, next) {
  try {
    const hotel = await hotelService.createHotel(req.body);
    return success(res, hotel, "Create hotel successfully", 201);
  } catch (error) {
    return next(error);
  }
}

async function getHotels(req, res, next) {
  try {
    const hotels = await hotelService.getHotels();
    return success(res, hotels, "Get hotels successfully");
  } catch (error) {
    return next(error);
  }
}

async function getHotelById(req, res, next) {
  try {
    const hotel = await hotelService.getHotelById(req.params.id);
    if (!hotel) {
      return fail(res, "Hotel not found", 404);
    }

    return success(res, hotel, "Get hotel successfully");
  } catch (error) {
    return next(error);
  }
}

async function updateHotel(req, res, next) {
  try {
    const hotel = await hotelService.updateHotel(req.params.id, req.body);
    if (!hotel) {
      return fail(res, "Hotel not found", 404);
    }

    return success(res, hotel, "Update hotel successfully");
  } catch (error) {
    return next(error);
  }
}

async function deleteHotel(req, res, next) {
  try {
    const hotel = await hotelService.deleteHotel(req.params.id);
    if (!hotel) {
      return fail(res, "Hotel not found", 404);
    }

    return success(res, hotel, "Delete hotel successfully");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createHotel,
  getHotels,
  getHotelById,
  updateHotel,
  deleteHotel
};
