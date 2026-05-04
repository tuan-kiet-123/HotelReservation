const express = require("express");
const hotelController = require("../controllers/mongo/hotelController");
const reviewController = require("../controllers/mongo/reviewController");
const userController = require("../controllers/mongo/userController");

const router = express.Router();

router.get("/hotels", hotelController.getHotels);
router.post("/hotels", hotelController.createHotel);
router.get("/hotels/suggestions", hotelController.getHotelSuggestions);
router.get("/hotels/:id", hotelController.getHotelById);
router.get("/hotels/:hotelId/reviews", reviewController.getReviewsByHotel);
router.get("/hotels/:hotelId/average-rating", reviewController.getHotelAverageRatingReport);
router.put("/hotels/:id", hotelController.updateHotel);
router.delete("/hotels/:id", hotelController.deleteHotel);

router.get("/reviews", reviewController.getReviews);
router.post("/reviews", reviewController.createReview);
router.put("/reviews/:id", reviewController.updateReview);
router.delete("/reviews/:id", reviewController.deleteReview);

router.get("/users", userController.getUsers);

module.exports = router;
