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
    const [rows] = await pool.query("CALL sp_BookRoom(?, ?, ?, ?)", [
        input.roomId,
        input.userId,
        input.checkInDate,
        input.checkOutDate
    ]);

    const row = getFirstRow(rows);
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

module.exports = {
    bookRoom,
    processCheckInPayment,
    processCheckOut
};