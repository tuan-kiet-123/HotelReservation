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
