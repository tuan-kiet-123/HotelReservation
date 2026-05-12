# Frontend: Quang da Vinci

## 1. Setup Frontend
- Xoá `App.css` và code mẫu trong `App.jsx`
- Tạo 2 trang: `HomePage` và `NotFound`
- Tạo route cho 2 trang trên (`react-router`)
- Sửa `index.css` — khai báo design tokens (màu sắc, shadow, transitions...)
- Cài đặt **Tailwind CSS v4** và **Shadcn UI**

# Cài các thư viện npm install
`react-router`: Định tuyến SPA — chuyển trang mà không reload
`sonner`: Hiển thị thông báo dạng toast pop-up (thành công, lỗi, cảnh báo)
`axios`: HTTP Client — gửi/nhận dữ liệu qua REST API từ server
`lucide-react`: Bộ icon SVG nhẹ, đẹp, dễ tuỳ chỉnh kích thước và màu
`tailwindcss`: Framework CSS utility-first — viết style trực tiếp trong className
`shadcn/ui`: Bộ component UI tái sử dụng xây dựng trên Tailwind + Radix UI

## 2. Trang 404 NotFound
- Ảnh 404_NotFound
- Nút "Quay về trang chủ" dẫn về `/`


## 3. Trang HomePage
- **Header**: Thanh điều hướng trong suốt (glassmorphism), Logo hình ảnh, nút Đăng ký (hover effect) và Đăng nhập (nền gradient amber). Có menu cho Mobile.
- **Hero Section**: 
  - Ảnh nền tràn màn hình `bg_HomePage.jpg` với màng đen mờ (`backdrop-blur`).
  - Tiêu đề chính và các thanh công cụ được đưa lên vị trí trung tâm.
  - **Thanh tìm kiếm**: Thiết kế bo tròn với nút Search nổi bật.
  - **Date Picker (Chọn ngày)**: Widget chọn ngày tích hợp 1 lịch duy nhất cho phép click lần 1 chọn ngày Check-in (màu amber), click lần 2 chọn ngày Check-out (màu emerald). 
  - **Guest Picker (Chọn số lượng)**: Dropdown popup cho phép chỉnh số lượng Phòng, Người lớn (18+), Trẻ em (0-17) qua các nút tăng giảm (+/-).
  - Tự động đóng popup lịch/guest khi click ra ngoài (`useRef` + `useEffect`).
- **Footer**: Giao diện chân trang đa cột, cung cấp danh sách địa chỉ khách sạn tại Châu Âu, Châu Á, và thông tin liên hệ của nhóm phát triển (Quang, Kiệt, Phú).

## 4. Trang SearchPage & Logic Tìm Kiếm
- **Cập nhật HomePage**: 
  - Thay thế ô chọn "Số phòng" thành "Loại phòng" (`Standard`, `Deluxe`, `Luxury`).
  - Thiết lập logic Client-side tự động giới hạn Số người lớn & Trẻ em tối đa tương ứng với sức chứa của từng loại phòng.
  - Khi bấm Search, đẩy các tham số `q` (tên), `checkIn`, `checkOut`, `roomType` lên URL để chuyển sang `/hotels`.
- **SearchPage UI**:
  - Tạo layout chia 2 cột với CSS thuần (Vanilla CSS) để đảm bảo độ chính xác (Sidebar 260px và Grid các thẻ khách sạn).
  - **Thanh tìm kiếm ngang (Top Bar)**: Lấy giá trị từ URL để hiển thị lại Tên, Ngày (`<input type="date">`) và Loại phòng (`<select>`).
  - Thẻ khách sạn hiển thị dữ liệu thật: Tên, Vị trí, Tiện ích (Amenities) lấy từ MongoDB.
- **Tích hợp API Tìm Kiếm Liên DB (Mongo + MySQL)**:
  - Cập nhật Stored Procedure `sp_SearchAvailableRooms` trong MySQL Aiven để nhận tham số `p_RoomType` và lọc theo đúng loại phòng yêu cầu.
  - Xử lý lỗi ngày tháng: Viết logic ở `searchController.js` để format chuỗi ngày ISO (`2026-05-05T00:00:00.000Z`) thành chuẩn `DATETIME` của MySQL (`YYYY-MM-DD HH:MM:SS`).
  - Kết nối hoàn chỉnh luồng Frontend gọi `GET /api/search` để lấy danh sách khách sạn đáp ứng được Tên + Ngày check-in/out còn trống + Sức chứa.
- **Thêm tính năng bổ trợ Backend**: 
  - Viết mới bộ Controller/Service/Route `POST /api/mysql/rooms` để phục vụ việc thêm phòng trực tiếp bằng JSON (Thunder Client) vào MySQL Aiven.
