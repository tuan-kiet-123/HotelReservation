-- Active: 1774795782931@@mysql-13d42b0b-hotelreservation.j.aivencloud.com@19897@hotelreservation
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Procedure và Trigger của Quang
--

DELIMITER $$
--
-- Procedure Huỷ phòng
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_CancelReservation` (IN `p_ReservationId` VARCHAR(255))   BEGIN
    DECLARE v_CheckInDate DATETIME;
    DECLARE v_TotalPaid DECIMAL(15,2);
    DECLARE v_TotalAmount DECIMAL(15,2); -- Tổng giá trị đơn đặt phòng
    DECLARE v_DaysBefore INT;
    DECLARE v_RefundAmount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_PenaltyAmount DECIMAL(15,2) DEFAULT 0;
    DECLARE v_RoomId VARCHAR(255);

    -- 1. Lấy thông tin đơn đặt phòng và phòng
    SELECT CheckInDate, RoomId INTO v_CheckInDate, v_RoomId
    FROM Reservation WHERE ReservationId = p_ReservationId;

    -- 2. Tính tổng số tiền khách đã thanh toán
    SELECT SUM(Amount) INTO v_TotalPaid 
    FROM Payment 
    WHERE ReservationId = p_ReservationId AND Status = 'Completed';

    -- 3. Tính số ngày chênh lệch từ hiện tại đến ngày Check-in
    SET v_DaysBefore = DATEDIFF(v_CheckInDate, NOW());

    -- 4. Áp dụng chính sách hủy phòng
    -- Giả định v_TotalAmount là số tiền niêm yết của phòng
    SELECT BasePrice INTO v_TotalAmount FROM Room WHERE RoomId = v_RoomId;

    IF v_DaysBefore >= 30 THEN
        -- Trước 30 ngày: Hoàn 100%
        SET v_RefundAmount = v_TotalPaid;
        SET v_PenaltyAmount = 0;
    ELSEIF v_DaysBefore >= 7 AND v_DaysBefore < 30 THEN
        -- Từ 7 đến 30 ngày: Không hoàn tiền cọc (30% tổng giá trị)
        SET v_PenaltyAmount = v_TotalAmount * 0.3;
        SET v_RefundAmount = GREATEST(0, v_TotalPaid - v_PenaltyAmount);
    ELSE
        -- Trong vòng 7 ngày hoặc quá hạn: Không hoàn lại 
        SET v_PenaltyAmount = v_TotalPaid;
        SET v_RefundAmount = 0;
    END IF;

    -- 5. Cập nhật trạng thái đơn đặt và phòng
    START TRANSACTION;
        -- Chuyển trạng thái đơn đặt thành Cancelled
        UPDATE Reservation SET Status = 'Cancelled' WHERE ReservationId = p_ReservationId;
        
        -- Mở khóa phòng để người khác có thể đặt
        UPDATE Room SET Status = 1 WHERE RoomId = v_RoomId;

        -- Ghi nhận thông tin hoàn tiền
        IF v_TotalPaid > 0 THEN
            INSERT INTO Refund (RefundId, ReservationId, RefundAmount, PenaltyAmount, ProcessedAt)
            VALUES (UUID(), p_ReservationId, v_RefundAmount, v_PenaltyAmount, NOW());
        END IF;
    COMMIT;
END$$

DELIMITER ;


--
-- Trigger bảng Refund: tr_AfterRefund_InsertLedger (thêm tiền vào bảng quản lý tài chính sau khi refund)
--
DELIMITER $$
CREATE TRIGGER `tr_AfterRefund_InsertLedger` AFTER INSERT ON `refund` FOR EACH ROW BEGIN
    -- Ghi chép chi tiết sự kiện dòng tiền ra (Credit) 
    INSERT INTO FinancialLedger (
        LedgerId, 
        ReferenceId, 
        DebitAmount, 
        CreditAmount, 
        Date
    )
    VALUES (
        UUID(), 
        NEW.RefundId, -- Tham chiếu tới bảng Refund
        0,            -- Tiền vào là 0
        NEW.RefundAmount, -- Tiền ra là số tiền hoàn trả
        NOW()
    );
END
$$
DELIMITER ;


--
-- Function Lọc phòng trống: fn_CheckRoomAvailability
--
DELIMITER $$
CREATE DEFINER=`root`@`localhost` FUNCTION `fn_CheckRoomAvailability`(p_RoomId VARCHAR(255),
    p_CheckIn DATETIME,
    p_CheckOut DATETIME
) RETURNS tinyint(1)
    DETERMINISTIC
BEGIN
    DECLARE v_IsBusy INT;
    -- Kiểm tra xem có đơn đặt phòng nào đang "chiếm chỗ" giao thoa với thời gian mới không
    -- Không cần xét tới các đơn 'Cancelled' và 'Completed'
    SELECT COUNT(*) INTO v_IsBusy
    FROM Reservation
    WHERE RoomId = p_RoomId
      AND Status IN ('Confirmed', 'CheckedIn')
      AND p_CheckIn < CheckOutDate 
      AND p_CheckOut > CheckInDate;

    -- Nếu v_IsBusy > 0 nghĩa là đã có người đặt, trả về FALSE (Không khả dụng)
    IF v_IsBusy > 0 THEN
        RETURN FALSE;
    ELSE
        RETURN TRUE;
    END IF;
END$$
DELIMITER ;


--
-- Procedure Danh sách các phòng và giá thoả mãn điều kiện 
--
DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_SearchAvailableRooms`(
    IN p_CheckIn DATETIME,
    IN p_CheckOut DATETIME,
    IN p_MaxPrice DECIMAL(15,2)
)
BEGIN
    -- Lấy thông tin phòng và khách sạn thỏa mãn điều kiện
    SELECT 
        h.HotelName,
        r.RoomId,
        r.RoomType,
        r.CurrentPrice
    FROM Room r
    JOIN Hotel h ON r.HotelId = h.HotelId
    WHERE r.Status = 1 -- Phòng đang trong trạng thái hoạt động (BIT = 1)
      AND r.CurrentPrice <= p_MaxPrice
      -- Sử dụng Function để lọc những phòng thực sự trống
      AND fn_CheckRoomAvailability(r.RoomId, p_CheckIn, p_CheckOut) = TRUE;
END$$
DELIMITER ;

