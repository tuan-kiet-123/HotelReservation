const bookingService = require("../../services/mysql/bookingService");
const { success, fail } = require("../../utils/apiResponse");

function isValidDateTime(value) {
  if (typeof value !== "string") {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

async function bookRoom(req, res, next) {
  try {
    const { roomId, userId, checkInDate, checkOutDate } = req.body;

    if (!roomId || !userId || !checkInDate || !checkOutDate) {
      return fail(
        res,
        "roomId, userId, checkInDate, checkOutDate are required",
        400
      );
    }

    if (!isValidDateTime(checkInDate) || !isValidDateTime(checkOutDate)) {
      return fail(
        res,
        "checkInDate and checkOutDate must be valid datetime strings",
        400
      );
    }

    const result = await bookingService.bookRoom({
      roomId,
      userId,
      checkInDate,
      checkOutDate
    });

    if (result.statusCode >= 400) {
      return fail(res, result.message, result.statusCode, result.data);
    }

    return success(res, result.data, result.message, result.statusCode);
  } catch (error) {
    return next(error);
  }
}

async function processCheckInPayment(req, res, next) {
  try {
    const { reservationId } = req.body;

    if (!reservationId) {
      return fail(res, "reservationId is required", 400);
    }

    const result = await bookingService.processCheckInPayment({
      reservationId
    });

    if (result.statusCode >= 400) {
      return fail(res, result.message, result.statusCode, result.data);
    }

    return success(res, result.data, result.message, result.statusCode);
  } catch (error) {
    return next(error);
  }
}

async function processCheckOut(req, res, next) {
  try {
    const { reservationId } = req.body;

    if (!reservationId) {
      return fail(res, "reservationId is required", 400);
    }

    const result = await bookingService.processCheckOut({ reservationId });

    if (result.statusCode >= 400) {
      return fail(res, result.message, result.statusCode, result.data);
    }

    return success(res, result.data, result.message, result.statusCode);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  bookRoom,
  processCheckInPayment,
  processCheckOut
};
