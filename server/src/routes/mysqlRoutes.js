const express = require("express");
const reportController = require("../controllers/mysql/reportController");
const bookingController = require("../controllers/mysql/bookingController");
const roomController = require("../controllers/mysql/roomController");

const router = express.Router();

router.post("/rooms", roomController.createRoom);

router.get("/reports/top3-rooms", reportController.getQuarterlyTop3RoomsReport);
router.get("/reports/refund-ratio", reportController.getQuarterlyRefundRatioReport);
router.get("/reports/adr-revpar", reportController.getQuarterlyAdrRevparReport);
router.get("/financial-ledgers", reportController.getFinancialLedgers);
router.get("/bookings", bookingController.getReservations);
router.post("/bookings/book-room", bookingController.bookRoom);
router.post("/bookings/check-in-payment", bookingController.processCheckInPayment);
router.post("/bookings/check-out", bookingController.processCheckOut);
router.post("/bookings/cancel", bookingController.cancelReservation);

module.exports = router;
