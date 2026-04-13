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
- Thanh tìm kiếm khách sạn
- Heading "Tìm kiếm khách sạn hoàn hảo cho kỳ nghỉ của bạn"
- Subheading "Khám phá hàng ngàn khách sạn trên khắp thế giới"
- Quick filter chips — Nha Trang, Đà Nẵng, Phú Quốc, Hội An, Đà Lạt (có icon MapPin)
- Stats bar hiển thị số liệu (500+ Khách sạn, 10K+ Đánh giá...)
