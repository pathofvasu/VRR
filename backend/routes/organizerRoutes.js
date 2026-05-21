const express = require("express");

const {
  getOrganizerAssignments,
  getOrganizerProgressStates,
  updateOrganizerBookingProgress,
} = require("../controllers/organizerController");
const { authorize, protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect, authorize("organizer"));

router.get("/assignments", getOrganizerAssignments);
router.get("/progress-states", getOrganizerProgressStates);
router.patch("/assignments/:bookingId/progress", updateOrganizerBookingProgress);

module.exports = router;
