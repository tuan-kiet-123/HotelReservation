require("dotenv").config({ path: __dirname + "/../.env" });
const mysql = require("mysql2/promise");

async function updateProcedure() {
    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        ssl: { rejectUnauthorized: false }
    });

    console.log("Connected to MySQL Aiven");

    await connection.query("DROP PROCEDURE IF EXISTS sp_CancelReservation");

    const createQuery = `
    CREATE PROCEDURE sp_CancelReservation (IN p_ReservationId VARCHAR(255))
    BEGIN
        DECLARE v_CheckInDate DATETIME;
        DECLARE v_TotalPaid DECIMAL(15,2);
        DECLARE v_TotalAmount DECIMAL(15,2);
        DECLARE v_DaysBefore INT;
        DECLARE v_RefundAmount DECIMAL(15,2) DEFAULT 0;
        DECLARE v_PenaltyAmount DECIMAL(15,2) DEFAULT 0;
        DECLARE v_RoomId VARCHAR(255);
        DECLARE v_RefundId VARCHAR(10);

        SELECT CheckInDate, RoomId INTO v_CheckInDate, v_RoomId
        FROM Reservation
        WHERE ReservationId = CONVERT(p_ReservationId USING utf8mb4) COLLATE utf8mb4_general_ci;

        SELECT SUM(Amount) INTO v_TotalPaid 
        FROM Payment 
        WHERE ReservationId = CONVERT(p_ReservationId USING utf8mb4) COLLATE utf8mb4_general_ci
            AND Status = 'Completed';

        SET v_DaysBefore = DATEDIFF(v_CheckInDate, NOW());

        -- Tính tổng giá trị đơn đặt phòng (giá mỗi đêm × số đêm)
        SELECT rm.CurrentPrice * DATEDIFF(r.CheckOutDate, r.CheckInDate) INTO v_TotalAmount 
        FROM Room rm 
        INNER JOIN Reservation r ON r.RoomId = rm.RoomId
        WHERE r.ReservationId = CONVERT(p_ReservationId USING utf8mb4) COLLATE utf8mb4_general_ci;

        IF v_DaysBefore >= 30 THEN
            -- Trước 30 ngày: hoàn 100%
            SET v_RefundAmount = v_TotalPaid;
            SET v_PenaltyAmount = 0;
        ELSEIF v_DaysBefore >= 7 AND v_DaysBefore < 30 THEN
            -- Từ 7 đến 30 ngày: không hoàn cọc (phạt 30% tổng giá đơn)
            SET v_PenaltyAmount = v_TotalAmount * 0.3;
            SET v_RefundAmount = GREATEST(0, v_TotalPaid - v_PenaltyAmount);
        ELSE
            -- Trong vòng 7 ngày hoặc quá hạn: không hoàn
            SET v_PenaltyAmount = v_TotalPaid;
            SET v_RefundAmount = 0;
        END IF;

        START TRANSACTION;
            UPDATE Reservation
            SET Status = 'Cancelled'
            WHERE ReservationId = CONVERT(p_ReservationId USING utf8mb4) COLLATE utf8mb4_general_ci;
        
            UPDATE Room SET Status = 1 WHERE RoomId = v_RoomId;

            IF v_TotalPaid > 0 THEN
                SET v_RefundId = SUBSTRING(REPLACE(UUID(), '-', ''), 1, 10);
                INSERT INTO Refund (RefundId, ReservationId, RefundAmount, PenaltyAmount, ProcessedAt)
                VALUES (v_RefundId, CONVERT(p_ReservationId USING utf8mb4) COLLATE utf8mb4_general_ci, v_RefundAmount, v_PenaltyAmount, NOW());
            END IF;
        COMMIT;
    END
    `;

    try {
        await connection.query(createQuery);
        console.log("Successfully updated sp_CancelReservation!");
        
        // Verify with test calculation
        const [test] = await connection.query(`
            SELECT 
                rm.CurrentPrice * DATEDIFF(r.CheckOutDate, r.CheckInDate) AS TotalBookingAmount,
                DATEDIFF(r.CheckInDate, NOW()) AS DaysBefore,
                (rm.CurrentPrice * DATEDIFF(r.CheckOutDate, r.CheckInDate)) * 0.3 AS ExpectedPenalty
            FROM Reservation r
            INNER JOIN Room rm ON rm.RoomId = r.RoomId
            WHERE r.ReservationId = 'RSV9100045'
        `);
        console.log("Test calculation for RSV9100045:", test[0]);
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await connection.end();
    }
}

updateProcedure();
