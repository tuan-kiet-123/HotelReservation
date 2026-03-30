const express = require("express");
const mongoRoutes = require("./mongoRoutes");
const mysqlRoutes = require("./mysqlRoutes");
const searchController = require('../controllers/searchController');

const router = express.Router();

router.use("/mongo", mongoRoutes);
router.use("/mysql", mysqlRoutes);
router.get('/search', searchController.searchRooms);

module.exports = router;
