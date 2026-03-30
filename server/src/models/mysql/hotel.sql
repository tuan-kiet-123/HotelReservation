CREATE TABLE `Hotel` (
  `HotelId` varchar(24) NOT NULL Primary Key,
  `HotelName` varchar(100) NOT NULL,
  `Status` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;