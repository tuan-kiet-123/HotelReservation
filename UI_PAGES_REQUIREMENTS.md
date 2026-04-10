# Danh sách các trang giao diện cần xây dựng (UI/UX Requirements)

Dựa trên tài liệu phân tích nghiệp vụ hệ thống Đặt phòng Khách sạn Nghỉ dưỡng (Resort Reservation System), dưới đây là danh sách các trang giao diện cần thiết cho 2 nhóm người dùng chính: **Khách du lịch (Customer)** và **Quản lý Khách sạn (Management)**.



## 1. Dành cho Khách du lịch (Customer App / Web Route)

Khách du lịch cần một trải nghiệm tìm kiếm mượt mà, layout rõ ràng (UI/UX linh hoạt, có thể áp dụng thiết kế thẻ - cards design, hình ảnh chất lượng cao để gợi cảm xúc visceral).

### 1.1. Trang Chủ (Home Page) (Quang)
- **Hero Section:** Thanh tìm kiếm nổi bật (Điểm đến, Ngày Check-in / Check-out, Số người/phòng).

### 1.2. Trang Kết quả Tìm kiếm & Lọc (Search & Filter Page) (Quang)
- **Bộ lọc động (Dynamic Filters):** Lọc theo các tiện nghi chuyên biệt (Hồ bơi, Gần biển, Spa...), Lọc theo đánh giá.
- **Danh sách kết quả:** Hiển thị dưới dạng Grid/List kèm hình ảnh, giá cơ bản, điểm đánh giá trung bình.
- **Sắp xếp:** Giá thấp đến cao, Đánh giá cao nhất.

### 1.3. Trang Chi tiết Khách sạn & Phòng (Hotel Detail Page) (Kiệt)
- **Gallery Hình ảnh:** Slide/Grid hình ảnh chất lượng cao của khách sạn.
- **Thông tin & Tiện ích:** Danh sách các tiện nghi chi tiết (sử dụng icon trực quan).
- **Danh sách Phòng trống:** Hiển thị chi tiết từng loại phòng trống và nút "Đặt ngay" (cần phản hồi siêu nhanh).
- **Khu vực Đánh giá (Review Section):** Hiển thị các nhận xét, hình ảnh thực tế và điểm số từ người dùng trước.

### 1.4. Trang Thanh toán & Xác nhận (Checkout & Payment Page) (Kiệt)
- **Tóm tắt đơn hàng:** Chi tiết phòng, số đêm, tổng tiền.
- **Hiển thị Chính sách linh hoạt:** 
  - Nếu Check-in > 7 ngày: Hiển thị yêu cầu cọc 30% và số tiền cần thanh toán hiện tại, phần còn lại thanh toán sau.
  - Nếu Check-in <= 7 ngày: Yêu cầu thanh toán 100%.
- **Form thanh toán:**.
- **Xử lý giao dịch:** Trạng thái loading kèm thông báo giữ phòng (lock) thành công tránh double-booking.

### 1.5. Trang Quản lý Đặt phòng (My Bookings) (Kiệt)
- **Lịch sử & Đơn hiện tại:** Liệt kê các phòng đã đặt kèm trạng thái (Đã cọc, Đã thanh toán, Đã hủy).
- **Chức năng Hủy phòng:**
  - Nút "Hủy phòng" kèm Modal xác nhận.
  - Hệ thống tự động tính toán và hiển thị rõ số tiền được hoàn trả (100%, 0% hoặc mất 30% cọc) dựa vào khoảng thời gian so với ngày Check-in.
- **Chức năng Đánh giá:** Nút "Viết đánh giá" sẽ xuất hiện đối với các đơn đặt phòng đã hoàn thành (đã check-out).

### 1.6. Modal / Trang Yêu cầu Đánh giá (Review Form Overlay) (Kiệt)
- Form cho phép người dùng rate sao, nhập bình luận và upload hình ảnh trải nghiệm.

---

## 2. Dành cho Quản lý Khách sạn (Admin Dashboard)

Giao diện Quản lý tập trung vào tính rõ ràng, hiển thị số liệu phân tích trực quan (Data-heavy UI), có thể ứng dụng layout Dashboard với Sidebar và Data Tables.

### 2.1. Trang Tổng quan Quản trị (Dashboard) (Phú)
- **Chỉ số hiệu suất (KPIs):** Hiển thị các chỉ số ADR (Average Daily Rate), RevPAR (Revenue Per Available Room), tổng doanh thu, tỷ lệ lấp đầy.
- **Top danh mục:** Biểu đồ/Danh sách Top 3 phòng tạo ra doanh thu cao nhất.
- **Alerts/Cảnh báo:** Thông báo nhanh về các biến động giá bất thường.

### 2.2. Trang Quản lý Sổ cái Tài chính & Giao dịch (Financial Ledger) (Phú)
- **Bảng dữ liệu Giao dịch:** Hiển thị toàn bộ lịch sử (Đặt cọc, Thanh toán toàn bộ, Hoàn tiền, Phí phạt hủy).
- **Bộ lọc:** Lọc theo ngày giao dịch, loại giao dịch (Debit/Credit).
- **Chi tiết Giao dịch (Refund Logs):** Theo dõi chính xác dòng tiền và lý do hoàn trả/phạt.

### 2.3. Trang Quản lý Đặt phòng (Bookings Management) (Phú)
- Theo dõi toàn bộ đơn đặt hệ thống đang xử lý.
- Có thể xem tình trạng (người dùng chưa đến, sắp tự động hủy lúc 23:59 ngày Check-in...).

### 2.4. Trang Báo cáo Phân tích (Analytics & Reports) (Phú)
- **Tỷ lệ Hoàn tiền/Doanh thu:** Biểu đồ phân tích rủi ro hoàn tiền định kỳ mỗi quý.
- **Đánh giá trung bình:** Thống kê xu hướng đánh giá của khách hàng đối với khách sạn.

### 2.5. Trang Nhật ký Biến động Giá (Price Cảnh báo/Logs) (Phú)
- Bảng hiển thị (Data Table) các ghi nhận từ Trigger khi giá thay đổi quá 50%.
- Cột thông tin: Phòng, Giá cũ, Giá mới, Thời điểm thay đổi, Người cập nhật (nếu có).

### 2.6. Trang Quản lý Thông tin Khách sạn & Phòng (Inventory Management) (Quang)
- Form thêm/sửa/xóa khách sạn, phòng.
- Cập nhật giá phòng hằng ngày/hằng tuần (có thể test trigger cảnh báo tại đây).


