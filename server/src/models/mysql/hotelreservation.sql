-- Active: 1774776786163@@mysql-13d42b0b-hotelreservation.j.aivencloud.com@19897@hotelreservation
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Cơ sở dữ liệu: `hotelreservation`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `financialledger`
--

CREATE TABLE `FinancialLedger` (
  `LedgerId` varchar(10) NOT NULL Primary Key,
  `ReferenceId` varchar(10) NOT NULL,
  `EventType` varchar(50) NOT NULL,
  `DebitAmount` decimal(18,2),
  `CreditAmount` decimal(18,2),
  `Date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `hotel`
--

CREATE TABLE `Hotel` (
  `HotelId` varchar(24) NOT NULL Primary Key,
  `Status` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payment`
--

CREATE TABLE `Payment` (
  `PaymentId` varchar(10) NOT NULL Primary Key,
  `ReservationId` varchar(10) NOT NULL,
  `PaymentType` varchar(50) NOT NULL,
  `Amount` decimal(18,2) NOT NULL,
  `PaymentDate` datetime DEFAULT current_timestamp(),
  `Status` varchar(50) DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `pricechangelog`
--

CREATE TABLE `PriceChangeLog` (
  `LogId` varchar(10) NOT NULL Primary Key,
  `RoomId` varchar(10) NOT NULL,
  `OldPrice` decimal(18,2),
  `NewPrice` decimal(18,2),
  `ChangedAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `refund`
--

CREATE TABLE `Refund` (
  `RefundId` varchar(10) NOT NULL Primary Key,
  `ReservationId` varchar(10) NOT NULL,
  `RefundAmount` decimal(18,2),
  `PenaltyAmount` decimal(18,2),
  `ProcessedAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `reservation`
--

CREATE TABLE `Reservation` (
  `ReservationId` varchar(10) NOT NULL Primary Key,
  `RoomId` varchar(10) NOT NULL,
  `UserId` varchar(10),
  `CheckInDate` datetime NOT NULL,
  `CheckOutDate` datetime NOT NULL,
  `Status` varchar(20) DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `room`
--

CREATE TABLE `Room` (
  `RoomId` varchar(10) NOT NULL Primary Key,
  `HotelId` varchar(24) NOT NULL,
  `RoomType` varchar(100),
  `BasePrice` decimal(18,2) NOT NULL,
  `CurrentPrice` decimal(18,2),
  `Status` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Chỉ mục cho bảng `payment`
-- Ràng buộc cho bảng 'payment'
ALTER TABLE `Payment`
  ADD INDEX `idx_Payment_ReservationId` (`ReservationId`);

ALTER TABLE `Payment`
  ADD CONSTRAINT `fk_Payment_Reservation` FOREIGN KEY (`ReservationId`) REFERENCES `Reservation` (`ReservationId`);

ALTER TABLE `Payment`
  ADD CONSTRAINT `chk_Payment_Amount` CHECK (`Amount` >= 0);

--
-- Chỉ mục cho bảng `pricechangelog`
-- Ràng buộc cho bảng 'pricechangelog'
ALTER TABLE `PriceChangeLog`
  ADD INDEX `idx_PriceChangeLog_RoomId` (`RoomId`);

ALTER TABLE `PriceChangeLog`
  ADD CONSTRAINT `fk_PriceChangeLog_Room` FOREIGN KEY (`RoomId`) REFERENCES `Room` (`RoomId`);

--
-- Chỉ mục cho bảng `refund`
-- Ràng buộc cho bảng 'refund'
ALTER TABLE `Refund`
  ADD INDEX `idx_Refund_ReservationId` (`ReservationId`);

ALTER TABLE `Refund`
  ADD CONSTRAINT `fk_Refund_Reservation` FOREIGN KEY (`ReservationId`) REFERENCES `Reservation` (`ReservationId`);

ALTER TABLE `Refund`
  ADD CONSTRAINT `chk_Refund_Amount` CHECK (`RefundAmount` >= 0 AND `PenaltyAmount` >= 0);

--
-- Chỉ mục cho bảng `reservation`
-- Ràng buộc cho bảng 'reservation'
ALTER TABLE `Reservation`
  ADD INDEX `idx_Reservation_RoomId` (`RoomId`);

ALTER TABLE `Reservation`
  ADD CONSTRAINT `fk_Reservation_Room` FOREIGN KEY (`RoomId`) REFERENCES `Room` (`RoomId`);

ALTER TABLE `Reservation`
  ADD CONSTRAINT `chk_Reservation_Dates` CHECK (`CheckOutDate` > `CheckInDate`);

--
-- Chỉ mục cho bảng `room`
-- Ràng buộc cho bảng 'room'
ALTER TABLE `Room`
  ADD INDEX `idx_Room_HotelId` (`HotelId`);

ALTER TABLE `Room`
  ADD CONSTRAINT `fk_Hotel_Room` FOREIGN KEY (`HotelId`) REFERENCES `Hotel` (`HotelId`);

ALTER TABLE `Room`
  ADD CONSTRAINT `chk_Room_Price` CHECK (`BasePrice` >= 0 AND `CurrentPrice` >= 0);

--
-- Ràng buộc cho bảng 'FinancialLedger'
ALTER TABLE `FinancialLedger`
  ADD CONSTRAINT `chk_Ledger_Amount` CHECK (`DebitAmount` >= 0 AND `CreditAmount` >= 0);


-- Index trên UserId: Dùng để truy vấn lịch sử đặt phòng của một khách hàng cực nhanh
CREATE INDEX `idx_Reservation_UserId` ON `Reservation` (`UserId`);

-- Index trên ReferenceId: Tối ưu khi Kế toán cần JOIN ngược từ Sổ cái về Payment/Refund
CREATE INDEX `idx_Ledger_ReferenceId` ON `FinancialLedger` (`ReferenceId`);

-- Index trên Status của Reservation: Tối ưu khi lọc các phòng đang 'Pending' hoặc 'Completed'
CREATE INDEX `idx_Reservation_Status` ON `Reservation` (`Status`);


COMMIT;

