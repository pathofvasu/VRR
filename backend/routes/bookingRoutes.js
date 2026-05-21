const express = require("express");

const {
  acceptQuote,
  confirmAgreement,
  createBooking,
  downloadAgreement,
  getBookingById,
  getWorkflowStates,
  listBookings,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/workflow-states", getWorkflowStates);
router.post("/", protect, createBooking);
router.get("/", protect, listBookings);
router.post("/:bookingId/quote/accept", protect, acceptQuote);
router.get("/:bookingId/agreement/download", protect, downloadAgreement);
router.post("/:bookingId/agreement/confirm", protect, confirmAgreement);
router.get("/:bookingId", protect, getBookingById);

module.exports = router;
