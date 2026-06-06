const express = require("express");
const mongoRoutes = require("./mongoRoutes");
const mysqlRoutes = require("./mysqlRoutes");
const searchController = require('../controllers/searchController');
const authController = require('../controllers/mysql/authController');

const router = express.Router();

// Auth routes (gọi trực tiếp không qua prefix /mysql)
router.post("/auth/login", authController.login);
router.post("/auth/register", authController.register);
router.post("/auth/verify-otp", authController.verifyOtp);
router.post("/auth/forgot-password", authController.forgotPassword);
router.post("/auth/reset-password", authController.resetPassword);

router.use("/mongo", mongoRoutes);
router.use("/mysql", mysqlRoutes);
router.get('/search', searchController.searchRooms);

module.exports = router;
