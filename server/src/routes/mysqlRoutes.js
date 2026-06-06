const express = require("express");
const reportController = require("../controllers/mysql/reportController");
const bookingController = require("../controllers/mysql/bookingController");
const roomController = require("../controllers/mysql/roomController");
const authController = require("../controllers/mysql/authController");
const adminController = require("../controllers/mysql/adminController");
const { protect, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/auth/register", authController.register);
router.post("/auth/verify-otp", authController.verifyOtp);
router.post("/auth/login", authController.login);

router.post("/rooms", protect, authorize("Admin"), roomController.createRoom);

router.get("/reports/top3-rooms", protect, authorize("Admin"), reportController.getQuarterlyTop3RoomsReport);
router.get("/reports/refund-ratio", protect, authorize("Admin"), reportController.getQuarterlyRefundRatioReport);
router.get("/reports/adr-revpar", protect, authorize("Admin"), reportController.getQuarterlyAdrRevparReport);
router.get("/reports/monthly-revenue", protect, authorize("Admin"), reportController.getMonthlyRevenueReport);
router.get("/financial-ledgers", protect, authorize("Admin"), reportController.getFinancialLedgers);
router.get("/price-logs", protect, authorize("Admin"), reportController.getPriceChangeLogs);
router.get("/bookings/admin", protect, authorize("Admin"), bookingController.getAdminBookings);

// Booking (Khách hàng & Admin)
router.get("/bookings", protect, bookingController.getReservations);
router.post("/bookings/book-room", protect, bookingController.bookRoom);
router.post("/bookings/check-in-payment", protect, bookingController.processCheckInPayment);
router.post("/bookings/check-out", protect, bookingController.processCheckOut);
router.post("/bookings/cancel", protect, bookingController.cancelReservation);

// Webhook Cổng Thanh Toán (Không bắt protect vì gọi từ Server của bên thứ 3)
router.post("/webhooks/payment", bookingController.webhookPayment);

// Admin Routes
router.get("/admin/analytics", protect, authorize("Admin"), adminController.getDashboardAnalytics);

module.exports = router;
