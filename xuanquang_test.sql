--
-- Code Test Procedure và Trigger của Quang
--

--
-- Procedure Huỷ phòng, Trigger Thêm tiền vào bảng QLTC
--

-- 1. Thêm khách sạn và phòng
INSERT INTO Hotel (HotelId, HotelName, Status) 
VALUES ('H001', 'Santiago Bernabeu Hotel', 1);

INSERT INTO Room (RoomId, HotelId, RoomType, BasePrice, CurrentPrice, Status) 
VALUES ('R101', 'H001', 'Deluxe', 1000000, 1000000, 1);

-- 2. Thêm đơn đặt phòng (Giả sử Check-in là 40 ngày tới để test case hoàn 100%)
INSERT INTO Reservation (ReservationId, RoomId, UserId, CheckInDate, CheckOutDate, Status)
VALUES ('RES001', 'R101', 'U001', DATE_ADD(NOW(), INTERVAL 40 DAY), DATE_ADD(NOW(), INTERVAL 42 DAY), 'Confirmed');

-- 3. Thêm giao dịch thanh toán (Giả sử đã thanh toán toàn bộ 1,000,000) [cite: 20]
INSERT INTO Payment (PaymentId, ReservationId, PaymentType, Amount, PaymentDate, Status)
VALUES ('PAY001', 'RES001', 'FullPayment', 1000000, NOW(), 'Completed');

-- Case 1: Hủy trước 30 ngày (Hoàn 100%)
--
-- Thực thi Procedure hủy phòng
CALL sp_CancelReservation('RES001');

-- Kiểm tra kết quả
-- 1. Đơn đặt phòng phải chuyển sang 'Cancelled'
SELECT Status FROM Reservation WHERE ReservationId = 'RES001';

-- 2. Phòng phải được mở khóa (Status = 1) 
SELECT Status FROM Room WHERE RoomId = 'R101';

-- 3. Kiểm tra bảng Refund (Xem tiền hoàn)
SELECT * FROM Refund WHERE ReservationId = 'RES001';

-- 4. Kiểm tra Trigger: Xem FinancialLedger đã tự động ghi log chưa
SELECT * FROM FinancialLedger WHERE ReferenceId IN (SELECT RefundId FROM Refund WHERE ReservationId = 'RES001');

-- Case 2: Hủy trong khoảng 7 - 30 ngày (Mất cọc 30%)
--
INSERT INTO Reservation (ReservationId, RoomId, UserId, CheckInDate, CheckOutDate, Status)
VALUES ('RES002', 'R101', 'U001', DATE_ADD(NOW(), INTERVAL 10 DAY), DATE_ADD(NOW(), INTERVAL 12 DAY), 'Confirmed');

INSERT INTO Payment (PaymentId, ReservationId, PaymentType, Amount, PaymentDate, Status)
VALUES ('PAY002', 'RES002', 'FullPayment', 1000000, NOW(), 'Completed');

-- Thực thi hủy
CALL sp_CancelReservation('RES002');

-- Kiểm tra kết quả: 
-- PenaltyAmount nên là 300,000 (30% của 1tr)
-- RefundAmount nên là 700,000
SELECT RefundAmount, PenaltyAmount FROM Refund WHERE ReservationId = 'RES002';

-- Case 3: Hủy sát ngày hoặc quá hạn (Không hoàn tiền)
--
INSERT INTO Reservation (ReservationId, RoomId, UserId, CheckInDate, CheckOutDate, Status)
VALUES ('RES003', 'R101', 'U001', DATE_ADD(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 4 DAY), 'Confirmed');

INSERT INTO Payment (PaymentId, ReservationId, PaymentType, Amount, PaymentDate, Status)
VALUES ('PAY003', 'RES003', 'FullPayment', 1000000, NOW(), 'Completed');

-- Thực thi hủy
CALL sp_CancelReservation('RES003');

-- Kiểm tra kết quả: RefundAmount phải bằng 0
SELECT RefundAmount, PenaltyAmount FROM Refund WHERE ReservationId = 'RES003';