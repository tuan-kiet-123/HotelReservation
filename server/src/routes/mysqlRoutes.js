const express = require("express");
const bookingController = require("../controllers/mysql/bookingController");

const router = express.Router();

router.get("/bookings", bookingController.getBookings);
router.post("/bookings", bookingController.createBooking);
router.get("/bookings/:id", bookingController.getBookingById);
router.put("/bookings/:id", bookingController.updateBooking);
router.delete("/bookings/:id", bookingController.deleteBooking);

module.exports = router;
