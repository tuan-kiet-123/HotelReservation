CREATE TABLE `Room` (
  `RoomId` varchar(10) NOT NULL Primary Key,
  `HotelId` varchar(24) NOT NULL,
  `RoomType` varchar(100),
  `BasePrice` decimal(18,2) NOT NULL,
  `CurrentPrice` decimal(18,2),
  `Status` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `Room`
  ADD INDEX `idx_Room_HotelId` (`HotelId`);

ALTER TABLE `Room`
  ADD CONSTRAINT `fk_Hotel_Room` FOREIGN KEY (`HotelId`) REFERENCES `Hotel` (`HotelId`);

ALTER TABLE `Room`
  ADD CONSTRAINT `chk_Room_Price` CHECK (`BasePrice` >= 0 AND `CurrentPrice` >= 0);