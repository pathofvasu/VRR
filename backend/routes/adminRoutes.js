const express = require("express");

const {
  getAdminAnalyticsOverview,
  getAdminBookingDetails,
  getAdminBookings,
  getAdminMonthlyAnalytics,
  getAdminOrganizers,
  updateAdminBookingOrganizer,
  updateAdminBookingWorkflowState,
} = require("../controllers/adminController");
const { authorize, protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/bookings", getAdminBookings);
router.get("/bookings/:bookingId", getAdminBookingDetails);
router.patch("/bookings/:bookingId/assign-organizer", updateAdminBookingOrganizer);
router.patch("/bookings/:bookingId/workflow-state", updateAdminBookingWorkflowState);
router.get("/organizers", getAdminOrganizers);
router.get("/analytics/overview", getAdminAnalyticsOverview);
router.get("/analytics/monthly", getAdminMonthlyAnalytics);

module.exports = router;
