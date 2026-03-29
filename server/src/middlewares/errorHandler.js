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
  return res.status(statusCode).json({
    success: false,
    message: error.message || "Internal Server Error"
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
