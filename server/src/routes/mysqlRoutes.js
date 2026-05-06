const express = require("express");
const reportController = require("../controllers/mysql/reportController");
const bookingController = require("../controllers/mysql/bookingController");

const router = express.Router();

router.get("/reports/top3-rooms", reportController.getQuarterlyTop3RoomsReport);
router.get("/reports/refund-ratio", reportController.getQuarterlyRefundRatioReport);
router.get("/reports/adr-revpar", reportController.getQuarterlyAdrRevparReport);
router.get("/reports/monthly-revenue", reportController.getMonthlyRevenueReport);
router.get("/financial-ledgers", reportController.getFinancialLedgers);
router.get("/price-logs", reportController.getPriceChangeLogs);
router.get("/bookings/admin", bookingController.getAdminBookings);
router.post("/bookings/book-room", bookingController.bookRoom);
router.post("/bookings/check-in-payment", bookingController.processCheckInPayment);
router.post("/bookings/check-out", bookingController.processCheckOut);

module.exports = router;
