function success(res, data, message = "OK", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

function fail(res, message = "Bad Request", statusCode = 400, details = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    details
  });
}

module.exports = {
  success,
  fail
};
