-- ========================================================
-- PHẦN 1: TẠO BẢNG & RÀNG BUỘC (Từ hotelreservation.sql)
-- ========================================================

CREATE TABLE IF NOT EXISTS `FinancialLedger` (
  `LedgerId` varchar(10) NOT NULL Primary Key,
  `ReferenceId` varchar(10) NOT NULL,
  `EventType` varchar(50) NOT NULL,
  `DebitAmount` decimal(18,2),
  `CreditAmount` decimal(18,2),
  `Date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `Hotel` (
  `HotelId` varchar(24) NOT NULL Primary Key,
  `Status` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `Payment` (
  `PaymentId` varchar(10) NOT NULL Primary Key,
  `ReservationId` varchar(10) NOT NULL,
  `PaymentType` varchar(50) NOT NULL,
  `Amount` decimal(18,2) NOT NULL,
  `PaymentDate` datetime DEFAULT current_timestamp(),
  `Status` varchar(50) DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `PriceChangeLog` (
  `LogId` varchar(10) NOT NULL Primary Key,
  `RoomId` varchar(10) NOT NULL,
  `OldPrice` decimal(18,2),
  `NewPrice` decimal(18,2),
  `ChangedAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `Refund` (
  `RefundId` varchar(10) NOT NULL Primary Key,
  `ReservationId` varchar(10) NOT NULL,
  `RefundAmount` decimal(18,2),
  `PenaltyAmount` decimal(18,2),
  `ProcessedAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `Reservation` (
  `ReservationId` varchar(10) NOT NULL Primary Key,
  `RoomId` varchar(10) NOT NULL,
  `UserId` varchar(10),
  `CheckInDate` datetime NOT NULL,
  `CheckOutDate` datetime NOT NULL,
  `Status` varchar(20) DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `Room` (
  `RoomId` varchar(10) NOT NULL Primary Key,
  `HotelId` varchar(24) NOT NULL,
  `RoomType` varchar(100),
  `BasePrice` decimal(18,2) NOT NULL,
  `CurrentPrice` decimal(18,2),
  `Status` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `User` (
  `UserId` varchar(10) NOT NULL Primary Key,
  `FullName` varchar(255) NOT NULL,
  `Email` varchar(255) NOT NULL UNIQUE,
  `Password` varchar(255) NOT NULL,
  `Role` varchar(50) DEFAULT 'Customer'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- INDEXES & FKS
ALTER TABLE `Payment` ADD INDEX `idx_Payment_ReservationId` (`ReservationId`);
ALTER TABLE `Payment` ADD CONSTRAINT `fk_Payment_Reservation` FOREIGN KEY (`ReservationId`) REFERENCES `Reservation` (`ReservationId`);
ALTER TABLE `Payment` ADD CONSTRAINT `chk_Payment_Amount` CHECK (`Amount` >= 0);

ALTER TABLE `PriceChangeLog` ADD INDEX `idx_PriceChangeLog_RoomId` (`RoomId`);
ALTER TABLE `PriceChangeLog` ADD CONSTRAINT `fk_PriceChangeLog_Room` FOREIGN KEY (`RoomId`) REFERENCES `Room` (`RoomId`);

ALTER TABLE `Refund` ADD INDEX `idx_Refund_ReservationId` (`ReservationId`);
ALTER TABLE `Refund` ADD CONSTRAINT `fk_Refund_Reservation` FOREIGN KEY (`ReservationId`) REFERENCES `Reservation` (`ReservationId`);
ALTER TABLE `Refund` ADD CONSTRAINT `chk_Refund_Amount` CHECK (`RefundAmount` >= 0 AND `PenaltyAmount` >= 0);

ALTER TABLE `Reservation` ADD INDEX `idx_Reservation_RoomId` (`RoomId`);
ALTER TABLE `Reservation` ADD CONSTRAINT `fk_Reservation_Room` FOREIGN KEY (`RoomId`) REFERENCES `Room` (`RoomId`);
ALTER TABLE `Reservation` ADD CONSTRAINT `chk_Reservation_Dates` CHECK (`CheckOutDate` > `CheckInDate`);

ALTER TABLE `Room` ADD INDEX `idx_Room_HotelId` (`HotelId`);
ALTER TABLE `Room` ADD CONSTRAINT `fk_Hotel_Room` FOREIGN KEY (`HotelId`) REFERENCES `Hotel` (`HotelId`);
ALTER TABLE `Room` ADD CONSTRAINT `chk_Room_Price` CHECK (`BasePrice` >= 0 AND `CurrentPrice` >= 0);

ALTER TABLE `FinancialLedger` ADD CONSTRAINT `chk_Ledger_Amount` CHECK (`DebitAmount` >= 0 AND `CreditAmount` >= 0);

CREATE INDEX `idx_Reservation_UserId` ON `Reservation` (`UserId`);
CREATE INDEX `idx_Ledger_ReferenceId` ON `FinancialLedger` (`ReferenceId`);
CREATE INDEX `idx_Reservation_Status` ON `Reservation` (`Status`);

INSERT IGNORE INTO `User` (`UserId`, `FullName`, `Email`, `Password`, `Role`) VALUES 
('US00000001', 'Nguyen Van A', 'demo1@davinci.com', '123456', 'Customer'),
('US00000002', 'Le Thi B', 'demo2@davinci.com', '123456', 'Customer'),
('US00000003', 'Tran Van C', 'demo3@davinci.com', '123456', 'Customer'),
('AD00000001', 'Admin DaVinci', 'admin@davinci.com', 'admin123', 'Admin');

-- ========================================================
-- PHẦN 2: ID SEQUENCE (Từ idsequence.sql)
-- ========================================================
CREATE TABLE IF NOT EXISTS IdSequence (
    SequenceName VARCHAR(30) NOT NULL PRIMARY KEY,
    LastNumber BIGINT NOT NULL DEFAULT 0
);

INSERT INTO IdSequence (SequenceName, LastNumber) VALUES ('Reservation', 0) ON DUPLICATE KEY UPDATE LastNumber = LastNumber;
INSERT INTO IdSequence (SequenceName, LastNumber) VALUES ('Payment', 0) ON DUPLICATE KEY UPDATE LastNumber = LastNumber;

-- ========================================================
-- PHẦN 3: FUNCTION (Từ function.sql)
-- ========================================================
DELIMITER $$
DROP FUNCTION IF EXISTS `fn_CheckRoomAvailability`$$
CREATE FUNCTION `fn_CheckRoomAvailability`(p_RoomId VARCHAR(255),
	p_CheckIn DATETIME,
	p_CheckOut DATETIME
) RETURNS tinyint(1)
	DETERMINISTIC
BEGIN
	DECLARE v_IsBusy INT;
	SELECT COUNT(*) INTO v_IsBusy
	FROM Reservation
	WHERE RoomId = p_RoomId
	  AND Status IN ('Confirmed', 'CheckedIn')
	  AND p_CheckIn < CheckOutDate 
	  AND p_CheckOut > CheckInDate;

	IF v_IsBusy > 0 THEN
		RETURN FALSE;
	ELSE
		RETURN TRUE;
	END IF;
END$$
DELIMITER ;

-- ========================================================
-- PHẦN 4: TRIGGER (Từ trigger.sql)
-- ========================================================
DELIMITER $$
DROP TRIGGER IF EXISTS TRG_AutoLog_Payment$$
CREATE TRIGGER TRG_AutoLog_Payment
AFTER INSERT ON Payment
FOR EACH ROW
BEGIN
	DECLARE v_event_type VARCHAR(50);
	SET v_event_type = CASE UPPER(TRIM(COALESCE(NEW.PaymentType, '')))
		WHEN 'DEPOSIT' THEN 'Deposit'
		WHEN 'FINALPAYMENT' THEN 'FinalPayment'
		WHEN 'FULLPAYMENT' THEN 'FullPayment'
		ELSE 'FullPayment'
	END;

	IF UPPER(TRIM(COALESCE(NEW.Status, ''))) = 'COMPLETED' THEN
		INSERT INTO FinancialLedger (LedgerId, ReferenceId, EventType, DebitAmount, CreditAmount, Date)
		VALUES (SUBSTRING(REPLACE(UUID(), '-', ''), 1, 10), NEW.PaymentId, v_event_type, NEW.Amount, 0, COALESCE(NEW.PaymentDate, CURRENT_TIMESTAMP));
	END IF;
END$$

DROP TRIGGER IF EXISTS TRG_AutoLog_Refund$$
CREATE TRIGGER TRG_AutoLog_Refund
AFTER INSERT ON Refund
FOR EACH ROW
BEGIN
	IF COALESCE(NEW.RefundAmount, 0) > 0 THEN
		INSERT INTO FinancialLedger (LedgerId, ReferenceId, EventType, DebitAmount, CreditAmount, Date)
		VALUES (SUBSTRING(REPLACE(UUID(), '-', ''), 1, 10), NEW.RefundId, 'RefundPayout', 0, NEW.RefundAmount, COALESCE(NEW.ProcessedAt, CURRENT_TIMESTAMP));
	END IF;

	IF COALESCE(NEW.PenaltyAmount, 0) > 0 THEN
		INSERT INTO FinancialLedger (LedgerId, ReferenceId, EventType, DebitAmount, CreditAmount, Date)
		VALUES (SUBSTRING(REPLACE(UUID(), '-', ''), 1, 10), NEW.RefundId, 'PenaltyRevenue', NEW.PenaltyAmount, 0, COALESCE(NEW.ProcessedAt, CURRENT_TIMESTAMP));
	END IF;
END$$

DROP TRIGGER IF EXISTS TRG_AuditPriceChange$$
CREATE TRIGGER TRG_AuditPriceChange
AFTER UPDATE ON Room
FOR EACH ROW
BEGIN
	IF NEW.CurrentPrice IS NOT NULL
		 AND (OLD.CurrentPrice IS NULL OR NEW.CurrentPrice <> OLD.CurrentPrice)
		 AND NEW.BasePrice > 0
		 AND ABS(NEW.CurrentPrice - NEW.BasePrice) / NEW.BasePrice > 0.5 THEN
		INSERT INTO PriceChangeLog (LogId, RoomId, OldPrice, NewPrice, ChangedAt)
		VALUES (SUBSTRING(REPLACE(UUID(), '-', ''), 1, 10), NEW.RoomId, OLD.CurrentPrice, NEW.CurrentPrice, CURRENT_TIMESTAMP);
	END IF;
END$$
DELIMITER ;

-- ========================================================
-- PHẦN 5: PROCEDURE (Từ procedure.sql)
-- ========================================================
DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_SearchAvailableRooms`$$
CREATE PROCEDURE `sp_SearchAvailableRooms`(
		IN p_CheckIn DATETIME,
		IN p_CheckOut DATETIME,
		IN p_MaxPrice DECIMAL(15,2),
		IN p_RoomType VARCHAR(100)
)
BEGIN
		SELECT 
			r.HotelId,
			r.RoomId,
			r.RoomType,
			r.CurrentPrice
		FROM Room r
		WHERE r.Status = 1
			AND (p_MaxPrice IS NULL OR r.CurrentPrice <= p_MaxPrice)
			AND (p_RoomType IS NULL OR p_RoomType = '' OR r.RoomType = p_RoomType)
			AND fn_CheckRoomAvailability(r.RoomId, p_CheckIn, p_CheckOut) = TRUE;
END$$

DROP PROCEDURE IF EXISTS sp_BookRoom$$
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

        SELECT LastNumber INTO v_ReservationSeq FROM IdSequence WHERE SequenceName = 'Reservation' FOR UPDATE;
        SET v_ReservationSeq = v_ReservationSeq + 1;
        UPDATE IdSequence SET LastNumber = v_ReservationSeq WHERE SequenceName = 'Reservation';
        SET v_ReservationId = CONCAT('RSV', LPAD(v_ReservationSeq, 7, '0'));

        SELECT LastNumber INTO v_PaymentSeq FROM IdSequence WHERE SequenceName = 'Payment' FOR UPDATE;
        SET v_PaymentSeq = v_PaymentSeq + 1;
        UPDATE IdSequence SET LastNumber = v_PaymentSeq WHERE SequenceName = 'Payment';
        SET v_PaymentId = CONCAT('PMT', LPAD(v_PaymentSeq, 7, '0'));

        SELECT Status, CurrentPrice INTO v_RoomStatus, v_CurrentPrice
        FROM Room WHERE RoomId = p_RoomId COLLATE utf8mb4_general_ci FOR UPDATE;

        IF v_RoomStatus IS NULL THEN
            ROLLBACK;
            SELECT 'HTTP 404: Không tìm thấy phòng.' AS Message;
        ELSEIF v_RoomStatus = 0 THEN
            ROLLBACK;
            SELECT 'HTTP 403: Phòng đang bảo trì.' AS Message;
        ELSE
            SELECT COUNT(*) INTO v_OverlapCount
            FROM Reservation
            WHERE RoomId = p_RoomId COLLATE utf8mb4_general_ci
              AND Status IN ('Confirmed', 'CheckedIn', 'Pending')
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
                VALUES (v_ReservationId, p_RoomId, p_UserId, p_CheckInDate, p_CheckOutDate, 'Pending');

                INSERT INTO Payment (PaymentId, ReservationId, PaymentType, Amount, PaymentDate, Status)
                VALUES (v_PaymentId, v_ReservationId, v_PaymentType, v_AmountToPay, NOW(), 'Pending');

                COMMIT;
                SELECT 'HTTP 200: Tạo giao dịch chờ thanh toán thành công!' AS Message, v_ReservationId AS ReservationId, v_PaymentId AS PaymentId, v_PaymentType AS PaymentType, v_AmountToPay AS AmountPaid;
            END IF;
        END IF;
    END IF;
END$$

DROP PROCEDURE IF EXISTS sp_ConfirmBookingWebhook$$
CREATE PROCEDURE sp_ConfirmBookingWebhook (
    IN p_PaymentId VARCHAR(255)
)
BEGIN
    DECLARE v_ReservationId VARCHAR(10);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'HTTP 500: Lỗi hệ thống Webhook.' AS Message;
    END;

    START TRANSACTION;
    
    -- Lấy mã ReservationId tương ứng
    SELECT ReservationId INTO v_ReservationId FROM Payment WHERE PaymentId = p_PaymentId;
    
    IF v_ReservationId IS NULL THEN
        ROLLBACK;
        SELECT 'HTTP 404: Không tìm thấy giao dịch thanh toán.' AS Message;
    ELSE
        UPDATE Payment SET Status = 'Completed', PaymentDate = NOW() WHERE PaymentId = p_PaymentId;
        UPDATE Reservation SET Status = 'Confirmed' WHERE ReservationId = v_ReservationId;
        COMMIT;
        
        SELECT 'HTTP 200: Xác nhận thanh toán thành công, đơn hàng đã Confirm!' AS Message;
    END IF;
END$$

DROP PROCEDURE IF EXISTS sp_CancelReservation$$
CREATE PROCEDURE `sp_CancelReservation` (IN `p_ReservationId` VARCHAR(255))
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

		SELECT CurrentPrice * DATEDIFF(r.CheckOutDate, r.CheckInDate) INTO v_TotalAmount 
		FROM Room rm 
		INNER JOIN Reservation r ON r.RoomId = rm.RoomId
		WHERE r.ReservationId = CONVERT(p_ReservationId USING utf8mb4) COLLATE utf8mb4_general_ci;

		IF v_DaysBefore >= 30 THEN
				SET v_RefundAmount = v_TotalPaid;
				SET v_PenaltyAmount = 0;
		ELSEIF v_DaysBefore >= 7 AND v_DaysBefore < 30 THEN
				SET v_PenaltyAmount = v_TotalAmount * 0.3;
				SET v_RefundAmount = GREATEST(0, v_TotalPaid - v_PenaltyAmount);
		ELSE
				SET v_PenaltyAmount = v_TotalPaid;
				SET v_RefundAmount = 0;
		END IF;

		START TRANSACTION;
				UPDATE Reservation SET Status = 'Cancelled' WHERE ReservationId = CONVERT(p_ReservationId USING utf8mb4) COLLATE utf8mb4_general_ci;
				UPDATE Room SET Status = 1 WHERE RoomId = v_RoomId;

				IF v_TotalPaid > 0 THEN
						SET v_RefundId = SUBSTRING(REPLACE(UUID(), '-', ''), 1, 10);
						INSERT INTO Refund (RefundId, ReservationId, RefundAmount, PenaltyAmount, ProcessedAt)
						VALUES (v_RefundId, CONVERT(p_ReservationId USING utf8mb4) COLLATE utf8mb4_general_ci, v_RefundAmount, v_PenaltyAmount, NOW());
				END IF;
		COMMIT;
END$$

DROP PROCEDURE IF EXISTS sp_ProcessCheckIn$$
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
	SELECT RoomId, CheckInDate, CheckOutDate, Status INTO v_RoomId, v_CheckInDate, v_CheckOutDate, v_ResStatus
	FROM Reservation WHERE ReservationId = p_ReservationId COLLATE utf8mb4_general_ci FOR UPDATE;

	IF v_ResStatus IS NULL THEN
		ROLLBACK;
		SELECT 'HTTP 404: Không tìm thấy đơn.' AS Message;
	ELSEIF v_ResStatus COLLATE utf8mb4_general_ci <> 'Confirmed' THEN
		ROLLBACK;
		SELECT 'HTTP 400: Trạng thái đơn không hợp lệ.' AS Message;
	ELSE
		SELECT CurrentPrice INTO v_CurrentPrice FROM Room WHERE RoomId = v_RoomId COLLATE utf8mb4_general_ci;
		SET v_TotalPrice = v_CurrentPrice * DATEDIFF(v_CheckOutDate, v_CheckInDate);

		SELECT IFNULL(SUM(Amount), 0) INTO v_PaidAmount FROM Payment
		WHERE ReservationId = p_ReservationId COLLATE utf8mb4_general_ci AND Status = 'Completed';

		SET v_RemainingAmount = v_TotalPrice - v_PaidAmount;

		IF v_RemainingAmount > 0 THEN
			SELECT LastNumber INTO v_PaymentSeq FROM IdSequence WHERE SequenceName = 'Payment' FOR UPDATE;
			SET v_PaymentSeq = v_PaymentSeq + 1;
			UPDATE IdSequence SET LastNumber = v_PaymentSeq WHERE SequenceName = 'Payment';
			SET v_PaymentId = CONCAT('PMT', LPAD(v_PaymentSeq, 7, '0'));

			INSERT INTO Payment (PaymentId, ReservationId, PaymentType, Amount, PaymentDate, Status)
			VALUES (v_PaymentId, p_ReservationId, 'FinalPayment', v_RemainingAmount, NOW(), 'Completed');
		END IF;

		UPDATE Reservation SET Status = 'CheckedIn' WHERE ReservationId = p_ReservationId COLLATE utf8mb4_general_ci;
		COMMIT;
		SELECT 'HTTP 200: Check-in thành công!' AS Message, v_RemainingAmount AS AmountCollected;
	END IF;
END$$

DROP PROCEDURE IF EXISTS sp_ProcessCheckOut$$
CREATE PROCEDURE sp_ProcessCheckOut(
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
    SELECT Status INTO v_ResStatus FROM Reservation WHERE ReservationId = p_ReservationId COLLATE utf8mb4_general_ci FOR UPDATE;

    IF v_ResStatus IS NULL THEN
        ROLLBACK;
        SELECT 'HTTP 404: Không tìm thấy đơn.' AS Message;
    ELSEIF v_ResStatus COLLATE utf8mb4_general_ci <> 'CheckedIn' THEN
        ROLLBACK;
        SELECT 'HTTP 400: Chỉ đơn CheckedIn mới được trả phòng.' AS Message;
    ELSE
        UPDATE Reservation SET Status = 'Completed' WHERE ReservationId = p_ReservationId COLLATE utf8mb4_general_ci;
        COMMIT;
        SELECT 'HTTP 200: Trả phòng thành công!' AS Message;
    END IF;
END$$
DELIMITER ;

-- ========================================================
-- PHẦN 6: ADMIN PROCEDURES (Báo cáo)
-- ========================================================
DELIMITER $$
DROP PROCEDURE IF EXISTS SP_Generate_QuarterlyTop3Rooms$$
CREATE PROCEDURE SP_Generate_QuarterlyTop3Rooms(
	IN p_year INT,
	IN p_quarter TINYINT
)
BEGIN
	DROP TEMPORARY TABLE IF EXISTS tmp_mapped_ledger;
	CREATE TEMPORARY TABLE tmp_mapped_ledger (
		LedgerId VARCHAR(10) NOT NULL,
		EventType VARCHAR(50),
		DebitAmount DECIMAL(15, 2),
		CreditAmount DECIMAL(15, 2),
		Date DATETIME,
		HotelId VARCHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
		RoomId VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
		PRIMARY KEY (LedgerId)
	);

	INSERT INTO tmp_mapped_ledger
	SELECT
		fl.LedgerId, fl.EventType, fl.DebitAmount, fl.CreditAmount, fl.Date, rm.HotelId, rs.RoomId
	FROM FinancialLedger fl
	INNER JOIN Payment p ON p.PaymentId = fl.ReferenceId
	INNER JOIN Reservation rs ON rs.ReservationId = p.ReservationId
	INNER JOIN Room rm ON rm.RoomId = rs.RoomId
	WHERE YEAR(fl.Date) = p_year AND QUARTER(fl.Date) = p_quarter AND p.Status = 'Completed' AND fl.EventType IN ('Deposit', 'FinalPayment', 'FullPayment')
	UNION ALL
	SELECT
		fl.LedgerId, fl.EventType, fl.DebitAmount, fl.CreditAmount, fl.Date, rm.HotelId, rs.RoomId
	FROM FinancialLedger fl
	INNER JOIN Refund r ON r.RefundId = fl.ReferenceId
	INNER JOIN Reservation rs ON rs.ReservationId = r.ReservationId
	INNER JOIN Room rm ON rm.RoomId = rs.RoomId
	WHERE YEAR(fl.Date) = p_year AND QUARTER(fl.Date) = p_quarter AND fl.EventType IN ('RefundPayout', 'PenaltyRevenue');

	DROP TEMPORARY TABLE IF EXISTS tmp_room_revenue;
	CREATE TEMPORARY TABLE tmp_room_revenue (
		HotelId VARCHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
		RoomId VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
		NetRevenue DECIMAL(15, 2),
		PRIMARY KEY (HotelId, RoomId)
	);

	INSERT INTO tmp_room_revenue
	SELECT ml.HotelId, ml.RoomId,
		SUM(
			CASE
				WHEN ml.EventType IN ('Deposit', 'FinalPayment', 'FullPayment', 'PenaltyRevenue') THEN COALESCE(ml.DebitAmount, 0)
				WHEN ml.EventType = 'RefundPayout' THEN -COALESCE(ml.CreditAmount, 0)
				ELSE COALESCE(ml.DebitAmount, 0) - COALESCE(ml.CreditAmount, 0)
			END
		) AS NetRevenue
	FROM tmp_mapped_ledger ml
	GROUP BY ml.HotelId, ml.RoomId;

	SELECT ranked.HotelId, ranked.RoomId, r.RoomType, ranked.NetRevenue, ranked.RevenueRank
	FROM (
		SELECT rr.HotelId, rr.RoomId, rr.NetRevenue, DENSE_RANK() OVER (ORDER BY rr.NetRevenue DESC) AS RevenueRank
		FROM tmp_room_revenue rr
	) ranked
	INNER JOIN Room r ON r.RoomId = ranked.RoomId
	WHERE ranked.RevenueRank <= 3
	ORDER BY ranked.RevenueRank, ranked.NetRevenue DESC, ranked.RoomId;

	DROP TEMPORARY TABLE IF EXISTS tmp_mapped_ledger;
	DROP TEMPORARY TABLE IF EXISTS tmp_room_revenue;
END$$

DROP PROCEDURE IF EXISTS SP_Generate_QuarterlyRefundRatio$$
CREATE PROCEDURE SP_Generate_QuarterlyRefundRatio(
	IN p_year INT,
	IN p_quarter TINYINT
)
BEGIN
	DROP TEMPORARY TABLE IF EXISTS tmp_mapped_ledger;
	CREATE TEMPORARY TABLE tmp_mapped_ledger (
		LedgerId VARCHAR(10) NOT NULL,
		EventType VARCHAR(50),
		DebitAmount DECIMAL(15, 2),
		CreditAmount DECIMAL(15, 2),
		Date DATETIME,
		HotelId VARCHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
		RoomId VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
		PRIMARY KEY (LedgerId)
	);

	INSERT INTO tmp_mapped_ledger
	SELECT fl.LedgerId, fl.EventType, fl.DebitAmount, fl.CreditAmount, fl.Date, rm.HotelId, rs.RoomId
	FROM FinancialLedger fl
	INNER JOIN Payment p ON p.PaymentId = fl.ReferenceId
	INNER JOIN Reservation rs ON rs.ReservationId = p.ReservationId
	INNER JOIN Room rm ON rm.RoomId = rs.RoomId
	WHERE YEAR(fl.Date) = p_year AND QUARTER(fl.Date) = p_quarter AND p.Status = 'Completed' AND fl.EventType IN ('Deposit', 'FinalPayment', 'FullPayment')
	UNION ALL
	SELECT fl.LedgerId, fl.EventType, fl.DebitAmount, fl.CreditAmount, fl.Date, rm.HotelId, rs.RoomId
	FROM FinancialLedger fl
	INNER JOIN Refund r ON r.RefundId = fl.ReferenceId
	INNER JOIN Reservation rs ON rs.ReservationId = r.ReservationId
	INNER JOIN Room rm ON rm.RoomId = rs.RoomId
	WHERE YEAR(fl.Date) = p_year AND QUARTER(fl.Date) = p_quarter AND fl.EventType IN ('RefundPayout', 'PenaltyRevenue');

	DROP TEMPORARY TABLE IF EXISTS tmp_hotel_totals;
	CREATE TEMPORARY TABLE tmp_hotel_totals (
		HotelId VARCHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
		TotalRevenueIn DECIMAL(15, 2),
		TotalRefundPayout DECIMAL(15, 2),
		PRIMARY KEY (HotelId)
	);

	INSERT INTO tmp_hotel_totals
	SELECT ml.HotelId,
		SUM(CASE WHEN ml.EventType IN ('Deposit', 'FinalPayment', 'FullPayment', 'PenaltyRevenue') THEN COALESCE(ml.DebitAmount, 0) ELSE 0 END) AS TotalRevenueIn,
		SUM(CASE WHEN ml.EventType = 'RefundPayout' THEN COALESCE(ml.CreditAmount, 0) ELSE 0 END) AS TotalRefundPayout
	FROM tmp_mapped_ledger ml
	GROUP BY ml.HotelId;

	SELECT ht.HotelId, COALESCE(ht.TotalRevenueIn, 0) AS TotalRevenueIn, COALESCE(ht.TotalRefundPayout, 0) AS TotalRefundPayout,
		ROUND(COALESCE(ht.TotalRefundPayout, 0) * 100 / NULLIF(COALESCE(ht.TotalRevenueIn, 0), 0), 2) AS RefundToRevenueRatio
	FROM tmp_hotel_totals ht
	ORDER BY ht.HotelId;

	DROP TEMPORARY TABLE IF EXISTS tmp_mapped_ledger;
	DROP TEMPORARY TABLE IF EXISTS tmp_hotel_totals;
END$$

DROP PROCEDURE IF EXISTS SP_Generate_QuarterlyADRRevPAR$$
CREATE PROCEDURE SP_Generate_QuarterlyADRRevPAR(
	IN p_year INT,
	IN p_quarter TINYINT
)
BEGIN
	DECLARE v_quarter_start DATE;
	DECLARE v_quarter_end DATE;
	DECLARE v_days_in_quarter INT;

	SET v_quarter_start = DATE_ADD(MAKEDATE(p_year, 1), INTERVAL (p_quarter - 1) * 3 MONTH);
	SET v_quarter_end = DATE_ADD(v_quarter_start, INTERVAL 3 MONTH);
	SET v_days_in_quarter = DATEDIFF(v_quarter_end, v_quarter_start);

	DROP TEMPORARY TABLE IF EXISTS tmp_mapped_ledger;
	CREATE TEMPORARY TABLE tmp_mapped_ledger (
		LedgerId VARCHAR(10) NOT NULL,
		EventType VARCHAR(50),
		DebitAmount DECIMAL(15, 2),
		CreditAmount DECIMAL(15, 2),
		Date DATETIME,
		HotelId VARCHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
		RoomId VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
		PRIMARY KEY (LedgerId)
	);

	INSERT INTO tmp_mapped_ledger
	SELECT fl.LedgerId, fl.EventType, fl.DebitAmount, fl.CreditAmount, fl.Date, rm.HotelId, rs.RoomId
	FROM FinancialLedger fl
	INNER JOIN Payment p ON p.PaymentId = fl.ReferenceId
	INNER JOIN Reservation rs ON rs.ReservationId = p.ReservationId
	INNER JOIN Room rm ON rm.RoomId = rs.RoomId
	WHERE YEAR(fl.Date) = p_year AND QUARTER(fl.Date) = p_quarter AND p.Status = 'Completed' AND fl.EventType IN ('Deposit', 'FinalPayment', 'FullPayment')
	UNION ALL
	SELECT fl.LedgerId, fl.EventType, fl.DebitAmount, fl.CreditAmount, fl.Date, rm.HotelId, rs.RoomId
	FROM FinancialLedger fl
	INNER JOIN Refund r ON r.RefundId = fl.ReferenceId
	INNER JOIN Reservation rs ON rs.ReservationId = r.ReservationId
	INNER JOIN Room rm ON rm.RoomId = rs.RoomId
	WHERE YEAR(fl.Date) = p_year AND QUARTER(fl.Date) = p_quarter AND fl.EventType IN ('RefundPayout', 'PenaltyRevenue');

	DROP TEMPORARY TABLE IF EXISTS tmp_hotel_totals;
	CREATE TEMPORARY TABLE tmp_hotel_totals (
		HotelId VARCHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
		TotalRevenueIn DECIMAL(15, 2),
		PRIMARY KEY (HotelId)
	);

	INSERT INTO tmp_hotel_totals
	SELECT ml.HotelId, SUM(CASE WHEN ml.EventType IN ('Deposit', 'FinalPayment', 'FullPayment', 'PenaltyRevenue') THEN COALESCE(ml.DebitAmount, 0) ELSE 0 END) AS TotalRevenueIn
	FROM tmp_mapped_ledger ml
	GROUP BY ml.HotelId;

	DROP TEMPORARY TABLE IF EXISTS tmp_room_nights;
	CREATE TEMPORARY TABLE tmp_room_nights (
		HotelId VARCHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
		RoomId VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
		OccupiedRoomNights INT,
		PRIMARY KEY (HotelId, RoomId)
	);

	INSERT INTO tmp_room_nights
	SELECT rm.HotelId, rs.RoomId,
		SUM(GREATEST(0, DATEDIFF(DATE(LEAST(rs.CheckOutDate, v_quarter_end)), DATE(GREATEST(rs.CheckInDate, v_quarter_start))))) AS OccupiedRoomNights
	FROM Reservation rs
	INNER JOIN Room rm ON rm.RoomId = rs.RoomId
	WHERE rs.Status = 'Completed' AND rs.CheckOutDate > v_quarter_start AND rs.CheckInDate < v_quarter_end
	GROUP BY rm.HotelId, rs.RoomId;

	DROP TEMPORARY TABLE IF EXISTS tmp_room_nights_by_hotel;
	CREATE TEMPORARY TABLE tmp_room_nights_by_hotel (
		HotelId VARCHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
		OccupiedRoomNights INT,
		PRIMARY KEY (HotelId)
	);

	INSERT INTO tmp_room_nights_by_hotel
	SELECT HotelId, SUM(OccupiedRoomNights) AS OccupiedRoomNights
	FROM tmp_room_nights
	GROUP BY HotelId;

	DROP TEMPORARY TABLE IF EXISTS tmp_hotel_inventory;
	CREATE TEMPORARY TABLE tmp_hotel_inventory (
		HotelId VARCHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
		TotalRooms INT,
		AvailableRoomNights INT,
		PRIMARY KEY (HotelId)
	);

	INSERT INTO tmp_hotel_inventory
	SELECT r.HotelId, COALESCE(COUNT(r.RoomId), 0) AS TotalRooms, COALESCE(COUNT(r.RoomId), 0) * v_days_in_quarter AS AvailableRoomNights
	FROM Room r
	WHERE r.Status = 1
	GROUP BY r.HotelId;

	DROP TEMPORARY TABLE IF EXISTS tmp_hotel_ids;
	CREATE TEMPORARY TABLE tmp_hotel_ids (
		HotelId VARCHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
		PRIMARY KEY (HotelId)
	);

	INSERT IGNORE INTO tmp_hotel_ids (HotelId)
	SELECT HotelId FROM tmp_hotel_totals UNION SELECT HotelId FROM tmp_room_nights_by_hotel UNION SELECT HotelId FROM tmp_hotel_inventory;

	SELECT h.HotelId, COALESCE(ht.TotalRevenueIn, 0) AS RoomRevenueForKPI, COALESCE(rn.OccupiedRoomNights, 0) AS OccupiedRoomNights,
		COALESCE(inv.AvailableRoomNights, 0) AS AvailableRoomNights,
		ROUND(COALESCE(rn.OccupiedRoomNights, 0) * 100 / NULLIF(COALESCE(inv.AvailableRoomNights, 0), 0), 2) AS OccupancyRate,
		COALESCE(ht.TotalRevenueIn, 0) / NULLIF(COALESCE(rn.OccupiedRoomNights, 0), 0) AS ADR,
		COALESCE(ht.TotalRevenueIn, 0) / NULLIF(COALESCE(inv.AvailableRoomNights, 0), 0) AS RevPAR
	FROM tmp_hotel_ids h
	LEFT JOIN tmp_hotel_totals ht ON ht.HotelId = h.HotelId
	LEFT JOIN tmp_room_nights_by_hotel rn ON rn.HotelId = h.HotelId
	LEFT JOIN tmp_hotel_inventory inv ON inv.HotelId = h.HotelId
	ORDER BY h.HotelId;

	DROP TEMPORARY TABLE IF EXISTS tmp_mapped_ledger;
	DROP TEMPORARY TABLE IF EXISTS tmp_hotel_totals;
	DROP TEMPORARY TABLE IF EXISTS tmp_room_nights;
	DROP TEMPORARY TABLE IF EXISTS tmp_room_nights_by_hotel;
	DROP TEMPORARY TABLE IF EXISTS tmp_hotel_inventory;
	DROP TEMPORARY TABLE IF EXISTS tmp_hotel_ids;
END$$
DELIMITER ;
