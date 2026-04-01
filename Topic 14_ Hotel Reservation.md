

Phân tích Nghiệp vụ (Business Analysis)
- Mô tả Kịch bản
Hệ thống Đặt phòng Khách sạn Nghỉ dưỡng (Resort Reservation System)
được xây dựng để quản lý toàn bộ quy trình từ khâu tìm kiếm, lựa chọn
phòng/dịch vụ cho đến xác nhận và thanh toán giao dịch. Nhiệm vụ cốt lõi của
hệ thống là cung cấp một trải nghiệm đặt chỗ liền mạch, hiệu quả cho du khách,
đồng thời đảm bảo tính chính xác và kịp thời của dữ liệu phòng trống cũng như
các tiện ích đi kèm như spa, tour, và nhà hàng trong khuôn viên khu nghỉ
dưỡng.
Trong thực tế vận hành, hệ thống đặt phòng đối mặt với hai thách thức
trái ngược nhau về mặt dữ liệu:
● Nhu cầu Tìm kiếm: Hàng triệu người dùng truy cập cùng lúc để xem
thông tin, tiện nghi khách sạn. Dữ liệu này thường xuyên thay đổi cấu
trúc khi khu nghỉ dưỡng nâng cấp, đòi hỏi khả năng mở rộng và truy xuất
cực nhanh (ưu tiên tính Sẵn sàng).
● Nhu cầu Đặt phòng: Khi người dùng quyết định thanh toán, tính toàn
vẹn dữ liệu trở thành ưu tiên tuyệt đối. Vấn đề xảy ra khi hai khách hàng
cùng nhìn thấy một phòng trống cuối cùng và bấm đặt cùng lúc. Hệ thống
bắt buộc phải xử lý giao dịch này một cách nguyên tử (Atomically) để
ngăn chặn việc đặt trùng (Double-booking).
Để giải quyết bài toán này, hệ thống áp dụng kiến trúc Polyglot
Persistence: sử dụng kết hợp RDBMS (SQL Server/Oracle) cho các giao dịch
tài chính/đặt chỗ (ACID) và NoSQL (MongoDB) cho việc lưu trữ danh mục
nội dung linh hoạt (BASE).
-  Phân tích Yêu cầu Người dùng
2.1. Đối với Khách du lịch
Khách du lịch đòi hỏi trải nghiệm tìm kiếm mượt mà nhưng cần sự đảm
bảo tuyệt đối khi thanh toán.
● Tìm kiếm & Tra cứu Tiện nghi:
○ Người dùng cần tìm kiếm khách sạn dựa trên các tiện nghi đa dạng
(ví dụ: "có hồ bơi", "gần biển", "có spa").
○ Yêu cầu kỹ thuật: Hệ thống phải trả về kết quả gần như tức thời.
Dữ liệu mô tả và tiện nghi được lưu trữ trên NoSQL để tối ưu hóa
tốc độ đọc và linh hoạt trong cấu trúc dữ liệu (Schema-less).
● Đặt phòng:

○ Khi người dùng tiến hành thanh toán cho một phòng cụ thể, hệ
thống phải đảm bảo phòng đó chưa bị ai khác lấy mất trong
mili-giây trước đó và giao dịch được ghi nhận chính xác.
○ Chính sách đặt phòng:
■ Đặt phòng tiêu chuẩn (Trước ngày Check-in từ 7 ngày
trở lên): Khách hàng bắt buộc cộc 30% tổng giá trị đơn đặt
phòng tại thời điểm đặt và thanh toán phần còn lại khi
Check-in nhận phòng.
■ Đặt phòng cận ngày (Trong vòng 7 ngày trước khi
Check-in): Khách hàng bắt buộc thanh toán 100% tổng giá
trị đơn đặt phòng tại thời điểm đặt.
○ Yêu cầu kỹ thuật: Sử dụng cơ chế Pessimistic Locking trên SQL để
khóa bản ghi phòng ngay thời điểm giao dịch bắt đầu. Quá trình
ghi nhận thanh toán vào bảng Payment_Transaction phải là một
giao dịch nguyên tử (Atomic Transaction) trong RDBMS.
● Hủy phòng:
○ Người dùng cần khả năng hủy đơn đặt phòng đã thanh toán theo
chính sách của khách sạn.
○ Chính sách hủy phòng:
■ Trước 30 ngày so với ngày Check-in: Hoàn lại 100% số
tiền đã thanh toán.
■ Từ 7 đến 30 ngày: Không hoàn lại số tiền đã cọc (30% tổng
giá trị đơn đặt phòng).
■ Trong vòng 7 ngày hoặc không đến: Không hoàn lại tiền
đã thanh toán.
■ Lưu ý: Thời gian Check-in tiêu chuẩn là từ 14:00. Hệ thống
sẽ giữ phòng cho người dùng đến 23:59 của ngày Check-in.
Nếu người dùng không có mặt sau thời điểm này và không
có bất kỳ thông báo gia hạn nào, đơn đặt phòng sẽ tự động bị
hủy.
○ Yêu cầu kỹ thuật: Sử dụng RDBMS (SQL) và cơ chế Transaction
xử lý giao dịch hủy phòng một cách nguyên tử. Logic tính toán
Hoàn tiền/Phí phạt phải được thực hiện chính xác trong Stored
Procedure dựa trên ngày hủy và ngày Check-in theo Chính sách
trên.
● Chia sẻ Trải nghiệm (Đánh giá Khách sạn):

○ Người dùng muốn đóng góp ý kiến về trải nghiệm của mình (điểm
số, nhận xét, hình ảnh) sau khi trả phòng.
○ Yêu cầu kỹ thuật: Dữ liệu đánh giá (bao gồm nội dung văn bản,
điểm số) nên được lưu trữ trên NoSQL (MongoDB) để tận dụng
cấu trúc linh hoạt (Schema-less). Cần tạo Indexing trên các trường
như hotel_id để tối ưu tốc độ truy xuất/hiển thị cho khách hàng
khác.
2.2 Đối với Quản lý Khách sạn
Quản lý cần các công cụ để giám sát hiệu quả kinh doanh và kiểm soát rủi
ro về giá.
● Lưu trữ Lịch sử Giao dịch và Tài chính:
○ Hệ thống cần lưu lịch sử giao dịch chi tiết bao gồm ngày đặt,
ngày CheckIn/CheckOut, giá phòng thực tế tại thời điểm đặt,
cũng như mọi sự kiện tài chính (Đặt cọc, Thanh toán, Hoàn
tiền, Phí phạt hủy).
○ Yêu cầu kỹ thuật: Xây dựng bảng Financial Ledger (Sổ cái
tài chính) trong RDBMS để ghi nhận mọi giao dịch tài chính
dưới dạng các mục nhập chi tiết (Debit/Credit) để đảm bảo
tính đối chiếu. Bảng Refund_Log chi tiết cũng phải được
duy trì.
● Báo cáo Doanh thu:
○ Quản lý cần xem báo cáo định kỳ mỗi quý để biết:
■ "Top 3 phòng tạo ra doanh thu cao nhất"
■ "Tỷ lệ Hoàn tiền/Tổng Doanh thu"
■ “Các chỉ số ADR / RevPAR của khách sạn”
■ "Điểm đánh giá trung bình của khách sạn".
○ Yêu cầu kỹ thuật: Sử dụng SQL Window Functions  để
thực hiện xếp hạng hiệu suất phòng trong phạm vi từng
khách sạn một cách chính xác.
● Giám sát Biến động Giá:
○ Hệ thống cần tự động phát hiện và ghi lại các thay đổi giá
bất thường để tránh sai sót của nhân viên hoặc gian lận. Cụ
thể, nếu giá phòng thay đổi quá 50%, hệ thống phải tự động
ghi lại sự kiện này vào nhật ký (Log).

○ Yêu cầu kỹ thuật: Triển khai SQL Trigger để tự động kiểm
tra giá trị cũ và mới và ghi vào bảng Log nếu điều kiện thỏa
mãn.


