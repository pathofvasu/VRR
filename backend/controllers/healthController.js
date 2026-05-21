const env = require("../config/env");
const { getDatabaseState } = require("../config/database");

const getHealthStatus = (_req, res) => {
  res.status(200).json({
    success: true,
    message: `${env.appName} backend is healthy`,
    environment: env.nodeEnv,
    database: getDatabaseState(),
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  getHealthStatus,
};
