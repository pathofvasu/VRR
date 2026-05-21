const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const requiredVariables = ["MONGODB_URI", "JWT_SECRET"];
const missingVariables = requiredVariables.filter((variableName) => !process.env[variableName]);

if (missingVariables.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVariables.join(", ")}. Copy backend/.env.example to backend/.env and update the values.`
  );
}


const parseCorsOrigins = (value) => {
  if (!value) {
    return ["http://localhost:5500", "http://127.0.0.1:5500"];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const parseBoolean = (value) => String(value || "").toLowerCase() === "true";

module.exports = {
  appName: "VRR Events",
  apiPrefix: "/api/v1",
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: parseBoolean(process.env.SMTP_SECURE),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "VRR Events <no-reply@vrr-events.local>",
  },
};
