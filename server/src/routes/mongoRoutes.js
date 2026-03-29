const express = require("express");
const hotelController = require("../controllers/mongo/hotelController");
const reviewController = require("../controllers/mongo/reviewController");

const router = express.Router();

router.get("/hotels", hotelController.getHotels);
router.post("/hotels", hotelController.createHotel);
router.get("/hotels/:id", hotelController.getHotelById);
router.put("/hotels/:id", hotelController.updateHotel);
router.delete("/hotels/:id", hotelController.deleteHotel);

router.get("/reviews", reviewController.getReviews);
router.post("/reviews", reviewController.createReview);
router.put("/reviews/:id", reviewController.updateReview);
router.delete("/reviews/:id", reviewController.deleteReview);

module.exports = router;
