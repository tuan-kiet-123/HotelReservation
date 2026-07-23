# DaVinci Resort - Hệ Thống Đặt Phòng Khách Sạn Trực Tuyến

![DaVinci Resort Banner](https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80)

> 🔗 **Trải nghiệm thực tế (Live Demo):** [https://hotel-reservation-swart-three.vercel.app](https://hotel-reservation-swart-three.vercel.app)

## 📌 Giới thiệu sơ bộ
**DaVinci Resort** là một nền tảng quản lý và đặt phòng khách sạn trực tuyến (Hotel Reservation System) được thiết kế theo mô hình kiến trúc phần mềm linh hoạt. Dự án hướng đến việc cung cấp một quy trình tìm kiếm, chọn lọc và đặt phòng mượt mà cho khách hàng, đồng thời hỗ trợ mạnh mẽ cho các nhà quản lý trong việc kiểm soát trạng thái phòng và doanh thu.

### Chức năng nổi bật
- **Tìm kiếm thông minh:** Tìm phòng trống chính xác theo thời gian (Check-in/Check-out) và lọc theo hạng phòng, giá cả.
- **Quản lý nội dung động:** Hiển thị đa dạng thông tin khách sạn (Hình ảnh thực tế, tiện ích phong phú, đánh giá).
- **Quy trình Booking an toàn:** Hệ thống đặt phòng chặt chẽ, tránh trùng lặp lịch đặt phòng.
- **Phân quyền (Role-based Access):** Quản lý tài khoản bảo mật bằng JWT dành riêng cho Người dùng (User) và Quản trị viên (Admin).

## 🛠 Công nghệ áp dụng
Dự án được xây dựng theo mô hình Full-stack, kết hợp nhiều công nghệ hiện đại:
- **Frontend:** React.js, Vite, Tailwind CSS (Giao diện chuẩn UI/UX hiện đại, tương thích mọi thiết bị di động/desktop).
- **Backend:** Node.js, Express.js (Xây dựng các RESTful API).
- **Cơ sở dữ liệu (Database):** Áp dụng kiến trúc đa cơ sở dữ liệu (Polyglot Persistence).
  - **MongoDB (NoSQL - Atlas):** Lưu trữ các dữ liệu có cấu trúc linh hoạt như Thông tin khách sạn, Danh sách hình ảnh, Đánh giá.
  - **MySQL (SQL - Aiven):** Đảm bảo tính nhất quán (ACID) cho các nghiệp vụ lõi như Giao dịch thanh toán, Đặt phòng (Booking), và Tồn kho phòng.
- **Triển khai (Deployment):** Hosting miễn phí trên Vercel (Frontend) và Render (Backend).

## 💡 Xử lý logic nổi bật
Dự án không chỉ xử lý logic cơ bản (CRUD) mà còn áp dụng các kỹ thuật thiết kế chuyên sâu:
1. **Chuyển giao logic xuống Database:** Thay vì dùng vòng lặp (for/map) phức tạp trên Backend để kiểm tra ngày trùng lặp, dự án sử dụng các **Stored Procedures** và **Custom Functions** được viết trực tiếp trong MySQL. Thuật toán sẽ tính toán các khoảng thời gian Check-in/Check-out ngay trong lõi Database để lấy ra danh sách phòng trống theo thời gian thực (Real-time), giúp tối ưu hóa hiệu suất và tiết kiệm RAM cho máy chủ Node.js.
2. **Kiến trúc Polyglot Persistence:** Kết hợp và ghép nối khéo léo dữ liệu giữa SQL và NoSQL. MongoDB phụ trách việc truy xuất siêu tốc các mô tả dài và hình ảnh để hiển thị lên giao diện (không bị gò bó bởi các cột cố định), trong khi ID cốt lõi vẫn được liên kết chặt chẽ với MySQL để chốt giao dịch thanh toán, đảm bảo không bao giờ xảy ra sai lệch dữ liệu tài chính.

---
*Dự án được thiết kế và phát triển bởi Trần Tuấn Kiệt.*
