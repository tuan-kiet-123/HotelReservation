CREATE TABLE `Payment` (
  `PaymentId` varchar(10) NOT NULL Primary Key,
  `ReservationId` varchar(10) NOT NULL,
  `PaymentType` varchar(50) NOT NULL,
  `Amount` decimal(18,2) NOT NULL,
  `PaymentDate` datetime DEFAULT current_timestamp(),
  `Status` varchar(50) DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `Payment`
  ADD INDEX `idx_Payment_ReservationId` (`ReservationId`);

ALTER TABLE `Payment`
  ADD CONSTRAINT `fk_Payment_Reservation` FOREIGN KEY (`ReservationId`) REFERENCES `Reservation` (`ReservationId`);

ALTER TABLE `Payment`
  ADD CONSTRAINT `chk_Payment_Amount` CHECK (`Amount` >= 0);