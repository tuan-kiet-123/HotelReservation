const bookingService = require("../../services/mysql/bookingService");
const { success, fail } = require("../../utils/apiResponse");

async function createBooking(req, res, next) {
  try {
    const booking = await bookingService.createBooking(req.body);
    return success(res, booking, "Create booking successfully", 201);
  } catch (error) {
    return next(error);
  }
}

async function getBookings(req, res, next) {
  try {
    const bookings = await bookingService.getBookings();
    return success(res, bookings, "Get bookings successfully");
  } catch (error) {
    return next(error);
  }
}

async function getBookingById(req, res, next) {
  try {
    const booking = await bookingService.getBookingById(req.params.id);
    if (!booking) {
      return fail(res, "Booking not found", 404);
    }

    return success(res, booking, "Get booking successfully");
  } catch (error) {
    return next(error);
  }
}

async function updateBooking(req, res, next) {
  try {
    const booking = await bookingService.updateBooking(req.params.id, req.body);
    if (!booking) {
      return fail(res, "Booking not found", 404);
    }

    return success(res, booking, "Update booking successfully");
  } catch (error) {
    return next(error);
  }
}

async function deleteBooking(req, res, next) {
  try {
    const isDeleted = await bookingService.deleteBooking(req.params.id);
    if (!isDeleted) {
      return fail(res, "Booking not found", 404);
    }

    return success(res, { id: Number(req.params.id) }, "Delete booking successfully");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking
};
