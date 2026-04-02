DELIMITER / /

DROP PROCEDURE IF EXISTS sp_ProcessCheckOut / /

CREATE PROCEDURE sp_ProcessCheckOut (
    IN p_ReservationId VARCHAR(255)
)
BEGIN
    DECLARE v_ResStatus VARCHAR(50);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'HTTP 500: Lỗi hệ thống khi trả phòng.' AS Message;
    END;

    START TRANSACTION;

    SELECT Status
    INTO v_ResStatus
    FROM Reservation
    WHERE ReservationId = p_ReservationId COLLATE utf8mb4_general_ci
    FOR UPDATE;

    IF v_ResStatus IS NULL THEN
        ROLLBACK;
        SELECT 'HTTP 404: Không tìm thấy đơn.' AS Message;
    ELSEIF v_ResStatus COLLATE utf8mb4_general_ci <> 'CheckedIn' THEN
        ROLLBACK;
        SELECT 'HTTP 400: Chỉ đơn CheckedIn mới được trả phòng.' AS Message;
    ELSE
        UPDATE Reservation
        SET Status = 'Completed'
        WHERE ReservationId = p_ReservationId COLLATE utf8mb4_general_ci;

        COMMIT;
        SELECT 'HTTP 200: Trả phòng thành công!' AS Message;
    END IF;
END //

DELIMITER;