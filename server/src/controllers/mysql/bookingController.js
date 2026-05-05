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

    console.log("🔍 [bookRoom Controller] Request body:", { roomId, userId, checkInDate, checkOutDate });

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

    console.log("✅ [bookRoom Controller] Validation passed. Calling bookingService...");

    const result = await bookingService.bookRoom({
      roomId,
      userId,
      checkInDate,
      checkOutDate
    });

    console.log("📦 [bookRoom Controller] Service result:", result);

    if (result.statusCode >= 400) {
      return fail(res, result.message, result.statusCode, result.data);
    }

    return success(res, result.data, result.message, result.statusCode);
  } catch (error) {
    console.error("❌ [bookRoom Controller] CAUGHT ERROR:", {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
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

async function getReservations(req, res, next) {
  try {
    const result = await bookingService.getReservations({
      userId: req.query.userId
    });

    if (result.statusCode >= 400) {
      return fail(res, result.message, result.statusCode, result.data);
    }

    return success(res, result.data, result.message, result.statusCode);
  } catch (error) {
    return next(error);
  }
}

async function cancelReservation(req, res, next) {
  try {
    const { reservationId } = req.body;

    if (!reservationId) {
      return fail(res, "reservationId is required", 400);
    }

    const result = await bookingService.cancelReservation({ reservationId });

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
  processCheckOut,
  cancelReservation,
  getReservations
};
