const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const apiRoutes = require("./routes");
const { APP_NAME, API_PREFIX, NODE_ENV } = require("./config/constants");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: `${APP_NAME} API is running`,
    environment: NODE_ENV,
    docs: `${API_PREFIX}/health`,
  });
});

app.use(API_PREFIX, apiRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
