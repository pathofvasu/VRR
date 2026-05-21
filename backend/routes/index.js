const express = require("express");

const authRoutes = require("./authRoutes");
const { getHealthStatus } = require("../controllers/healthController");

const router = express.Router();

router.get("/health", getHealthStatus);
router.use("/auth", authRoutes);

module.exports = router;
