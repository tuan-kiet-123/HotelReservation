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

async function getAdminBookings(req, res, next) {
  try {
    const { startDate, endDate, hotelId, status, paid, page = 1, pageSize = 20, search } = req.query;

    if (startDate && endDate && startDate > endDate) {
      return fail(res, "Query param 'startDate' must be earlier than or equal to 'endDate'", 400);
    }

    const pageNum = Number.parseInt(page, 10);
    const pageSizeNum = Number.parseInt(pageSize, 10);

    if (!Number.isInteger(pageNum) || pageNum < 1) {
      return fail(res, "Query param 'page' must be a positive integer", 400);
    }

    if (!Number.isInteger(pageSizeNum) || pageSizeNum < 1) {
      return fail(res, "Query param 'pageSize' must be a positive integer", 400);
    }

    if (pageSizeNum > 100) {
      return fail(res, "Query param 'pageSize' cannot exceed 100", 400);
    }

    const params = {
      startDate: startDate || null,
      endDate: endDate || null,
      hotelId: hotelId || null,
      status: status || null,
      paid: typeof paid !== 'undefined' ? (paid === 'true' || paid === '1') : null,
      page: pageNum,
      pageSize: pageSizeNum,
      search: search || null
    };

    const result = await bookingService.getAdminBookings(params);

    return success(res, result, 'OK', 200);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  bookRoom,
  processCheckInPayment,
  processCheckOut,
  getAdminBookings
};
