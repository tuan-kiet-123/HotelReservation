const { pool } = require("../../config/mysql");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Otp = require("../../models/mongo/Otp");
const UserMongo = require("../../models/mongo/User");
const { sendOtpEmail } = require("../../utils/mailer");

const generateToken = (user) => {
    return jwt.sign(
        { UserId: user.UserId, Role: user.Role, Email: user.Email },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

/**
 * Tạo tự động ID theo định dạng US + 8 số
 */
async function generateNextUserId(conn) {
    const [rows] = await conn.query("SELECT UserId FROM User ORDER BY UserId DESC LIMIT 1");
    if (rows.length === 0) {
        return "US00000001";
    }
    const lastId = rows[0].UserId;
    const numberPart = parseInt(lastId.substring(2), 10);
    const nextNumber = numberPart + 1;
    return "US" + String(nextNumber).padStart(8, "0");
}

exports.register = async (req, res) => {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin đăng ký" });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Kiểm tra email tồn tại
        const [existing] = await conn.query("SELECT UserId FROM User WHERE Email = ?", [email]);
        if (existing.length > 0) {
            await conn.rollback();
            return res.status(400).json({ success: false, message: "Email này đã được sử dụng" });
        }

        // Thay vì Insert vào DB ngay, ta lưu OTP vào MongoDB và trả về required OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        await Otp.deleteMany({ email }); // Xóa OTP cũ nếu có
        await Otp.create({ email, otp: otpCode });

        const isSent = await sendOtpEmail(email, otpCode);
        
        if (!isSent) {
            await conn.rollback();
            return res.status(500).json({ success: false, message: "Không thể gửi email OTP, vui lòng thử lại" });
        }

        await conn.commit();
        
        return res.status(200).json({
            success: true,
            requiresOtp: true,
            message: "Mã OTP đã được gửi đến email của bạn"
        });
    } catch (error) {
        await conn.rollback();
        console.error("Lỗi đăng ký:", error);
        return res.status(500).json({ success: false, message: "Lỗi Server" });
    } finally {
        conn.release();
    }
};

exports.verifyOtp = async (req, res) => {
    const { fullName, email, password, otp } = req.body;

    if (!email || !otp || !fullName || !password) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin xác thực" });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const record = await Otp.findOne({ email });
        if (!record || record.otp !== otp) {
            await conn.rollback();
            return res.status(400).json({ success: false, message: "Mã OTP không hợp lệ hoặc đã hết hạn" });
        }

        // OTP đúng, tiến hành tạo User
        const newUserId = await generateNextUserId(conn);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        await conn.query(
            "INSERT INTO User (UserId, FullName, Email, Password, Role) VALUES (?, ?, ?, ?, 'Customer')",
            [newUserId, fullName, email, hashedPassword]
        );

        // Đồng bộ User sang MongoDB
        try {
            await UserMongo.create({
                _id: newUserId,
                FullName: fullName,
                Email: email,
                Phone: "0123456789" // Giá trị mặc định do form đăng ký hiện tại không có SĐT
            });
        } catch (mongoError) {
            console.error("Lỗi đồng bộ User sang Mongo:", mongoError);
            // Vẫn tiếp tục vì MySQL đã lưu thành công
        }

        await Otp.deleteMany({ email }); // Xóa OTP sau khi dùng
        await conn.commit();

        const userObj = {
            UserId: newUserId,
            FullName: fullName,
            Email: email,
            Role: "Customer"
        };

        const token = generateToken(userObj);

        return res.status(201).json({
            success: true,
            message: "Đăng ký và kích hoạt tài khoản thành công",
            data: { ...userObj, token }
        });
    } catch (error) {
        await conn.rollback();
        console.error("Lỗi xác thực OTP:", error);
        return res.status(500).json({ success: false, message: "Lỗi Server" });
    } finally {
        conn.release();
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Vui lòng cung cấp email và password" });
    }

    try {
        const [rows] = await pool.query(
            "SELECT UserId, FullName, Email, Password, Role FROM User WHERE Email = ?",
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: "Sai email hoặc mật khẩu" });
        }

        const user = rows[0];

        // So sánh mật khẩu (hỗ trợ cả mật khẩu chưa hash từ dữ liệu mẫu cũ)
        const isMatch = await bcrypt.compare(password, user.Password);
        if (!isMatch && password !== user.Password) {
            return res.status(401).json({ success: false, message: "Sai email hoặc mật khẩu" });
        }

        const token = generateToken(user);
        delete user.Password; // Không trả password về client

        return res.status(200).json({
            success: true,
            message: "Đăng nhập thành công",
            data: { ...user, token }
        });
    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        return res.status(500).json({ success: false, message: "Lỗi Server" });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: "Vui lòng cung cấp email" });
    }

    try {
        const [rows] = await pool.query("SELECT UserId FROM User WHERE Email = ?", [email]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Email chưa được đăng ký trong hệ thống" });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        await Otp.deleteMany({ email });
        await Otp.create({ email, otp: otpCode });

        const isSent = await sendOtpEmail(email, otpCode);
        if (!isSent) {
            return res.status(500).json({ success: false, message: "Không thể gửi email, vui lòng thử lại" });
        }

        return res.status(200).json({ success: true, message: "Mã OTP đã được gửi đến email của bạn" });
    } catch (error) {
        console.error("Lỗi forgotPassword:", error);
        return res.status(500).json({ success: false, message: "Lỗi Server" });
    }
};

exports.resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin" });
    }

    try {
        const record = await Otp.findOne({ email });
        if (!record || record.otp !== otp) {
            return res.status(400).json({ success: false, message: "Mã OTP không hợp lệ hoặc đã hết hạn" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await pool.query("UPDATE User SET Password = ? WHERE Email = ?", [hashedPassword, email]);
        await Otp.deleteMany({ email });

        return res.status(200).json({ success: true, message: "Đổi mật khẩu thành công. Bạn có thể đăng nhập ngay." });
    } catch (error) {
        console.error("Lỗi resetPassword:", error);
        return res.status(500).json({ success: false, message: "Lỗi Server" });
    }
};
