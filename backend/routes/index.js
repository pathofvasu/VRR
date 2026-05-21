const express = require("express");

const adminRoutes = require("./adminRoutes");
const authRoutes = require("./authRoutes");
const bookingRoutes = require("./bookingRoutes");
const { getHealthStatus } = require("../controllers/healthController");

const router = express.Router();

router.get("/health", getHealthStatus);
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/bookings", bookingRoutes);

module.exports = router;
