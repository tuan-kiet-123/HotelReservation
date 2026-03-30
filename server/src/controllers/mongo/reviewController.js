const reviewService = require("../../services/mongo/reviewService");
const { success, fail } = require("../../utils/apiResponse");
const mongoose = require("mongoose");

async function createReview(req, res, next) {
  try {
    const review = await reviewService.createReview(req.body);
    return success(res, review, "Create review successfully", 201);
  } catch (error) {
    if (error.statusCode) {
      return fail(res, error.message, error.statusCode);
    }

    return next(error);
  }
}

async function getReviews(req, res, next) {
  try {
    const reviews = await reviewService.getReviews({
      hotelId: req.query.hotelId,
      userId: req.query.userId
    });
    return success(res, reviews, "Get reviews successfully");
  } catch (error) {
    if (error.statusCode) {
      return fail(res, error.message, error.statusCode);
    }

    return next(error);
  }
}

async function getReviewsByHotel(req, res, next) {
  try {
    const reviews = await reviewService.getReviews({ hotelId: req.params.hotelId });
    return success(res, reviews, "Get hotel reviews successfully");
  } catch (error) {
    if (error.statusCode) {
      return fail(res, error.message, error.statusCode);
    }

    return next(error);
  }
}

async function updateReview(req, res, next) {
  try {
    const review = await reviewService.updateReview(req.params.id, req.body);
    if (!review) {
      return fail(res, "Review not found", 404);
    }

    return success(res, review, "Update review successfully");
  } catch (error) {
    if (error.statusCode) {
      return fail(res, error.message, error.statusCode);
    }

    return next(error);
  }
}

async function deleteReview(req, res, next) {
  try {
    const isDeleted = await reviewService.deleteReview(req.params.id);
    if (!isDeleted) {
      return fail(res, "Review not found", 404);
    }

    return success(res, { id: req.params.id }, "Delete review successfully");
  } catch (error) {
    if (error.statusCode) {
      return fail(res, error.message, error.statusCode);
    }

    return next(error);
  }
}

async function getHotelAverageRatingReport(req, res, next) {
  try {
    const { hotelId } = req.params;

    if (!mongoose.isValidObjectId(hotelId)) {
      return fail(res, "Invalid hotel id", 400);
    }

    const report = await reviewService.getHotelAverageRating(hotelId);
    if (!report) {
      return fail(res, "No reviews found for this hotel", 404);
    }

    return success(res, report, "Get hotel average rating successfully");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createReview,
  getReviews,
  getReviewsByHotel,
  updateReview,
  deleteReview,
  getHotelAverageRatingReport
};
