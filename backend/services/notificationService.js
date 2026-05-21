const Appointment = require("../models/Appointment");
const Notification = require("../models/Notification");
const User = require("../models/User");
const createHttpError = require("../utils/createHttpError");
const { sendEmail } = require("./emailService");

const notificationPopulateOptions = [
  {
    path: "booking",
    select: "bookingCode eventTitle workflowState",
  },
  {
    path: "appointment",
    select: "title startAt endAt mode status",
  },
];

const buildNotificationResponse = (notification) => ({
  id: notification._id.toString(),
  recipient: notification.recipient,
  booking: notification.booking,
  appointment: notification.appointment,
  type: notification.type,
  channel: notification.channel,
  title: notification.title,
  message: notification.message,
  status: notification.status,
  scheduledFor: notification.scheduledFor,
  sentAt: notification.sentAt,
  readAt: notification.readAt,
  failureReason: notification.failureReason,
  metadata: notification.metadata,
  createdAt: notification.createdAt,
  updatedAt: notification.updatedAt,
});

const getRecipientsForAppointment = (appointment) => {
  const recipients = [appointment.client, appointment.organizer, appointment.scheduledBy]
    .filter(Boolean)
    .map((user) => (user._id ? user._id : user));

  return [...new Set(recipients.map((recipient) => String(recipient)))];
};

const createNotification = async ({
  recipient,
  booking,
  appointment,
  type,
  channel = "in_app",
  title,
  message,
  scheduledFor = new Date(),
  metadata = {},
}) =>
  Notification.create({
    recipient,
    booking,
    appointment,
    type,
    channel,
    title,
    message,
    scheduledFor,
    metadata,
  });

const createInAppAndEmailNotifications = async ({
  recipients,
  booking,
  appointment,
  type,
  title,
  message,
  scheduledFor,
  metadata,
}) => {
  const notificationPayloads = recipients.flatMap((recipient) => [
    {
      recipient,
      booking,
      appointment,
      type,
      channel: "in_app",
      title,
      message,
      scheduledFor,
      metadata,
    },
    {
      recipient,
      booking,
      appointment,
      type,
      channel: "email",
      title,
      message,
      scheduledFor,
      metadata,
    },
  ]);

  return Notification.insertMany(notificationPayloads);
};

const createAppointmentScheduledNotifications = async (appointment) => {
  const recipients = getRecipientsForAppointment(appointment);

  if (recipients.length === 0) {
    return [];
  }

  return createInAppAndEmailNotifications({
    recipients,
    booking: appointment.booking?._id || appointment.booking,
    appointment: appointment._id,
    type: "appointment_scheduled",
    title: `Appointment scheduled: ${appointment.title}`,
    message: `Your ${appointment.appointmentType} appointment is scheduled for ${new Date(
      appointment.startAt
    ).toLocaleString()}.`,
    scheduledFor: new Date(),
    metadata: {
      appointmentStartAt: appointment.startAt,
    },
  });
};

const createAppointmentStatusNotifications = async (appointment) => {
  const recipients = getRecipientsForAppointment(appointment);

  if (recipients.length === 0) {
    return [];
  }

  return createInAppAndEmailNotifications({
    recipients,
    booking: appointment.booking?._id || appointment.booking,
    appointment: appointment._id,
    type: "appointment_status_updated",
    title: `Appointment ${appointment.status}: ${appointment.title}`,
    message: `The appointment "${appointment.title}" is now marked ${appointment.status}.`,
    scheduledFor: new Date(),
    metadata: {
      appointmentStatus: appointment.status,
    },
  });
};

const createAppointmentReminderNotifications = async ({ windowMinutes = 1440 } = {}) => {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowMinutes * 60 * 1000);
  const appointments = await Appointment.find({
    status: { $in: ["scheduled", "rescheduled"] },
    startAt: {
      $gte: now,
      $lte: windowEnd,
    },
  });

  const createdNotifications = [];

  for (const appointment of appointments) {
    const recipients = getRecipientsForAppointment(appointment);

    for (const recipient of recipients) {
      const existingReminder = await Notification.findOne({
        recipient,
        appointment: appointment._id,
        type: "appointment_reminder",
      });

      if (existingReminder) {
        continue;
      }

      const notifications = await createInAppAndEmailNotifications({
        recipients: [recipient],
        booking: appointment.booking,
        appointment: appointment._id,
        type: "appointment_reminder",
        title: `Reminder: ${appointment.title}`,
        message: `Reminder: "${appointment.title}" starts at ${new Date(
          appointment.startAt
        ).toLocaleString()}.`,
        scheduledFor: new Date(),
        metadata: {
          reminderWindowMinutes: windowMinutes,
        },
      });

      createdNotifications.push(...notifications);
    }
  }

  return createdNotifications;
};

const sendDueEmailNotifications = async () => {
  const notifications = await Notification.find({
    channel: "email",
    status: "pending",
    scheduledFor: { $lte: new Date() },
  })
    .limit(50)
    .populate("recipient", "name email role");

  const results = {
    sent: 0,
    failed: 0,
    skipped: 0,
  };

  for (const notification of notifications) {
    try {
      const deliveryResult = await sendEmail({
        to: notification.recipient.email,
        subject: notification.title,
        text: notification.message,
      });

      if (deliveryResult.skipped) {
        notification.status = "failed";
        notification.failureReason = deliveryResult.reason;
        results.skipped += 1;
      } else {
        notification.status = "sent";
        notification.sentAt = new Date();
        results.sent += 1;
      }
    } catch (error) {
      notification.status = "failed";
      notification.failureReason = error.message;
      results.failed += 1;
    }

    await notification.save();
  }

  return results;
};

const listNotificationsForUser = async (user) => {
  const notifications = await Notification.find({
    recipient: user._id,
    channel: "in_app",
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate(notificationPopulateOptions);

  return notifications.map((notification) => buildNotificationResponse(notification));
};

const markNotificationRead = async ({ user, notificationId }) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    recipient: user._id,
    channel: "in_app",
  });

  if (!notification) {
    throw createHttpError(404, "Notification not found.");
  }

  notification.status = "read";
  notification.readAt = new Date();
  await notification.save();

  const populatedNotification = await Notification.findById(notification._id).populate(
    notificationPopulateOptions
  );

  return buildNotificationResponse(populatedNotification);
};

module.exports = {
  createAppointmentScheduledNotifications,
  createAppointmentStatusNotifications,
  createAppointmentReminderNotifications,
  listNotificationsForUser,
  markNotificationRead,
  sendDueEmailNotifications,
};
