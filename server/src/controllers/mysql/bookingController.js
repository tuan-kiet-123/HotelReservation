const bookingService = require("../../services/mysql/bookingService");
const { success, fail } = require("../../utils/apiResponse");
const { pool } = require("../../config/mysql");
const mailer = require("../../utils/mailer");

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

    // Nếu đặt phòng thành công, gửi email xác nhận
    if (result.statusCode === 200 || result.statusCode === 201) {
      try {
        const [rows] = await pool.query(
          `SELECT u.Email, u.FullName, h.Name AS HotelName, r.RoomType, DATE_FORMAT(res.CheckInDate, '%d/%m/%Y') AS CheckIn, DATE_FORMAT(res.CheckOutDate, '%d/%m/%Y') AS CheckOut 
           FROM Reservation res
           JOIN User u ON res.UserId = u.UserId COLLATE utf8mb4_general_ci
           JOIN Room r ON res.RoomId = r.RoomId COLLATE utf8mb4_general_ci
           JOIN Hotel h ON r.HotelId = h.HotelId COLLATE utf8mb4_general_ci
           WHERE res.ReservationId = ? COLLATE utf8mb4_general_ci`,
          [result.data.reservationId]
        );

        if (rows && rows.length > 0) {
          const info = rows[0];
          await mailer.sendBookingConfirmationEmail(
            info.Email,
            info.FullName,
            info.HotelName,
            info.CheckIn,
            info.CheckOut,
            info.RoomType,
            result.data.amountPaid
          );
        }
      } catch (mailError) {
        console.error("Lỗi khi query và gửi email xác nhận đặt phòng:", mailError);
        // Không block tiến trình trả về nếu email bị lỗi
      }
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
    if (error.message && error.message.includes("Early check-in")) {
      return fail(res, error.message, 400);
    }
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

async function webhookPayment(req, res, next) {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      return fail(res, "paymentId is required for webhook", 400);
    }

    const result = await bookingService.processPaymentWebhook({ paymentId });

    if (result.statusCode >= 400) {
      return fail(res, result.message, result.statusCode, result.data);
    }

    // Gửi tín hiệu Realtime qua Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.emit("payment_success", { paymentId });
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
  getAdminBookings,
  cancelReservation,
  getReservations,
  webhookPayment
};
