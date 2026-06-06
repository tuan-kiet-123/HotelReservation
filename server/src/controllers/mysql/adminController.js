const { pool } = require("../../config/mysql");

exports.getDashboardAnalytics = async (req, res) => {
    try {
        const conn = await pool.getConnection();

        // 1. Tổng số phòng và Số phòng đang có người (hoặc đã đặt hôm nay)
        const [[totalRooms]] = await conn.query("SELECT COUNT(*) AS total FROM Room");
        
        // 2. Doanh thu tổng
        const [[revenue]] = await conn.query("SELECT SUM(Amount) AS total FROM Payment WHERE Status = 'Completed'");

        // 3. Số lượng Đặt phòng theo trạng thái
        const [bookingStatus] = await conn.query("SELECT Status, COUNT(*) AS count FROM Reservation GROUP BY Status");

        // 4. Doanh thu 7 ngày gần nhất (để vẽ biểu đồ)
        const [revenueByDay] = await conn.query(`
            SELECT DATE(PaymentDate) as date, SUM(Amount) as revenue
            FROM Payment
            WHERE Status = 'Completed' AND PaymentDate >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(PaymentDate)
            ORDER BY DATE(PaymentDate) ASC
        `);

        // 5. Thống kê loại phòng được đặt nhiều nhất
        const [roomTypeStats] = await conn.query(`
            SELECT rt.TypeName, COUNT(r.ReservationId) as count
            FROM Reservation r
            JOIN Room rm ON r.RoomId = rm.RoomId
            JOIN RoomType rt ON rm.TypeId = rt.TypeId
            GROUP BY rt.TypeName
        `);

        conn.release();

        return res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalRooms: totalRooms.total || 0,
                    totalRevenue: revenue.total || 0
                },
                bookingStatus,
                revenueByDay,
                roomTypeStats
            }
        });
    } catch (error) {
        console.error("Lỗi getDashboardAnalytics:", error);
        return res.status(500).json({ success: false, message: "Lỗi Server" });
    }
};
