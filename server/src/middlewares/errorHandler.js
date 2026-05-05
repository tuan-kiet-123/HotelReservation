function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: "Route not found"
  });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;

  console.error("🚨 [Global Error Handler] Unhandled Error:", {
    statusCode: statusCode,
    message: error.message,
    code: error.code,
    errno: error.errno,
    sqlState: error.sqlState,
    sqlMessage: error.sqlMessage,
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    stack: error.stack
  });

  return res.status(statusCode).json({
    success: false,
    message: error.message || "Internal Server Error",
    code: error.code,
    sqlMessage: error.sqlMessage
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
