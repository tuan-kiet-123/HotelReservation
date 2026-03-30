CREATE TABLE `PriceChangeLog` (
  `LogId` varchar(10) NOT NULL Primary Key,
  `RoomId` varchar(10) NOT NULL,
  `OldPrice` decimal(18,2),
  `NewPrice` decimal(18,2),
  `ChangedAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `PriceChangeLog`
  ADD INDEX `idx_PriceChangeLog_RoomId` (`RoomId`);

ALTER TABLE `PriceChangeLog`
  ADD CONSTRAINT `fk_PriceChangeLog_Room` FOREIGN KEY (`RoomId`) REFERENCES `Room` (`RoomId`);