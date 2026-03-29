DELIMITER / /

CREATE PROCEDURE sp_BookRoom (
    IN p_RoomId VARCHAR(255),
    IN p_UserId VARCHAR(255),
    IN p_CheckInDate DATETIME,
    IN p_CheckOutDate DATETIME
)
BEGIN
    DECLARE v_RoomStatus TINYINT;
    DECLARE v_CurrentPrice DECIMAL(18,2);
    DECLARE v_OverlapCount INT;
    DECLARE v_TotalPrice DECIMAL(18,2);
    DECLARE v_DaysUntilCheckIn INT;
    DECLARE v_AmountToPay DECIMAL(18,2);
    DECLARE v_PaymentType VARCHAR(50);
    DECLARE v_ReservationId VARCHAR(10);
    DECLARE v_PaymentId VARCHAR(10);
    DECLARE v_ReservationSeq BIGINT;
    DECLARE v_PaymentSeq BIGINT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'HTTP 500: Lỗi hệ thống. Đã hủy giao dịch.' AS Message;
    END;

    IF DATE(p_CheckInDate) < CURDATE() OR DATE(p_CheckOutDate) <= DATE(p_CheckInDate) THEN
        SELECT 'HTTP 400: Ngày nhận/trả phòng không hợp lệ.' AS Message;
    ELSE
        START TRANSACTION;

        SELECT LastNumber INTO v_ReservationSeq
        FROM IdSequence
        WHERE SequenceName = 'Reservation'
        FOR UPDATE;

        SET v_ReservationSeq = v_ReservationSeq + 1;
        UPDATE IdSequence
        SET LastNumber = v_ReservationSeq
        WHERE SequenceName = 'Reservation';
        SET v_ReservationId = CONCAT('RSV', LPAD(v_ReservationSeq, 7, '0'));

        SELECT LastNumber INTO v_PaymentSeq
        FROM IdSequence
        WHERE SequenceName = 'Payment'
        FOR UPDATE;

        SET v_PaymentSeq = v_PaymentSeq + 1;
        UPDATE IdSequence
        SET LastNumber = v_PaymentSeq
        WHERE SequenceName = 'Payment';
        SET v_PaymentId = CONCAT('PMT', LPAD(v_PaymentSeq, 7, '0'));

        SELECT Status, CurrentPrice INTO v_RoomStatus, v_CurrentPrice
        FROM Room WHERE RoomId = p_RoomId COLLATE utf8mb4_general_ci FOR UPDATE;

        IF v_RoomStatus = 0 THEN
            ROLLBACK;
            SELECT 'HTTP 403: Phòng đang bảo trì.' AS Message;
        ELSE
                        SELECT COUNT(*) INTO v_OverlapCount
                        FROM Reservation
                        WHERE RoomId = p_RoomId COLLATE utf8mb4_general_ci
              AND Status IN ('Confirmed', 'CheckedIn')
              AND (p_CheckInDate < CheckOutDate AND p_CheckOutDate > CheckInDate);

            IF v_OverlapCount > 0 THEN
                ROLLBACK;
                SELECT 'HTTP 409: Phòng đã có người đặt trong khoảng thời gian này.' AS Message;
            ELSE
                SET v_TotalPrice = v_CurrentPrice * DATEDIFF(p_CheckOutDate, p_CheckInDate);
                SET v_DaysUntilCheckIn = DATEDIFF(p_CheckInDate, CURDATE());

                IF v_DaysUntilCheckIn >= 7 THEN
                    SET v_AmountToPay = v_TotalPrice * 0.3;
                    SET v_PaymentType = 'Deposit';
                ELSE
                    SET v_AmountToPay = v_TotalPrice;
                    SET v_PaymentType = 'FullPayment';
                END IF;

                INSERT INTO Reservation (ReservationId, RoomId, UserId, CheckInDate, CheckOutDate, Status)
                VALUES (v_ReservationId, p_RoomId, p_UserId, p_CheckInDate, p_CheckOutDate, 'Confirmed');

                INSERT INTO Payment (PaymentId, ReservationId, PaymentType, Amount, PaymentDate, Status)
                VALUES (v_PaymentId, v_ReservationId, v_PaymentType, v_AmountToPay, NOW(), 'Completed');

                COMMIT;
                SELECT 'HTTP 200: Đặt phòng thành công!' AS Message, v_ReservationId AS ReservationId, v_PaymentType AS PaymentType, v_AmountToPay AS AmountPaid;
            END IF;
        END IF;
    END IF;
END
//

DELIMITER;