CREATE TABLE `FinancialLedger` (
  `LedgerId` varchar(10) NOT NULL Primary Key,
  `ReferenceId` varchar(10) NOT NULL,
  `EventType` varchar(50) NOT NULL,
  `DebitAmount` decimal(18,2),
  `CreditAmount` decimal(18,2),
  `Date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `FinancialLedger`
  ADD CONSTRAINT `chk_Ledger_Amount` CHECK (`DebitAmount` >= 0 AND `CreditAmount` >= 0);

CREATE INDEX `idx_Ledger_ReferenceId` ON `FinancialLedger` (`ReferenceId`);
CREATE INDEX `idx_Ledger_Date` ON `FinancialLedger` (`Date`);
CREATE INDEX `idx_Ledger_EventType` ON `FinancialLedger` (`EventType`);