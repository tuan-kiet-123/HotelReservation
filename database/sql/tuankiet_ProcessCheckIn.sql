DELIMITER / /

CREATE PROCEDURE sp_ProcessCheckIn (
    IN p_ReservationId VARCHAR(255)
)
BEGIN
    DECLARE v_ResStatus VARCHAR(50);
    DECLARE v_RoomId VARCHAR(255);
    DECLARE v_CurrentPrice DECIMAL(18,2);
    DECLARE v_CheckInDate DATETIME;
    DECLARE v_CheckOutDate DATETIME;
    DECLARE v_TotalPrice DECIMAL(18,2);
    DECLARE v_PaidAmount DECIMAL(18,2);
    DECLARE v_RemainingAmount DECIMAL(18,2);
    DECLARE v_PaymentId VARCHAR(10);
    DECLARE v_PaymentSeq BIGINT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'HTTP 500: Lỗi hệ thống khi thanh toán.' AS Message;
    END;

    START TRANSACTION;

    SELECT RoomId, CheckInDate, CheckOutDate, Status
    INTO v_RoomId, v_CheckInDate, v_CheckOutDate, v_ResStatus
    FROM Reservation
    WHERE ReservationId = p_ReservationId COLLATE utf8mb4_general_ci FOR UPDATE;

    -- Chỉ đơn Confirmed mới được Check-in
    IF v_ResStatus IS NULL THEN
        ROLLBACK;
        SELECT 'HTTP 404: Không tìm thấy đơn.' AS Message;
    ELSEIF v_ResStatus != 'Confirmed' THEN
        ROLLBACK;
        SELECT 'HTTP 400: Trạng thái đơn không hợp lệ.' AS Message;
    ELSE
        SELECT CurrentPrice INTO v_CurrentPrice FROM Room WHERE RoomId = v_RoomId COLLATE utf8mb4_general_ci;
        SET v_TotalPrice = v_CurrentPrice * DATEDIFF(v_CheckOutDate, v_CheckInDate);

        -- Tính tổng tiền đã trả (Tiền cọc hoặc trả đứt)
        SELECT IFNULL(SUM(Amount), 0) INTO v_PaidAmount
        FROM Payment
        WHERE ReservationId = p_ReservationId COLLATE utf8mb4_general_ci AND Status = 'Completed';

        SET v_RemainingAmount = v_TotalPrice - v_PaidAmount;

        -- Thu nốt nếu còn thiếu
        IF v_RemainingAmount > 0 THEN
            SELECT LastNumber INTO v_PaymentSeq
            FROM IdSequence
            WHERE SequenceName = 'Payment'
            FOR UPDATE;

            SET v_PaymentSeq = v_PaymentSeq + 1;
            UPDATE IdSequence
            SET LastNumber = v_PaymentSeq
            WHERE SequenceName = 'Payment';
            SET v_PaymentId = CONCAT('PMT', LPAD(v_PaymentSeq, 7, '0'));

            INSERT INTO Payment (PaymentId, ReservationId, PaymentType, Amount, PaymentDate, Status)
            VALUES (v_PaymentId, p_ReservationId, 'FinalPayment', v_RemainingAmount, NOW(), 'Completed');
        END IF;

        -- Đổi trạng thái sang CheckedIn
        UPDATE Reservation SET Status = 'CheckedIn' WHERE ReservationId = p_ReservationId;

        COMMIT;
        SELECT 'HTTP 200: Check-in thành công!' AS Message, v_RemainingAmount AS AmountCollected;
    END IF;
END //

DELIMITER;