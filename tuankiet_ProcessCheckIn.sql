DELIMITER //
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
    DECLARE v_PaymentId VARCHAR(255);
    DECLARE v_LedgerId VARCHAR(255);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'HTTP 500: Lỗi hệ thống khi thanh toán.' AS Message;
    END;

    START TRANSACTION;

    SELECT RoomId, CheckInDate, CheckOutDate, Status
    INTO v_RoomId, v_CheckInDate, v_CheckOutDate, v_ResStatus
    FROM Reservation
    WHERE ReservationId = p_ReservationId FOR UPDATE;

    -- Chỉ đơn Confirmed mới được Check-in
    IF v_ResStatus IS NULL THEN
        ROLLBACK;
        SELECT 'HTTP 404: Không tìm thấy đơn.' AS Message;
    ELSEIF v_ResStatus != 'Confirmed' THEN
        ROLLBACK;
        SELECT 'HTTP 400: Trạng thái đơn không hợp lệ.' AS Message;
    ELSE
        SELECT CurrentPrice INTO v_CurrentPrice FROM Room WHERE RoomId = v_RoomId;
        SET v_TotalPrice = v_CurrentPrice * DATEDIFF(v_CheckOutDate, v_CheckInDate);

        -- Tính tổng tiền đã trả (Tiền cọc hoặc trả đứt)
        SELECT IFNULL(SUM(Amount), 0) INTO v_PaidAmount
        FROM Payment
        WHERE ReservationId = p_ReservationId AND Status = 'Completed';

        SET v_RemainingAmount = v_TotalPrice - v_PaidAmount;

        -- Thu nốt nếu còn thiếu
        IF v_RemainingAmount > 0 THEN
            SET v_PaymentId = UUID();
            SET v_LedgerId = UUID();

            INSERT INTO Payment (PaymentId, ReservationId, PaymentType, Amount, PaymentDate, Status)
            VALUES (v_PaymentId, p_ReservationId, 'FinalPayment', v_RemainingAmount, NOW(), 'Completed');

            INSERT INTO FinancialLedger (LedgerId, ReferenceId, DebitAmount, CreditAmount, Date)
            VALUES (v_LedgerId, v_PaymentId, 0, v_RemainingAmount, NOW());
        END IF;

        -- Đổi trạng thái sang CheckedIn
        UPDATE Reservation SET Status = 'CheckedIn' WHERE ReservationId = p_ReservationId;

        COMMIT;
        SELECT 'HTTP 200: Check-in thành công!' AS Message, v_RemainingAmount AS AmountCollected;
    END IF;
END //
DELIMITER ;