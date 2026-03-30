CREATE TABLE `Refund` (
  `RefundId` varchar(10) NOT NULL Primary Key,
  `ReservationId` varchar(10) NOT NULL,
  `RefundAmount` decimal(18,2),
  `PenaltyAmount` decimal(18,2),
  `ProcessedAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `Refund`
  ADD INDEX `idx_Refund_ReservationId` (`ReservationId`);

ALTER TABLE `Refund`
  ADD CONSTRAINT `fk_Refund_Reservation` FOREIGN KEY (`ReservationId`) REFERENCES `Reservation` (`ReservationId`);

ALTER TABLE `Refund`
  ADD CONSTRAINT `chk_Refund_Amount` CHECK (`RefundAmount` >= 0 AND `PenaltyAmount` >= 0);