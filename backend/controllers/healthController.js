const { APP_NAME, NODE_ENV } = require("../config/constants");

const getHealthStatus = (_req, res) => {
  res.status(200).json({
    success: true,
    message: `${APP_NAME} backend is healthy`,
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  getHealthStatus,
};
