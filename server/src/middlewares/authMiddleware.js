const jwt = require("jsonwebtoken");

exports.protect = (req, res, next) => {
    try {
        let token;
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ success: false, message: "Vui lòng đăng nhập để truy cập" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { UserId, Role, Email }
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn" });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.Role)) {
            return res.status(403).json({ success: false, message: "Tài khoản của bạn không có quyền thực hiện chức năng này" });
        }
        next();
    };
};
