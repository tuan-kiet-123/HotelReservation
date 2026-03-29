const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");

const routes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middlewares/errorHandler");
const { checkMySqlConnection } = require("./config/mysql");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", async (req, res) => {
  let mysqlStatus = "disconnected";

  try {
    await checkMySqlConnection();
    mysqlStatus = "connected";
  } catch (error) {
    mysqlStatus = `error: ${error.message}`;
  }

  const mongoStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  return res.status(200).json({
    success: true,
    message: "Server is running",
    data: {
      mongodb: mongoStatus,
      mysql: mysqlStatus
    }
  });
});

app.use("/api", routes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
