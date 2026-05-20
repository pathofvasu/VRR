const { NODE_ENV } = require("../config/constants");

const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error",
    ...(NODE_ENV !== "production" && { stack: error.stack }),
  });
};

module.exports = errorHandler;
