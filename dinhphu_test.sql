USE `hotelreservation`;

-- =============================
-- 0) Cleanup test data (safe rerun)
-- =============================
DELETE FROM `FinancialLedger`
WHERE `ReferenceId` IN (
  'PMT9100001', 'PMT9100002', 'PMT9100003', 'PMT9100004', 'PMT9100005', 'PMT9100006',
  'PMT9100007', 'PMT9100008', 'PMT9100009', 'PMT9100010', 'PMT9100011', 'PMT9100012',
  'PMT9100013', 'PMT9100014',
  'RFD9100001', 'RFD9100002', 'RFD9100003'
);

DELETE FROM `PriceChangeLog`
WHERE `RoomId` IN (
  'RM91000001', 'RM91000002', 'RM91000003', 'RM91000004',
  'RM92000001', 'RM92000002', 'RM92000003', 'RM92000004'
);

DELETE FROM `Payment`
WHERE `PaymentId` IN (
  'PMT9100001', 'PMT9100002', 'PMT9100003', 'PMT9100004', 'PMT9100005', 'PMT9100006',
  'PMT9100007', 'PMT9100008', 'PMT9100009', 'PMT9100010', 'PMT9100011', 'PMT9100012',
  'PMT9100013', 'PMT9100014'
);

DELETE FROM `Refund`
WHERE `RefundId` IN ('RFD9100001', 'RFD9100002', 'RFD9100003');

DELETE FROM `Reservation`
WHERE `ReservationId` IN (
  'RSV9100001', 'RSV9100002', 'RSV9100003', 'RSV9100004',
  'RSV9100005', 'RSV9100006', 'RSV9100007', 'RSV9100008',
  'RSV9100009', 'RSV9100010', 'RSV9100011', 'RSV9100012'
);

DELETE FROM `Room`
WHERE `RoomId` IN (
  'RM91000001', 'RM91000002', 'RM91000003', 'RM91000004',
  'RM92000001', 'RM92000002', 'RM92000003', 'RM92000004'
);

DELETE FROM `Hotel`
WHERE `HotelId` IN ('HT91000001', 'HT92000001');

-- =============================
-- 1) Seed parent data
-- =============================
INSERT INTO `Hotel` (`HotelId`, `HotelName`, `Status`)
VALUES
  ('HT91000001', 'Sunrise Da Nang', 1),
  ('HT92000001', 'Ocean Pearl Nha Trang', 1)
ON DUPLICATE KEY UPDATE
  `HotelName` = VALUES(`HotelName`),
  `Status` = VALUES(`Status`);

INSERT INTO `Room` (`RoomId`, `HotelId`, `RoomType`, `BasePrice`, `CurrentPrice`, `Status`)
VALUES
  ('RM91000001', 'HT91000001', 'Standard City View', 1000000, 1100000, 1),
  ('RM91000002', 'HT91000001', 'Deluxe River View',  1400000, 1500000, 1),
  ('RM91000003', 'HT91000001', 'Junior Suite',       1900000, 2100000, 1),
  ('RM91000004', 'HT91000001', 'Family Suite',       1600000, 1650000, 1),
  ('RM92000001', 'HT92000001', 'Superior Sea View',  1800000, 2000000, 1),
  ('RM92000002', 'HT92000001', 'Deluxe Balcony',     1600000, 1750000, 1),
  ('RM92000003', 'HT92000001', 'Executive Suite',    2200000, 2400000, 1),
  ('RM92000004', 'HT92000001', 'Family Ocean',       1700000, 1800000, 1)
ON DUPLICATE KEY UPDATE
  `HotelId` = VALUES(`HotelId`),
  `RoomType` = VALUES(`RoomType`),
  `BasePrice` = VALUES(`BasePrice`),
  `CurrentPrice` = VALUES(`CurrentPrice`),
  `Status` = VALUES(`Status`);

INSERT INTO `Reservation` (
  `ReservationId`, `RoomId`, `UserId`, `CheckInDate`, `CheckOutDate`, `Status`
)
VALUES
  ('RSV9100001', 'RM91000001', 'USR1000001', '2026-01-05 14:00:00', '2026-01-07 12:00:00', 'Completed'),
  ('RSV9100002', 'RM91000002', 'USR1000002', '2026-01-07 14:00:00', '2026-01-09 12:00:00', 'Completed'),
  ('RSV9100003', 'RM91000003', 'USR1000003', '2026-01-11 14:00:00', '2026-01-13 12:00:00', 'Completed'),
  ('RSV9100004', 'RM91000004', 'USR1000004', '2026-01-13 14:00:00', '2026-01-15 12:00:00', 'Completed'),
  ('RSV9100005', 'RM92000001', 'USR2000001', '2026-01-06 14:00:00', '2026-01-08 12:00:00', 'Completed'),
  ('RSV9100006', 'RM92000002', 'USR2000002', '2026-01-09 14:00:00', '2026-01-11 12:00:00', 'Completed'),
  ('RSV9100007', 'RM92000003', 'USR2000003', '2026-01-12 14:00:00', '2026-01-14 12:00:00', 'Completed'),
  ('RSV9100008', 'RM92000004', 'USR2000004', '2026-01-15 14:00:00', '2026-01-17 12:00:00', 'Completed'),
  ('RSV9100009', 'RM91000001', 'USR1000009', '2026-04-05 14:00:00', '2026-04-07 12:00:00', 'Completed'),
  ('RSV9100010', 'RM92000002', 'USR2000010', '2026-04-08 14:00:00', '2026-04-10 12:00:00', 'Completed'),
  ('RSV9100011', 'RM91000003', 'USR1000011', '2026-04-11 14:00:00', '2026-04-13 12:00:00', 'Completed'),
  ('RSV9100012', 'RM92000004', 'USR2000012', '2026-04-15 14:00:00', '2026-04-17 12:00:00', 'Completed')
ON DUPLICATE KEY UPDATE
  `RoomId` = VALUES(`RoomId`),
  `UserId` = VALUES(`UserId`),
  `CheckInDate` = VALUES(`CheckInDate`),
  `CheckOutDate` = VALUES(`CheckOutDate`),
  `Status` = VALUES(`Status`);

-- =============================
-- 2) Trigger test: TRG_AutoLog_Payment
-- =============================
-- Q1: co du Deposit/FinalPayment/FullPayment va 1 Pending de test bo loc
-- Q2: them du lieu ngoai quy de test filter trong report
DELETE FROM `FinancialLedger`
WHERE `ReferenceId` IN (
  'PMT9100001', 'PMT9100002', 'PMT9100003', 'PMT9100004', 'PMT9100005', 'PMT9100006',
  'PMT9100007', 'PMT9100008', 'PMT9100009', 'PMT9100010', 'PMT9100011', 'PMT9100012',
  'PMT9100013', 'PMT9100014'
);

DELETE FROM `Payment`
WHERE `PaymentId` IN (
  'PMT9100001', 'PMT9100002', 'PMT9100003', 'PMT9100004', 'PMT9100005', 'PMT9100006',
  'PMT9100007', 'PMT9100008', 'PMT9100009', 'PMT9100010', 'PMT9100011', 'PMT9100012',
  'PMT9100013', 'PMT9100014'
);

INSERT INTO `Payment` (
  `PaymentId`, `ReservationId`, `PaymentType`, `Amount`, `PaymentDate`, `Status`
)
VALUES
  -- Hotel HT91000001 (Q1)
  ('PMT9100001', 'RSV9100001', 'Deposit',       800000, '2026-01-05 15:00:00', 'Completed'),
  ('PMT9100002', 'RSV9100001', 'FinalPayment', 1200000, '2026-01-06 11:00:00', 'Completed'),
  ('PMT9100003', 'RSV9100002', 'FullPayment',  2600000, '2026-01-07 15:00:00', 'Completed'),
  ('PMT9100004', 'RSV9100003', 'FullPayment',  3200000, '2026-01-11 15:30:00', 'Completed'),
  ('PMT9100005', 'RSV9100004', 'FullPayment',  1500000, '2026-01-13 16:00:00', 'Completed'),
  ('PMT9100006', 'RSV9100003', 'Deposit',       500000, '2026-01-10 10:00:00', 'Pending'),

  -- Hotel HT92000001 (Q1)
  ('PMT9100007', 'RSV9100005', 'FullPayment',  4000000, '2026-01-06 16:00:00', 'Completed'),
  ('PMT9100008', 'RSV9100006', 'Deposit',      1000000, '2026-01-09 15:00:00', 'Completed'),
  ('PMT9100009', 'RSV9100006', 'FinalPayment', 2000000, '2026-01-10 11:00:00', 'Completed'),
  ('PMT9100010', 'RSV9100007', 'FullPayment',  2200000, '2026-01-12 16:00:00', 'Completed'),
  ('PMT9100011', 'RSV9100008', 'FullPayment',  1400000, '2026-01-15 17:00:00', 'Completed'),

  -- Q2 data (khong duoc xuat hien trong report Q1)
  ('PMT9100012', 'RSV9100009', 'FullPayment',  1800000, '2026-04-05 16:00:00', 'Completed'),
  ('PMT9100013', 'RSV9100010', 'FinalPayment', 1700000, '2026-04-08 16:30:00', 'Completed'),
  ('PMT9100014', 'RSV9100011', 'Deposit',       900000, '2026-04-11 12:00:00', 'Completed')
;

SELECT
  p.`PaymentId`,
  p.`Status`,
  p.`PaymentType`,
  fl.`EventType`,
  fl.`DebitAmount`,
  fl.`CreditAmount`,
  fl.`Date`
FROM `Payment` p
LEFT JOIN `FinancialLedger` fl ON fl.`ReferenceId` = p.`PaymentId`
WHERE p.`PaymentId` IN (
  'PMT9100001', 'PMT9100002', 'PMT9100003', 'PMT9100004', 'PMT9100005', 'PMT9100006',
  'PMT9100007', 'PMT9100008', 'PMT9100009', 'PMT9100010', 'PMT9100011'
)
ORDER BY p.`PaymentId`;

-- =============================
-- 3) Trigger test: TRG_AutoLog_Refund
-- =============================
DELETE FROM `FinancialLedger`
WHERE `ReferenceId` IN ('RFD9100001', 'RFD9100002', 'RFD9100003');

DELETE FROM `Refund`
WHERE `RefundId` IN ('RFD9100001', 'RFD9100002', 'RFD9100003');

INSERT INTO `Refund` (
  `RefundId`, `ReservationId`, `RefundAmount`, `PenaltyAmount`, `ProcessedAt`
)
VALUES
  ('RFD9100001', 'RSV9100002', 300000,  50000, '2026-01-20 09:00:00'),
  ('RFD9100002', 'RSV9100007', 500000, 100000, '2026-01-22 09:30:00'),
  ('RFD9100003', 'RSV9100012', 250000,  25000, '2026-04-20 08:30:00');

SELECT
  fl.`ReferenceId`,
  fl.`EventType`,
  fl.`DebitAmount`,
  fl.`CreditAmount`,
  fl.`Date`
FROM `FinancialLedger` fl
WHERE fl.`ReferenceId` IN ('RFD9100001', 'RFD9100002', 'RFD9100003')
ORDER BY fl.`ReferenceId`, fl.`EventType`;

-- =============================
-- 4) Trigger test: TRG_AuditPriceChange
-- =============================
-- Case A: change <= 50% (should NOT log)
UPDATE `Room`
SET `CurrentPrice` = 1450000
WHERE `RoomId` = 'RM91000001';

-- Case B: change > 50% compared to BasePrice=1000000 (should log)
UPDATE `Room`
SET `CurrentPrice` = 1700000
WHERE `RoomId` = 'RM91000001';

SELECT
  pcl.`RoomId`,
  pcl.`OldPrice`,
  pcl.`NewPrice`,
  pcl.`ChangedAt`
FROM `PriceChangeLog` pcl
WHERE pcl.`RoomId` = 'RM91000001'
ORDER BY pcl.`ChangedAt` DESC;

-- =============================
-- 5) Procedure test: 3 procedure report rieng
-- =============================
-- Expected Q1/2026 cho 3 bang output:
-- Bang 1 (Top 3 phong):
--   HT91000001: RM91000003 (3,200,000), RM91000002 (2,350,000), RM91000001 (2,000,000)
--   HT92000001: RM92000001 (4,000,000), RM92000002 (3,000,000), RM92000003 (1,800,000)
-- Bang 2 (RefundRatio):
--   HT91000001: RevenueIn=9,350,000 | Refund=300,000 | Ratio~0.0321
--   HT92000001: RevenueIn=10,700,000 | Refund=500,000 | Ratio~0.0467
-- Bang 3 (ADR/RevPAR):
--   HT91000001: ADR=1,168,750 | RevPAR~25,972.22
--   HT92000001: ADR=1,337,500 | RevPAR~29,722.22
-- Luu y: Pending payment PMT9100006 khong duoc ghi ledger.
-- Goi rieng theo tung report (moi CALL tra ve 1 bang ket qua):
CALL `SP_Generate_QuarterlyTop3Rooms`(2026, 1);
CALL `SP_Generate_QuarterlyRefundRatio`(2026, 1);
CALL `SP_Generate_QuarterlyADRRevPAR`(2026, 1);

-- Optional: test Q2 filter
CALL `SP_Generate_QuarterlyTop3Rooms`(2026, 2);
CALL `SP_Generate_QuarterlyRefundRatio`(2026, 2);
CALL `SP_Generate_QuarterlyADRRevPAR`(2026, 2);
