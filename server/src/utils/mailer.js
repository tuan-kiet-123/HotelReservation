const nodemailer = require("nodemailer");

// Cấu hình tài khoản email mặc định cho demo (Ethereal Email hoặc Nodemailer mặc định)
let transporter;

async function initMailer() {
    // Nếu có cấu hình Gmail thật trong .env, sẽ dùng Gmail
    if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS,
            },
        });
        console.log("📧 Gmail Mailer initialized.");
    } else {
        // Fallback dùng Ethereal (môi trường test)
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log("📧 Ethereal Mailer initialized. Credentials ready.");
    }
}

initMailer();

exports.sendOtpEmail = async (email, otp) => {
    try {
        if (!transporter) await initMailer();

        const info = await transporter.sendMail({
            from: '"DaVinci Hotel Security" <security@davinci.com>',
            to: email,
            subject: "Mã OTP Kích Hoạt Tài Khoản DaVinci",
            text: `Xin chào,\n\nMã OTP của bạn là: ${otp}\n\nMã này sẽ hết hạn trong 5 phút.\n\nTrân trọng,\nDaVinci Team`,
            html: `
            <div style="font-family: Arial, sans-serif; max-w-md; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #2EC4B6; text-align: center;">DaVinci Resort</h2>
                <p>Xin chào,</p>
                <p>Bạn vừa yêu cầu đăng ký tài khoản tại DaVinci Hotel. Dưới đây là mã OTP kích hoạt tài khoản của bạn:</p>
                <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #FF6F61; border-radius: 5px;">
                    ${otp}
                </div>
                <p style="color: #888; font-size: 12px; margin-top: 20px;">Mã này sẽ tự động vô hiệu hóa sau 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
            </div>
            `,
        });

        console.log(`📩 OTP Sent to ${email}! Preview URL: %s`, nodemailer.getTestMessageUrl(info));
        return true;
    } catch (error) {
        console.error("Lỗi gửi email:", error);
        return false;
    }
};

exports.sendBookingConfirmationEmail = async (email, fullName, hotelName, checkIn, checkOut, roomType, amount) => {
    try {
        if (!transporter) await initMailer();

        const info = await transporter.sendMail({
            from: '"DaVinci Hotel Reservation" <reservation@davinci.com>',
            to: email,
            subject: "Xác nhận đặt phòng thành công - DaVinci Resort",
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <div style="text-align: center; border-bottom: 2px solid #2EC4B6; padding-bottom: 15px; mb-4">
                    <h2 style="color: #2EC4B6; margin: 0;">DaVinci Resort</h2>
                    <p style="color: #888; font-size: 14px; margin-top: 5px;">Hệ thống đặt phòng thông minh</p>
                </div>
                <h3 style="color: #333;">Xin chào ${fullName},</h3>
                <p>Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của DaVinci Resort. Dưới đây là thông tin chi tiết về đơn đặt phòng của bạn:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 40%;">Khách sạn:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${hotelName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Loại phòng:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${roomType}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Ngày Check-in:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${checkIn}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Ngày Check-out:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${checkOut}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; font-weight: bold; color: #FF6F61; font-size: 18px;">Tổng thanh toán:</td>
                        <td style="padding: 10px; font-weight: bold; color: #FF6F61; font-size: 18px;">${Number(amount).toLocaleString('vi-VN')} VND</td>
                    </tr>
                </table>

                <p style="margin-top: 30px; line-height: 1.6; color: #555;">
                    Vui lòng xuất trình mã email này hoặc Căn cước công dân tại quầy Lễ tân khi nhận phòng.<br>
                    Nếu bạn có bất kỳ thắc mắc nào, xin vui lòng liên hệ hotline: 1900-xxxx.
                </p>
                
                <p style="text-align: center; color: #888; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                    © 2026 DaVinci Resort. Trân trọng cảm ơn quý khách.
                </p>
            </div>
            `,
        });

        console.log(\`📩 Booking Confirmation Sent to \${email}! Preview URL: %s\`, nodemailer.getTestMessageUrl(info));
        return true;
    } catch (error) {
        console.error("Lỗi gửi email xác nhận đặt phòng:", error);
        return false;
    }
};
