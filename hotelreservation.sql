-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th3 17, 2026 lúc 08:22 PM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `hotelreservation`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `financialledger`
--

CREATE TABLE `financialledger` (
  `LedgerId` varchar(10) NOT NULL,
  `ReferenceId` varchar(10) DEFAULT NULL,
  `ReferenceType` varchar(20) DEFAULT NULL,
  `DebitAmount` decimal(18,2) DEFAULT 0.00,
  `CreditAmount` decimal(18,2) DEFAULT 0.00,
  `Date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `hotel`
--

CREATE TABLE `hotel` (
  `HotelId` varchar(10) NOT NULL,
  `HotelName` varchar(100) NOT NULL,
  `Status` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payment`
--

CREATE TABLE `payment` (
  `TransactionId` varchar(10) NOT NULL,
  `ReservationId` varchar(10) DEFAULT NULL,
  `Amount` decimal(18,2) NOT NULL,
  `PaymentDate` datetime DEFAULT current_timestamp(),
  `Status` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `pricechangelog`
--

CREATE TABLE `pricechangelog` (
  `LogId` varchar(10) NOT NULL,
  `RoomId` varchar(10) DEFAULT NULL,
  `OldPrice` decimal(18,2) DEFAULT NULL,
  `NewPrice` decimal(18,2) DEFAULT NULL,
  `ChangedAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `refund`
--

CREATE TABLE `refund` (
  `RefundId` varchar(10) NOT NULL,
  `ReservationId` varchar(10) DEFAULT NULL,
  `RefundAmount` decimal(18,2) DEFAULT NULL,
  `PenaltyAmount` decimal(18,2) DEFAULT NULL,
  `ProcessedAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `reservation`
--

CREATE TABLE `reservation` (
  `ReservationId` varchar(10) NOT NULL,
  `RoomId` varchar(10) DEFAULT NULL,
  `UserId` varchar(10) DEFAULT NULL,
  `CheckInDate` datetime NOT NULL,
  `CheckOutDate` datetime NOT NULL,
  `Status` varchar(20) DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `room`
--

CREATE TABLE `room` (
  `RoomId` varchar(10) NOT NULL,
  `HotelId` varchar(10) DEFAULT NULL,
  `RoomType` varchar(100) DEFAULT NULL,
  `CurrentPrice` decimal(18,2) DEFAULT NULL,
  `Status` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `financialledger`
--
ALTER TABLE `financialledger`
  ADD PRIMARY KEY (`LedgerId`);

--
-- Chỉ mục cho bảng `hotel`
--
ALTER TABLE `hotel`
  ADD PRIMARY KEY (`HotelId`);

--
-- Chỉ mục cho bảng `payment`
--
ALTER TABLE `payment`
  ADD PRIMARY KEY (`TransactionId`),
  ADD KEY `fk_Payment_Reservation` (`ReservationId`);

--
-- Chỉ mục cho bảng `pricechangelog`
--
ALTER TABLE `pricechangelog`
  ADD PRIMARY KEY (`LogId`),
  ADD KEY `fk_PriceChangeLog_Room` (`RoomId`);

--
-- Chỉ mục cho bảng `refund`
--
ALTER TABLE `refund`
  ADD PRIMARY KEY (`RefundId`),
  ADD KEY `fk_Refund_Reservation` (`ReservationId`);

--
-- Chỉ mục cho bảng `reservation`
--
ALTER TABLE `reservation`
  ADD PRIMARY KEY (`ReservationId`),
  ADD KEY `fk_Reservation_Room` (`RoomId`);

--
-- Chỉ mục cho bảng `room`
--
ALTER TABLE `room`
  ADD PRIMARY KEY (`RoomId`),
  ADD KEY `fk_Hotel_Room` (`HotelId`);

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `payment`
--
ALTER TABLE `payment`
  ADD CONSTRAINT `fk_Payment_Reservation` FOREIGN KEY (`ReservationId`) REFERENCES `reservation` (`ReservationId`);

--
-- Các ràng buộc cho bảng `pricechangelog`
--
ALTER TABLE `pricechangelog`
  ADD CONSTRAINT `fk_PriceChangeLog_Room` FOREIGN KEY (`RoomId`) REFERENCES `room` (`RoomId`);

--
-- Các ràng buộc cho bảng `refund`
--
ALTER TABLE `refund`
  ADD CONSTRAINT `fk_Refund_Reservation` FOREIGN KEY (`ReservationId`) REFERENCES `reservation` (`ReservationId`);

--
-- Các ràng buộc cho bảng `reservation`
--
ALTER TABLE `reservation`
  ADD CONSTRAINT `fk_Reservation_Room` FOREIGN KEY (`RoomId`) REFERENCES `room` (`RoomId`);

--
-- Các ràng buộc cho bảng `room`
--
ALTER TABLE `room`
  ADD CONSTRAINT `fk_Hotel_Room` FOREIGN KEY (`HotelId`) REFERENCES `hotel` (`HotelId`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
