const express = require("express");

const {
  dispatchDueEmails,
  getNotifications,
  markRead,
  runAppointmentReminders,
} = require("../controllers/notificationController");
const { authorize, protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.patch("/:notificationId/read", markRead);
router.post("/dispatch-emails", authorize("admin"), dispatchDueEmails);
router.post("/reminders/appointments", authorize("admin"), runAppointmentReminders);

module.exports = router;
