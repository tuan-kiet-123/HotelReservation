-- Active: 1774776786163@@mysql-13d42b0b-hotelreservation.j.aivencloud.com@19897@hotelreservation
USE hotelreservation;

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
    INSERT INTO FinancialLedger (
      LedgerId,
      ReferenceId,
      EventType,
      DebitAmount,
      CreditAmount,
      Date
    )
    VALUES (
      SUBSTRING(REPLACE(UUID(), '-', ''), 1, 10),
      NEW.PaymentId,
      v_event_type,
      NEW.Amount,
      0,
      COALESCE(NEW.PaymentDate, CURRENT_TIMESTAMP)
    );
  END IF;
END$$

DROP TRIGGER IF EXISTS TRG_AutoLog_Refund$$
CREATE TRIGGER TRG_AutoLog_Refund
AFTER INSERT ON Refund
FOR EACH ROW
BEGIN
  IF COALESCE(NEW.RefundAmount, 0) > 0 THEN
    INSERT INTO FinancialLedger (
      LedgerId,
      ReferenceId,
      EventType,
      DebitAmount,
      CreditAmount,
      Date
    )
    VALUES (
      SUBSTRING(REPLACE(UUID(), '-', ''), 1, 10),
      NEW.RefundId,
      'RefundPayout',
      0,
      NEW.RefundAmount,
      COALESCE(NEW.ProcessedAt, CURRENT_TIMESTAMP)
    );
  END IF;

  IF COALESCE(NEW.PenaltyAmount, 0) > 0 THEN
    INSERT INTO FinancialLedger (
      LedgerId,
      ReferenceId,
      EventType,
      DebitAmount,
      CreditAmount,
      Date
    )
    VALUES (
      SUBSTRING(REPLACE(UUID(), '-', ''), 1, 10),
      NEW.RefundId,
      'PenaltyRevenue',
      NEW.PenaltyAmount,
      0,
      COALESCE(NEW.ProcessedAt, CURRENT_TIMESTAMP)
    );
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
    INSERT INTO PriceChangeLog (
      LogId,
      RoomId,
      OldPrice,
      NewPrice,
      ChangedAt
    )
    VALUES (
      SUBSTRING(REPLACE(UUID(), '-', ''), 1, 10),
      NEW.RoomId,
      OLD.CurrentPrice,
      NEW.CurrentPrice,
      CURRENT_TIMESTAMP
    );
  END IF;
END$$

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
    HotelId VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
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
    HotelId VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
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
    HotelId VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
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
    HotelId VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
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
    h.HotelId,
    h.HotelName,
    COALESCE(ht.TotalRevenueIn, 0) AS TotalRevenueIn,
    COALESCE(ht.TotalRefundPayout, 0) AS TotalRefundPayout,
    ROUND(
      COALESCE(ht.TotalRefundPayout, 0) * 100 / NULLIF(COALESCE(ht.TotalRevenueIn, 0), 0),
      2
    ) AS RefundToRevenueRatio
  FROM Hotel h
  LEFT JOIN tmp_hotel_totals ht ON ht.HotelId = h.HotelId
  ORDER BY h.HotelId;

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
    HotelId VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
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
    HotelId VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
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
    HotelId VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
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
    HotelId VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
    TotalRooms INT,
    AvailableRoomNights INT,
    PRIMARY KEY (HotelId)
  );

  INSERT INTO tmp_hotel_inventory
  SELECT
    h.HotelId,
    COALESCE(COUNT(r.RoomId), 0) AS TotalRooms,
    COALESCE(COUNT(r.RoomId), 0) * v_days_in_quarter AS AvailableRoomNights
  FROM Hotel h
  LEFT JOIN Room r ON r.HotelId = h.HotelId AND r.Status = 1
  GROUP BY h.HotelId;

  SELECT
    h.HotelId,
    h.HotelName,
    COALESCE(ht.TotalRevenueIn, 0) AS RoomRevenueForKPI,
    COALESCE(rn.OccupiedRoomNights, 0) AS OccupiedRoomNights,
    COALESCE(inv.AvailableRoomNights, 0) AS AvailableRoomNights,
    ROUND(
      COALESCE(rn.OccupiedRoomNights, 0) * 100 / NULLIF(COALESCE(inv.AvailableRoomNights, 0), 0),
      2
    ) AS OccupancyRate,
    COALESCE(ht.TotalRevenueIn, 0) / NULLIF(COALESCE(rn.OccupiedRoomNights, 0), 0) AS ADR,
    COALESCE(ht.TotalRevenueIn, 0) / NULLIF(COALESCE(inv.AvailableRoomNights, 0), 0) AS RevPAR
  FROM Hotel h
  LEFT JOIN tmp_hotel_totals ht ON ht.HotelId = h.HotelId
  LEFT JOIN (
    SELECT HotelId, SUM(OccupiedRoomNights) AS OccupiedRoomNights
    FROM tmp_room_nights
    GROUP BY HotelId
  ) rn ON rn.HotelId = h.HotelId
  LEFT JOIN tmp_hotel_inventory inv ON inv.HotelId = h.HotelId
  ORDER BY h.HotelId;

  DROP TEMPORARY TABLE IF EXISTS tmp_mapped_ledger;
  DROP TEMPORARY TABLE IF EXISTS tmp_hotel_totals;
  DROP TEMPORARY TABLE IF EXISTS tmp_room_nights;
  DROP TEMPORARY TABLE IF EXISTS tmp_hotel_inventory;
END$$

DELIMITER ;