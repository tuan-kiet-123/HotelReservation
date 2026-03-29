const express = require("express");
const mongoRoutes = require("./mongoRoutes");
const mysqlRoutes = require("./mysqlRoutes");

const router = express.Router();

router.use("/mongo", mongoRoutes);
router.use("/mysql", mysqlRoutes);

module.exports = router;
