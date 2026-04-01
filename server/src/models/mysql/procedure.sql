-- Active: 1774776786163@@mysql-13d42b0b-hotelreservation.j.aivencloud.com@19897@hotelreservation
DELIMITER $$

DROP PROCEDURE IF EXISTS SP_Generate_QuarterlyReport$$
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
		fl.LedgerId,
		fl.EventType,
		fl.DebitAmount,
		fl.CreditAmount,
		fl.Date,
		rm.HotelId,
		rs.RoomId
	FROM FinancialLedger fl
	INNER JOIN Payment p ON p.PaymentId = fl.ReferenceId
	INNER JOIN Reservation rs ON rs.ReservationId = p.ReservationId
	INNER JOIN Room rm ON rm.RoomId = rs.RoomId
	WHERE YEAR(fl.Date) = p_year
		AND QUARTER(fl.Date) = p_quarter
		AND p.Status = 'Completed'
		AND fl.EventType IN ('Deposit', 'FinalPayment', 'FullPayment')

	UNION ALL

	SELECT
		fl.LedgerId,
		fl.EventType,
		fl.DebitAmount,
		fl.CreditAmount,
		fl.Date,
		rm.HotelId,
		rs.RoomId
	FROM FinancialLedger fl
	INNER JOIN Refund r ON r.RefundId = fl.ReferenceId
	INNER JOIN Reservation rs ON rs.ReservationId = r.ReservationId
	INNER JOIN Room rm ON rm.RoomId = rs.RoomId
	WHERE YEAR(fl.Date) = p_year
		AND QUARTER(fl.Date) = p_quarter
		AND fl.EventType IN ('RefundPayout', 'PenaltyRevenue');

	DROP TEMPORARY TABLE IF EXISTS tmp_room_revenue;
	CREATE TEMPORARY TABLE tmp_room_revenue (
		HotelId VARCHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
		RoomId VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
		NetRevenue DECIMAL(15, 2),
		PRIMARY KEY (HotelId, RoomId)
	);

	INSERT INTO tmp_room_revenue
	SELECT
		ml.HotelId,
		ml.RoomId,
		SUM(
			CASE
				WHEN ml.EventType IN ('Deposit', 'FinalPayment', 'FullPayment', 'PenaltyRevenue') THEN COALESCE(ml.DebitAmount, 0)
				WHEN ml.EventType = 'RefundPayout' THEN -COALESCE(ml.CreditAmount, 0)
				ELSE COALESCE(ml.DebitAmount, 0) - COALESCE(ml.CreditAmount, 0)
			END
		) AS NetRevenue
	FROM tmp_mapped_ledger ml
	GROUP BY ml.HotelId, ml.RoomId;

	SELECT
		ranked.HotelId,
		ranked.RoomId,
		ranked.NetRevenue,
		ranked.RevenueRank
	FROM (
		SELECT
			rr.HotelId,
			rr.RoomId,
			rr.NetRevenue,
			DENSE_RANK() OVER (
				PARTITION BY rr.HotelId
				ORDER BY rr.NetRevenue DESC
			) AS RevenueRank
		FROM tmp_room_revenue rr
	) ranked
	WHERE ranked.RevenueRank <= 3
	ORDER BY ranked.HotelId, ranked.RevenueRank, ranked.RoomId;

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
	SELECT
		fl.LedgerId,
		fl.EventType,
		fl.DebitAmount,
		fl.CreditAmount,
		fl.Date,
		rm.HotelId,
		rs.RoomId
	FROM FinancialLedger fl
	INNER JOIN Payment p ON p.PaymentId = fl.ReferenceId
	INNER JOIN Reservation rs ON rs.ReservationId = p.ReservationId
	INNER JOIN Room rm ON rm.RoomId = rs.RoomId
	WHERE YEAR(fl.Date) = p_year
		AND QUARTER(fl.Date) = p_quarter
		AND p.Status = 'Completed'
		AND fl.EventType IN ('Deposit', 'FinalPayment', 'FullPayment')

	UNION ALL

	SELECT
		fl.LedgerId,
		fl.EventType,
		fl.DebitAmount,
		fl.CreditAmount,
		fl.Date,
		rm.HotelId,
		rs.RoomId
	FROM FinancialLedger fl
	INNER JOIN Refund r ON r.RefundId = fl.ReferenceId
	INNER JOIN Reservation rs ON rs.ReservationId = r.ReservationId
	INNER JOIN Room rm ON rm.RoomId = rs.RoomId
	WHERE YEAR(fl.Date) = p_year
		AND QUARTER(fl.Date) = p_quarter
		AND fl.EventType IN ('RefundPayout', 'PenaltyRevenue');

	DROP TEMPORARY TABLE IF EXISTS tmp_hotel_totals;
	CREATE TEMPORARY TABLE tmp_hotel_totals (
		HotelId VARCHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
		TotalRevenueIn DECIMAL(15, 2),
		TotalRefundPayout DECIMAL(15, 2),
		PRIMARY KEY (HotelId)
	);

	INSERT INTO tmp_hotel_totals
	SELECT
		ml.HotelId,
		SUM(
			CASE
				WHEN ml.EventType IN ('Deposit', 'FinalPayment', 'FullPayment', 'PenaltyRevenue') THEN COALESCE(ml.DebitAmount, 0)
				ELSE 0
			END
		) AS TotalRevenueIn,
		SUM(
			CASE
				WHEN ml.EventType = 'RefundPayout' THEN COALESCE(ml.CreditAmount, 0)
				ELSE 0
			END
		) AS TotalRefundPayout
	FROM tmp_mapped_ledger ml
	GROUP BY ml.HotelId;

	SELECT
		ht.HotelId,
		COALESCE(ht.TotalRevenueIn, 0) AS TotalRevenueIn,
		COALESCE(ht.TotalRefundPayout, 0) AS TotalRefundPayout,
		ROUND(
			COALESCE(ht.TotalRefundPayout, 0) * 100 / NULLIF(COALESCE(ht.TotalRevenueIn, 0), 0),
			2
		) AS RefundToRevenueRatio
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
	SELECT
		fl.LedgerId,
		fl.EventType,
		fl.DebitAmount,
		fl.CreditAmount,
		fl.Date,
		rm.HotelId,
		rs.RoomId
	FROM FinancialLedger fl
	INNER JOIN Payment p ON p.PaymentId = fl.ReferenceId
	INNER JOIN Reservation rs ON rs.ReservationId = p.ReservationId
	INNER JOIN Room rm ON rm.RoomId = rs.RoomId
	WHERE YEAR(fl.Date) = p_year
		AND QUARTER(fl.Date) = p_quarter
		AND p.Status = 'Completed'
		AND fl.EventType IN ('Deposit', 'FinalPayment', 'FullPayment')

	UNION ALL

	SELECT
		fl.LedgerId,
		fl.EventType,
		fl.DebitAmount,
		fl.CreditAmount,
		fl.Date,
		rm.HotelId,
		rs.RoomId
	FROM FinancialLedger fl
	INNER JOIN Refund r ON r.RefundId = fl.ReferenceId
	INNER JOIN Reservation rs ON rs.ReservationId = r.ReservationId
	INNER JOIN Room rm ON rm.RoomId = rs.RoomId
	WHERE YEAR(fl.Date) = p_year
		AND QUARTER(fl.Date) = p_quarter
		AND fl.EventType IN ('RefundPayout', 'PenaltyRevenue');

	DROP TEMPORARY TABLE IF EXISTS tmp_hotel_totals;
	CREATE TEMPORARY TABLE tmp_hotel_totals (
		HotelId VARCHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
		TotalRevenueIn DECIMAL(15, 2),
		PRIMARY KEY (HotelId)
	);

	INSERT INTO tmp_hotel_totals
	SELECT
		ml.HotelId,
		SUM(
			CASE
				WHEN ml.EventType IN ('Deposit', 'FinalPayment', 'FullPayment', 'PenaltyRevenue') THEN COALESCE(ml.DebitAmount, 0)
				ELSE 0
			END
		) AS TotalRevenueIn
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
	SELECT
		rm.HotelId,
		rs.RoomId,
		SUM(
			GREATEST(
				0,
				DATEDIFF(
					DATE(LEAST(rs.CheckOutDate, v_quarter_end)),
					DATE(GREATEST(rs.CheckInDate, v_quarter_start))
				)
			)
		) AS OccupiedRoomNights
	FROM Reservation rs
	INNER JOIN Room rm ON rm.RoomId = rs.RoomId
	WHERE rs.Status = 'Completed'
		AND rs.CheckOutDate > v_quarter_start
		AND rs.CheckInDate < v_quarter_end
	GROUP BY rm.HotelId, rs.RoomId;

	DROP TEMPORARY TABLE IF EXISTS tmp_hotel_inventory;
	CREATE TEMPORARY TABLE tmp_hotel_inventory (
		HotelId VARCHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
		TotalRooms INT,
		AvailableRoomNights INT,
		PRIMARY KEY (HotelId)
	);

	INSERT INTO tmp_hotel_inventory
	SELECT
		r.HotelId,
		COALESCE(COUNT(r.RoomId), 0) AS TotalRooms,
		COALESCE(COUNT(r.RoomId), 0) * v_days_in_quarter AS AvailableRoomNights
	FROM Room r
	WHERE r.Status = 1
	GROUP BY r.HotelId;

	SELECT
		COALESCE(ht.HotelId, rn.HotelId, inv.HotelId) AS HotelId,
		COALESCE(ht.TotalRevenueIn, 0) AS RoomRevenueForKPI,
		COALESCE(rn.OccupiedRoomNights, 0) AS OccupiedRoomNights,
		COALESCE(inv.AvailableRoomNights, 0) AS AvailableRoomNights,
		ROUND(
			COALESCE(rn.OccupiedRoomNights, 0) * 100 / NULLIF(COALESCE(inv.AvailableRoomNights, 0), 0),
			2
		) AS OccupancyRate,
		COALESCE(ht.TotalRevenueIn, 0) / NULLIF(COALESCE(rn.OccupiedRoomNights, 0), 0) AS ADR,
		COALESCE(ht.TotalRevenueIn, 0) / NULLIF(COALESCE(inv.AvailableRoomNights, 0), 0) AS RevPAR
	FROM tmp_hotel_totals ht
	LEFT JOIN (
		SELECT HotelId, SUM(OccupiedRoomNights) AS OccupiedRoomNights
		FROM tmp_room_nights
		GROUP BY HotelId
	) rn ON rn.HotelId = ht.HotelId
	LEFT JOIN tmp_hotel_inventory inv ON inv.HotelId = ht.HotelId
	UNION
	SELECT
		COALESCE(ht.HotelId, rn.HotelId, inv.HotelId) AS HotelId,
		COALESCE(ht.TotalRevenueIn, 0) AS RoomRevenueForKPI,
		COALESCE(rn.OccupiedRoomNights, 0) AS OccupiedRoomNights,
		COALESCE(inv.AvailableRoomNights, 0) AS AvailableRoomNights,
		ROUND(
			COALESCE(rn.OccupiedRoomNights, 0) * 100 / NULLIF(COALESCE(inv.AvailableRoomNights, 0), 0),
			2
		) AS OccupancyRate,
		COALESCE(ht.TotalRevenueIn, 0) / NULLIF(COALESCE(rn.OccupiedRoomNights, 0), 0) AS ADR,
		COALESCE(ht.TotalRevenueIn, 0) / NULLIF(COALESCE(inv.AvailableRoomNights, 0), 0) AS RevPAR
	FROM tmp_hotel_totals ht
	RIGHT JOIN (
		SELECT HotelId, SUM(OccupiedRoomNights) AS OccupiedRoomNights
		FROM tmp_room_nights
		GROUP BY HotelId
	) rn ON rn.HotelId = ht.HotelId
	LEFT JOIN tmp_hotel_inventory inv ON inv.HotelId = COALESCE(rn.HotelId, ht.HotelId)
	WHERE ht.HotelId IS NULL
	UNION
	SELECT
		COALESCE(ht.HotelId, rn.HotelId, inv.HotelId) AS HotelId,
		COALESCE(ht.TotalRevenueIn, 0) AS RoomRevenueForKPI,
		COALESCE(rn.OccupiedRoomNights, 0) AS OccupiedRoomNights,
		COALESCE(inv.AvailableRoomNights, 0) AS AvailableRoomNights,
		ROUND(
			COALESCE(rn.OccupiedRoomNights, 0) * 100 / NULLIF(COALESCE(inv.AvailableRoomNights, 0), 0),
			2
		) AS OccupancyRate,
		COALESCE(ht.TotalRevenueIn, 0) / NULLIF(COALESCE(rn.OccupiedRoomNights, 0), 0) AS ADR,
		COALESCE(ht.TotalRevenueIn, 0) / NULLIF(COALESCE(inv.AvailableRoomNights, 0), 0) AS RevPAR
	FROM tmp_hotel_totals ht
	LEFT JOIN (
		SELECT HotelId, SUM(OccupiedRoomNights) AS OccupiedRoomNights
		FROM tmp_room_nights
		GROUP BY HotelId
	) rn ON rn.HotelId = ht.HotelId
	RIGHT JOIN tmp_hotel_inventory inv ON inv.HotelId = COALESCE(rn.HotelId, ht.HotelId)
	WHERE rn.HotelId IS NULL AND ht.HotelId IS NULL
	ORDER BY HotelId;

	DROP TEMPORARY TABLE IF EXISTS tmp_mapped_ledger;
	DROP TEMPORARY TABLE IF EXISTS tmp_hotel_totals;
	DROP TEMPORARY TABLE IF EXISTS tmp_room_nights;
	DROP TEMPORARY TABLE IF EXISTS tmp_hotel_inventory;
END$$

DELIMITER ;

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
/
/

DELIMITER;

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

	IF v_ResStatus IS NULL THEN
		ROLLBACK;
		SELECT 'HTTP 404: Không tìm thấy đơn.' AS Message;
	ELSEIF v_ResStatus COLLATE utf8mb4_general_ci <> 'Confirmed' THEN
		ROLLBACK;
		SELECT 'HTTP 400: Trạng thái đơn không hợp lệ.' AS Message;
	ELSE
		SELECT CurrentPrice INTO v_CurrentPrice FROM Room WHERE RoomId = v_RoomId COLLATE utf8mb4_general_ci;
		SET v_TotalPrice = v_CurrentPrice * DATEDIFF(v_CheckOutDate, v_CheckInDate);

		SELECT IFNULL(SUM(Amount), 0) INTO v_PaidAmount
		FROM Payment
		WHERE ReservationId = p_ReservationId COLLATE utf8mb4_general_ci AND Status = 'Completed';

		SET v_RemainingAmount = v_TotalPrice - v_PaidAmount;

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

		UPDATE Reservation
		SET Status = 'CheckedIn'
		WHERE ReservationId = p_ReservationId COLLATE utf8mb4_general_ci;

		COMMIT;
		SELECT 'HTTP 200: Check-in thành công!' AS Message, v_RemainingAmount AS AmountCollected;
	END IF;
END /
/

DELIMITER;

DELIMITER $$
CREATE PROCEDURE `sp_CancelReservation` (IN `p_ReservationId` VARCHAR(255))   BEGIN
		DECLARE v_CheckInDate DATETIME;
		DECLARE v_TotalPaid DECIMAL(15,2);
		DECLARE v_TotalAmount DECIMAL(15,2);
		DECLARE v_DaysBefore INT;
		DECLARE v_RefundAmount DECIMAL(15,2) DEFAULT 0;
		DECLARE v_PenaltyAmount DECIMAL(15,2) DEFAULT 0;
		DECLARE v_RoomId VARCHAR(255);

		SELECT CheckInDate, RoomId INTO v_CheckInDate, v_RoomId
		FROM Reservation WHERE ReservationId = p_ReservationId;

		SELECT SUM(Amount) INTO v_TotalPaid 
		FROM Payment 
		WHERE ReservationId = p_ReservationId AND Status = 'Completed';

		SET v_DaysBefore = DATEDIFF(v_CheckInDate, NOW());

		SELECT BasePrice INTO v_TotalAmount FROM Room WHERE RoomId = v_RoomId;

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
				UPDATE Reservation SET Status = 'Cancelled' WHERE ReservationId = p_ReservationId;
        
				UPDATE Room SET Status = 1 WHERE RoomId = v_RoomId;

				IF v_TotalPaid > 0 THEN
						INSERT INTO Refund (RefundId, ReservationId, RefundAmount, PenaltyAmount, ProcessedAt)
						VALUES (UUID(), p_ReservationId, v_RefundAmount, v_PenaltyAmount, NOW());
				END IF;
		COMMIT;
END$$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `sp_SearchAvailableRooms`(
		IN p_CheckIn DATETIME,
		IN p_CheckOut DATETIME,
		IN p_MaxPrice DECIMAL(15,2)
)
BEGIN
		SELECT 
			r.HotelId,
			r.RoomId,
			r.RoomType,
			r.CurrentPrice
		FROM Room r
		WHERE r.Status = 1
			AND r.CurrentPrice <= p_MaxPrice
			AND fn_CheckRoomAvailability(r.RoomId, p_CheckIn, p_CheckOut) = TRUE;
END$$
DELIMITER ;
