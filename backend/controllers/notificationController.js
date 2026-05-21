const asyncHandler = require("../utils/asyncHandler");
const {
  createAppointmentReminderNotifications,
  listNotificationsForUser,
  markNotificationRead,
  sendDueEmailNotifications,
} = require("../services/notificationService");

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await listNotificationsForUser(req.user);

  res.status(200).json({
    success: true,
    message: "Notifications fetched successfully.",
    data: {
      notifications,
    },
  });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await markNotificationRead({
    user: req.user,
    notificationId: req.params.notificationId,
  });

  res.status(200).json({
    success: true,
    message: "Notification marked as read.",
    data: {
      notification,
    },
  });
});

const runAppointmentReminders = asyncHandler(async (req, res) => {
  const windowMinutes = Number(req.body.windowMinutes || 1440);
  const reminders = await createAppointmentReminderNotifications({
    windowMinutes,
  });
  const emailResults = await sendDueEmailNotifications();

  res.status(200).json({
    success: true,
    message: "Appointment reminders processed successfully.",
    data: {
      remindersCreated: reminders.length,
      emailResults,
    },
  });
});

const dispatchDueEmails = asyncHandler(async (_req, res) => {
  const emailResults = await sendDueEmailNotifications();

  res.status(200).json({
    success: true,
    message: "Due email notifications processed successfully.",
    data: {
      emailResults,
    },
  });
});

module.exports = {
  getNotifications,
  markRead,
  runAppointmentReminders,
  dispatchDueEmails,
};
