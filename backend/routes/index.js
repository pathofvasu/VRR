const express = require("express");

const adminRoutes = require("./adminRoutes");
const appointmentRoutes = require("./appointmentRoutes");
const authRoutes = require("./authRoutes");
const bookingRoutes = require("./bookingRoutes");
const notificationRoutes = require("./notificationRoutes");
const organizerRoutes = require("./organizerRoutes");
const { getHealthStatus } = require("../controllers/healthController");

const router = express.Router();

router.get("/health", getHealthStatus);
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/bookings", bookingRoutes);
router.use("/notifications", notificationRoutes);
router.use("/organizer", organizerRoutes);

module.exports = router;
