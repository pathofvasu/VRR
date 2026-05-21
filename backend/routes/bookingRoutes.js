const express = require("express");

const {
  createBooking,
  getBookingById,
  getWorkflowStates,
  listBookings,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/workflow-states", getWorkflowStates);
router.post("/", protect, createBooking);
router.get("/", protect, listBookings);
router.get("/:bookingId", protect, getBookingById);

module.exports = router;
