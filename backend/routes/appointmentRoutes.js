const express = require("express");

const {
  getAppointmentSchedulingCatalog,
  getAppointments,
  patchAppointmentStatus,
  scheduleAppointment,
} = require("../controllers/appointmentController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/", getAppointments);
router.post("/", scheduleAppointment);
router.get("/catalog", getAppointmentSchedulingCatalog);
router.patch("/:appointmentId/status", patchAppointmentStatus);

module.exports = router;
