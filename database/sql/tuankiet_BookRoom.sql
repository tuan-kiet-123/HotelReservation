DELIMITER //
CREATE PROCEDURE sp_BookRoom (
    IN p_RoomId VARCHAR(255),
    IN p_UserId VARCHAR(255),
    IN p_CheckInDate DATETIME,
    IN p_CheckOutDate DATETIME
)
BEGIN
    DECLARE v_RoomStatus BIT;
    DECLARE v_CurrentPrice DECIMAL(18,2);
    DECLARE v_OverlapCount INT;
    DECLARE v_TotalPrice DECIMAL(18,2);
    DECLARE v_DaysUntilCheckIn INT;
    DECLARE v_AmountToPay DECIMAL(18,2);
    DECLARE v_PaymentType VARCHAR(50);
    DECLARE v_ReservationId VARCHAR(255);
    DECLARE v_PaymentId VARCHAR(255);
    DECLARE v_LedgerId VARCHAR(255);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'HTTP 500: Lỗi hệ thống. Đã hủy giao dịch.' AS Message;
    END;

    IF DATE(p_CheckInDate) < CURDATE() OR DATE(p_CheckOutDate) <= DATE(p_CheckInDate) THEN
        SELECT 'HTTP 400: Ngày nhận/trả phòng không hợp lệ.' AS Message;
    ELSE
        SET v_ReservationId = UUID();
        SET v_PaymentId = UUID();
        SET v_LedgerId = UUID();

        START TRANSACTION;

        -- Khóa phòng và kiểm tra trạng thái bảo trì
        SELECT Status, CurrentPrice INTO v_RoomStatus, v_CurrentPrice
        FROM Room WHERE RoomId = p_RoomId FOR UPDATE;

        IF v_RoomStatus = 0 THEN
            ROLLBACK;
            SELECT 'HTTP 403: Phòng đang bảo trì.' AS Message;
        ELSE
            -- Kiểm tra xem phòng đã có người đặt trong khoảng ngày này chưa (chỉ đếm đơn Confirmed và CheckedIn)
            SELECT COUNT(*) INTO v_OverlapCount
            FROM Reservation
            WHERE RoomId = p_RoomId
              AND Status IN ('Confirmed', 'CheckedIn')
              AND (p_CheckInDate < CheckOutDate AND p_CheckOutDate > CheckInDate);

            IF v_OverlapCount > 0 THEN
                ROLLBACK;
                SELECT 'HTTP 409: Phòng đã có người đặt trong khoảng thời gian này.' AS Message;
            ELSE
                SET v_TotalPrice = v_CurrentPrice * DATEDIFF(p_CheckOutDate, p_CheckInDate);
                SET v_DaysUntilCheckIn = DATEDIFF(p_CheckInDate, CURDATE());

                -- Phân loại thanh toán theo luật [cite: 174, 175, 225]
                IF v_DaysUntilCheckIn >= 7 THEN
                    SET v_AmountToPay = v_TotalPrice * 0.3;
                    SET v_PaymentType = 'Deposit';
                ELSE
                    SET v_AmountToPay = v_TotalPrice;
                    SET v_PaymentType = 'FullPayment';
                END IF;

                -- Ghi nhận dữ liệu [cite: 220, 225, 230]
                INSERT INTO Reservation (ReservationId, RoomId, UserId, CheckInDate, CheckOutDate, Status)
                VALUES (v_ReservationId, p_RoomId, p_UserId, p_CheckInDate, p_CheckOutDate, 'Confirmed');

                INSERT INTO Payment (PaymentId, ReservationId, PaymentType, Amount, PaymentDate, Status)
                VALUES (v_PaymentId, v_ReservationId, v_PaymentType, v_AmountToPay, NOW(), 'Completed');

                INSERT INTO FinancialLedger (LedgerId, ReferenceId, DebitAmount, CreditAmount, Date)
                VALUES (v_LedgerId, v_PaymentId, 0, v_AmountToPay, NOW());

                COMMIT;
                SELECT 'HTTP 200: Đặt phòng thành công!' AS Message, v_ReservationId AS ReservationId, v_PaymentType AS PaymentType, v_AmountToPay AS AmountPaid;
            END IF;
        END IF;
    END IF;
END //
DELIMITER ;