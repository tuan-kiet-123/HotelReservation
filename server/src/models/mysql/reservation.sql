CREATE TABLE `Reservation` (
  `ReservationId` varchar(10) NOT NULL Primary Key,
  `RoomId` varchar(10) NOT NULL,
  `UserId` varchar(10),
  `CheckInDate` datetime NOT NULL,
  `CheckOutDate` datetime NOT NULL,
  `Status` varchar(20) DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `Reservation`
  ADD INDEX `idx_Reservation_RoomId` (`RoomId`);

ALTER TABLE `Reservation`
  ADD CONSTRAINT `fk_Reservation_Room` FOREIGN KEY (`RoomId`) REFERENCES `Room` (`RoomId`);

ALTER TABLE `Reservation`
  ADD CONSTRAINT `chk_Reservation_Dates` CHECK (`CheckOutDate` > `CheckInDate`);

CREATE INDEX `idx_Reservation_UserId` ON `Reservation` (`UserId`);

CREATE INDEX `idx_Reservation_Status` ON `Reservation` (`Status`);