const reviewService = require("../../services/mongo/reviewService");
const { success, fail } = require("../../utils/apiResponse");

async function createReview(req, res, next) {
  try {
    const review = await reviewService.createReview(req.body);
    return success(res, review, "Create review successfully", 201);
  } catch (error) {
    return next(error);
  }
}

async function getReviews(req, res, next) {
  try {
    const reviews = await reviewService.getReviews();
    return success(res, reviews, "Get reviews successfully");
  } catch (error) {
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
    return next(error);
  }
}

module.exports = {
  createReview,
  getReviews,
  updateReview,
  deleteReview
};
