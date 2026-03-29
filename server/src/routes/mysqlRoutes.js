const express = require("express");
const reportController = require("../controllers/mysql/reportController");

const router = express.Router();

router.get("/reports/top3-rooms", reportController.getQuarterlyTop3RoomsReport);
router.get("/reports/refund-ratio", reportController.getQuarterlyRefundRatioReport);
router.get("/reports/adr-revpar", reportController.getQuarterlyAdrRevparReport);

module.exports = router;
