const express = require("express");
const reportController = require("../controllers/mysql/reportController");
const bookingController = require("../controllers/mysql/bookingController");

const router = express.Router();

router.get("/reports/top3-rooms", reportController.getQuarterlyTop3RoomsReport);
router.get("/reports/refund-ratio", reportController.getQuarterlyRefundRatioReport);
router.get("/reports/adr-revpar", reportController.getQuarterlyAdrRevparReport);
router.get("/financial-ledgers", reportController.getFinancialLedgers);
router.post("/bookings/book-room", bookingController.bookRoom);
router.post("/bookings/check-in-payment", bookingController.processCheckInPayment);

module.exports = router;
