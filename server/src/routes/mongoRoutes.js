const express = require("express");
const hotelController = require("../controllers/mongo/hotelController");
const reviewController = require("../controllers/mongo/reviewController");
const userController = require("../controllers/mongo/userController");
const { protect, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/hotels", hotelController.getHotels);
router.post("/hotels", protect, authorize("Admin"), hotelController.createHotel);
router.get("/hotels/suggestions", hotelController.getHotelSuggestions);
router.get("/hotels/:id", hotelController.getHotelById);
router.get("/hotels/:hotelId/reviews", reviewController.getReviewsByHotel);
router.get("/hotels/:hotelId/average-rating", reviewController.getHotelAverageRatingReport);
router.put("/hotels/:id", protect, authorize("Admin"), hotelController.updateHotel);
router.delete("/hotels/:id", protect, authorize("Admin"), hotelController.deleteHotel);

router.get("/reviews", protect, authorize("Admin"), reviewController.getReviews);
router.post("/reviews", protect, reviewController.createReview);
router.put("/reviews/:id", protect, reviewController.updateReview);
router.delete("/reviews/:id", protect, reviewController.deleteReview);

router.get("/users", protect, authorize("Admin"), userController.getUsers);

module.exports = router;
