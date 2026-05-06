const { pool } = require("../../config/mysql");

function parseHttpMessage(message) {
    const raw = String(message || "");
    const match = raw.match(/^HTTP\s+(\d{3})\s*:\s*(.*)$/i);

    if (!match) {
        return {
            statusCode: 200,
            message: raw || "Success"
        };
    }

    return {
        statusCode: Number(match[1]),
        message: match[2] || "Success"
    };
}

function getFirstRow(rows) {
    const firstResultSet = Array.isArray(rows) ? rows[0] : null;

    if (!Array.isArray(firstResultSet) || firstResultSet.length === 0) {
        throw new Error("Stored procedure did not return any data");
    }

    return firstResultSet[0];
}

async function bookRoom(input) {
    try {
        console.log("📝 [bookRoom] Input params:", {
            roomId: input.roomId,
            userId: input.userId,
            checkInDate: input.checkInDate,
            checkOutDate: input.checkOutDate
        });

        const [rows] = await pool.query("CALL sp_BookRoom(?, ?, ?, ?)", [
            input.roomId,
            input.userId,
            input.checkInDate,
            input.checkOutDate
        ]);

        console.log("📊 [bookRoom] Result rows:", JSON.stringify(rows, null, 2));

        const row = getFirstRow(rows);
        console.log("✅ [bookRoom] First row:", JSON.stringify(row, null, 2));

        const parsed = parseHttpMessage(row.Message);

        return {
            statusCode: parsed.statusCode,
            message: parsed.message,
            data: {
                reservationId: row.ReservationId || null,
                paymentType: row.PaymentType || null,
                amountPaid: Number(row.AmountPaid || 0)
            }
        };
    } catch (error) {
        console.error("❌ [bookRoom] ERROR:", {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage,
            stack: error.stack
        });
        throw error;
    }
}

async function processCheckInPayment(input) {
    const [rows] = await pool.query("CALL sp_ProcessCheckIn(?)", [
        input.reservationId
    ]);

    const row = getFirstRow(rows);
    const parsed = parseHttpMessage(row.Message);

    return {
        statusCode: parsed.statusCode,
        message: parsed.message,
        data: {
            amountCollected: Number(row.AmountCollected || 0)
        }
    };
}

async function processCheckOut(input) {
    const [rows] = await pool.query("CALL sp_ProcessCheckOut(?)", [
        input.reservationId
    ]);

    const row = getFirstRow(rows);
    const parsed = parseHttpMessage(row.Message);

    return {
        statusCode: parsed.statusCode,
        message: parsed.message,
        data: {
            reservationId: input.reservationId,
            status: parsed.statusCode < 400 ? "Completed" : null
        }
    };
}

async function getAdminBookings(params) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 20;
    const offset = (page - 1) * pageSize;

    const whereClauses = [];
    const values = [];

    if (params.startDate) {
        whereClauses.push('DATE(r.CheckInDate) >= ?');
        values.push(params.startDate);
    }
    if (params.endDate) {
        whereClauses.push('DATE(r.CheckInDate) <= ?');
        values.push(params.endDate);
    }
    if (params.hotelId) {
        whereClauses.push('rm.HotelId = ?');
        values.push(params.hotelId);
    }
    if (params.status) {
        whereClauses.push('r.Status = ?');
        values.push(params.status);
    }
    if (typeof params.paid !== 'undefined' && params.paid !== null) {
        const paidExistsSql = 'EXISTS (SELECT 1 FROM Payment p WHERE p.ReservationId = r.ReservationId AND p.Status = \'Completed\')';
        whereClauses.push(params.paid ? paidExistsSql : `NOT ${paidExistsSql}`);
    }
    if (params.search) {
        whereClauses.push('(r.ReservationId LIKE ? OR rm.RoomId LIKE ? OR rm.RoomType LIKE ? OR r.UserId LIKE ? OR rm.HotelId LIKE ?)');
        const like = `%${params.search}%`;
        values.push(like, like, like, like, like);
    }

    const whereSql = whereClauses.length ? ('WHERE ' + whereClauses.join(' AND ')) : '';

    // Count total
    const countSql = `SELECT COUNT(*) AS total FROM Reservation r LEFT JOIN Room rm ON rm.RoomId = r.RoomId ${whereSql}`;
    const [countRows] = await pool.query(countSql, values);
    const total = (countRows && countRows[0] && countRows[0].total) ? Number(countRows[0].total) : 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    // Query data
    const dataSql = `
        SELECT
            r.ReservationId AS id,
            r.UserId AS userId,
            rm.HotelId AS hotelId,
            rm.RoomId AS roomId,
            rm.RoomType AS room,
            DATE_FORMAT(r.CheckInDate, '%Y-%m-%d') AS checkIn,
            DATE_FORMAT(r.CheckOutDate, '%Y-%m-%d') AS checkOut,
            r.Status,
            CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM Payment p
                    WHERE p.ReservationId = r.ReservationId
                      AND p.Status = 'Completed'
                ) THEN 1
                ELSE 0
            END AS paid
        FROM Reservation r
        LEFT JOIN Room rm ON rm.RoomId = r.RoomId
        ${whereSql}
        ORDER BY r.CheckInDate DESC, r.ReservationId DESC
        LIMIT ? OFFSET ?
    `;

    const dataValues = values.concat([pageSize, offset]);
    const [rows] = await pool.query(dataSql, dataValues);

    // Map rows to expected UI shape
    const mapped = (rows || []).map(r => ({
        id: r.id,
        guest: r.userId || r.id,
        hotelId: r.hotelId || '',
        roomId: r.roomId || '',
        room: r.room || r.RoomId || '',
        checkIn: r.checkIn || null,
        checkOut: r.checkOut || null,
        status: r.Status || r.status,
        paid: Number(r.paid || 0) > 0
    }));

    return {
        data: mapped,
        page,
        pageSize,
        total,
        totalPages: Math.max(1, totalPages)
    };
}

async function getReservations(filters = {}) {
    const userId = filters.userId ? String(filters.userId).trim() : null;

    const [rows] = await pool.query(
        `
        SELECT
            r.ReservationId,
            r.RoomId,
            r.UserId,
            r.CheckInDate,
            r.CheckOutDate,
            r.Status,
            rm.HotelId AS HotelId,
            rm.RoomType AS RoomType,
            rm.CurrentPrice AS CurrentPrice,
            GREATEST(DATEDIFF(r.CheckOutDate, r.CheckInDate), 1) AS Nights,
            GREATEST(DATEDIFF(r.CheckOutDate, r.CheckInDate), 1) * rm.CurrentPrice AS TotalAmount,
            COALESCE(SUM(p.Amount), 0) AS AmountPaid
        FROM Reservation r
        INNER JOIN Room rm ON rm.RoomId = r.RoomId
        LEFT JOIN Payment p ON p.ReservationId = r.ReservationId AND p.Status = 'Completed'
        WHERE (? IS NULL OR r.UserId = ?)
        GROUP BY r.ReservationId, r.RoomId, r.UserId, r.CheckInDate, r.CheckOutDate, r.Status, rm.HotelId, rm.RoomType, rm.CurrentPrice
        ORDER BY r.CheckInDate DESC
        `,
        [userId, userId]
    );

    return {
        statusCode: 200,
        message: "Get reservations successfully",
        data: rows || []
    };
}

async function cancelReservation(input) {
    await pool.query("CALL sp_CancelReservation(?)", [input.reservationId]);

    return {
        statusCode: 200,
        message: "Reservation cancelled",
        data: {
            reservationId: input.reservationId,
            status: "Cancelled"
        }
    };
}

module.exports = {
    bookRoom,
    processCheckInPayment,
    processCheckOut,
    getAdminBookings,
    cancelReservation,
    getReservations
};
