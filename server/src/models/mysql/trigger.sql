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

DELIMITER;

DROP TRIGGER IF EXISTS tr_AfterRefund_InsertLedger$$