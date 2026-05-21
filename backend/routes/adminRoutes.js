const express = require("express");

const {
  generateAdminBookingAgreement,
  generateAdminBookingQuotation,
  getAdminAnalyticsOverview,
  getAdminBookingDetails,
  getAdminBookings,
  getAdminCompletedEventAnalytics,
  getAdminMonthlyAnalytics,
  getAdminOrganizers,
  getAdminOrganizerAnalytics,
  getAdminQuotationCatalog,
  updateAdminBookingOrganizer,
  updateAdminBookingWorkflowState,
} = require("../controllers/adminController");
const { authorize, protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/bookings", getAdminBookings);
router.get("/bookings/:bookingId", getAdminBookingDetails);
router.patch("/bookings/:bookingId/assign-organizer", updateAdminBookingOrganizer);
router.post("/bookings/:bookingId/quotation", generateAdminBookingQuotation);
router.post("/bookings/:bookingId/agreement", generateAdminBookingAgreement);
router.patch("/bookings/:bookingId/workflow-state", updateAdminBookingWorkflowState);
router.get("/organizers", getAdminOrganizers);
router.get("/quotations/catalog", getAdminQuotationCatalog);
router.get("/analytics/overview", getAdminAnalyticsOverview);
router.get("/analytics/monthly", getAdminMonthlyAnalytics);
router.get("/analytics/completed-events", getAdminCompletedEventAnalytics);
router.get("/analytics/organizers", getAdminOrganizerAnalytics);

module.exports = router;
