const mongoose = require("mongoose");

const Appointment = require("../models/Appointment");
const Booking = require("../models/Booking");
const User = require("../models/User");
const createHttpError = require("../utils/createHttpError");
const { BOOKING_WORKFLOW_STATES } = require("../utils/bookingWorkflow");
const {
  createAppointmentScheduledNotifications,
  createAppointmentStatusNotifications,
} = require("./notificationService");
const {
  createWorkflowHistoryEntry,
  getBookingAccessFilter,
  getBookingPopulateOptions,
} = require("./bookingService");

const ACTIVE_APPOINTMENT_STATUSES = ["scheduled", "rescheduled"];
const APPOINTMENT_TYPES = [
  "consultation",
  "planning-review",
  "vendor-review",
  "venue-visit",
  "final-briefing",
  "other",
];
const APPOINTMENT_MODES = ["video-call", "phone-call", "in-person"];
const APPOINTMENT_STATUSES = ["scheduled", "rescheduled", "cancelled", "completed"];

const appointmentPopulateOptions = [
  {
    path: "booking",
    select: "bookingCode eventTitle eventType eventDate location workflowState",
  },
  {
    path: "client",
    select: "name email role",
  },
  {
    path: "organizer",
    select: "name email role",
  },
  {
    path: "scheduledBy",
    select: "name email role",
  },
];

const parseAppointmentDate = (value, fieldName) => {
  const parsedDate = value ? new Date(value) : null;

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    throw createHttpError(400, `${fieldName} must be a valid date and time.`);
  }

  return parsedDate;
};

const validateAppointmentPayload = (payload) => {
  const startAt = parseAppointmentDate(payload.startAt, "startAt");
  const durationMinutes = Number(payload.durationMinutes || 60);
  const endAt = payload.endAt
    ? parseAppointmentDate(payload.endAt, "endAt")
    : new Date(startAt.getTime() + durationMinutes * 60 * 1000);

  if (!payload.bookingId || !mongoose.Types.ObjectId.isValid(payload.bookingId)) {
    throw createHttpError(400, "A valid bookingId is required.");
  }

  if (!payload.title || String(payload.title).trim().length < 3) {
    throw createHttpError(400, "Appointment title must be at least 3 characters long.");
  }

  if (startAt.getTime() <= Date.now()) {
    throw createHttpError(400, "Appointment start time must be in the future.");
  }

  if (endAt.getTime() <= startAt.getTime()) {
    throw createHttpError(400, "Appointment end time must be after the start time.");
  }

  const duration = (endAt.getTime() - startAt.getTime()) / 60000;

  if (duration < 15 || duration > 480) {
    throw createHttpError(400, "Appointment duration must be between 15 minutes and 8 hours.");
  }

  if (payload.appointmentType && !APPOINTMENT_TYPES.includes(payload.appointmentType)) {
    throw createHttpError(400, "Appointment type is invalid.");
  }

  if (payload.mode && !APPOINTMENT_MODES.includes(payload.mode)) {
    throw createHttpError(400, "Appointment mode is invalid.");
  }

  return {
    bookingId: payload.bookingId,
    organizerId: payload.organizerId || "",
    title: String(payload.title).trim(),
    appointmentType: payload.appointmentType || "consultation",
    startAt,
    endAt,
    mode: payload.mode || "video-call",
    location: payload.location ? String(payload.location).trim() : "",
    meetingLink: payload.meetingLink ? String(payload.meetingLink).trim() : "",
    notes: payload.notes ? String(payload.notes).trim() : "",
  };
};

const buildAppointmentResponse = (appointment) => ({
  id: appointment._id.toString(),
  booking: appointment.booking,
  client:
    appointment.client && appointment.client.toSafeObject
      ? appointment.client.toSafeObject()
      : appointment.client,
  organizer:
    appointment.organizer && appointment.organizer.toSafeObject
      ? appointment.organizer.toSafeObject()
      : appointment.organizer,
  scheduledBy:
    appointment.scheduledBy && appointment.scheduledBy.toSafeObject
      ? appointment.scheduledBy.toSafeObject()
      : appointment.scheduledBy,
  title: appointment.title,
  appointmentType: appointment.appointmentType,
  startAt: appointment.startAt,
  endAt: appointment.endAt,
  mode: appointment.mode,
  location: appointment.location,
  meetingLink: appointment.meetingLink,
  status: appointment.status,
  notes: appointment.notes,
  createdAt: appointment.createdAt,
  updatedAt: appointment.updatedAt,
});

const getAppointmentAccessFilter = (user) => {
  if (user.role === "admin") {
    return {};
  }

  if (user.role === "organizer") {
    return { organizer: user._id };
  }

  return { client: user._id };
};

const resolveAppointmentBooking = async ({ user, bookingId }) => {
  const booking = await Booking.findOne(
    getBookingAccessFilter({
      user,
      bookingId,
    })
  ).populate(getBookingPopulateOptions());

  if (!booking) {
    throw createHttpError(404, "Booking not found or not accessible.");
  }

  return booking;
};

const resolveOrganizerId = async ({ user, booking, requestedOrganizerId }) => {
  if (user.role === "organizer") {
    if (!booking.assignedOrganizer || String(booking.assignedOrganizer._id) !== String(user._id)) {
      throw createHttpError(403, "Organizers can only schedule appointments for assigned bookings.");
    }

    return user._id;
  }

  if (user.role === "client") {
    return booking.assignedOrganizer?._id || null;
  }

  if (!requestedOrganizerId) {
    return booking.assignedOrganizer?._id || null;
  }

  if (!mongoose.Types.ObjectId.isValid(requestedOrganizerId)) {
    throw createHttpError(400, "Organizer ID is invalid.");
  }

  const organizer = await User.findById(requestedOrganizerId);

  if (!organizer || organizer.role !== "organizer") {
    throw createHttpError(404, "Organizer not found.");
  }

  return organizer._id;
};

const ensureOrganizerAvailable = async ({ organizerId, startAt, endAt, appointmentIdToExclude }) => {
  if (!organizerId) {
    return;
  }

  const conflictFilter = {
    organizer: organizerId,
    status: { $in: ACTIVE_APPOINTMENT_STATUSES },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  };

  if (appointmentIdToExclude) {
    conflictFilter._id = { $ne: appointmentIdToExclude };
  }

  const conflictingAppointment = await Appointment.findOne(conflictFilter);

  if (conflictingAppointment) {
    throw createHttpError(409, "Organizer already has an appointment during this time.");
  }
};

const listAppointments = async (user) => {
  const appointments = await Appointment.find(getAppointmentAccessFilter(user))
    .sort({ startAt: 1 })
    .populate(appointmentPopulateOptions);

  return appointments.map((appointment) => buildAppointmentResponse(appointment));
};

const createAppointment = async ({ user, payload }) => {
  const validatedPayload = validateAppointmentPayload(payload);
  const booking = await resolveAppointmentBooking({
    user,
    bookingId: validatedPayload.bookingId,
  });
  const organizerId = await resolveOrganizerId({
    user,
    booking,
    requestedOrganizerId: validatedPayload.organizerId,
  });

  await ensureOrganizerAvailable({
    organizerId,
    startAt: validatedPayload.startAt,
    endAt: validatedPayload.endAt,
  });

  const appointment = await Appointment.create({
    booking: booking._id,
    client: booking.client._id || booking.client,
    organizer: organizerId,
    scheduledBy: user._id,
    title: validatedPayload.title,
    appointmentType: validatedPayload.appointmentType,
    startAt: validatedPayload.startAt,
    endAt: validatedPayload.endAt,
    mode: validatedPayload.mode,
    location: validatedPayload.location,
    meetingLink: validatedPayload.meetingLink,
    notes: validatedPayload.notes,
  });

  if (booking.workflowState === BOOKING_WORKFLOW_STATES.ADMIN_REVIEW) {
    booking.workflowState = BOOKING_WORKFLOW_STATES.CONSULTATION_SCHEDULED;
    booking.workflowStateUpdatedAt = new Date();
    booking.workflowHistory.push(
      createWorkflowHistoryEntry({
        state: BOOKING_WORKFLOW_STATES.CONSULTATION_SCHEDULED,
        changedBy: user._id,
        note: "Consultation appointment scheduled.",
      })
    );
    await booking.save();
  }

  const populatedAppointment = await Appointment.findById(appointment._id).populate(
    appointmentPopulateOptions
  );

  await createAppointmentScheduledNotifications(populatedAppointment);

  return buildAppointmentResponse(populatedAppointment);
};

const updateAppointmentStatus = async ({ user, appointmentId, status }) => {
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    throw createHttpError(400, "Appointment ID is invalid.");
  }

  if (!APPOINTMENT_STATUSES.includes(status)) {
    throw createHttpError(400, "Appointment status is invalid.");
  }

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    ...getAppointmentAccessFilter(user),
  });

  if (!appointment) {
    throw createHttpError(404, "Appointment not found or not accessible.");
  }

  appointment.status = status;
  await appointment.save();

  const populatedAppointment = await Appointment.findById(appointment._id).populate(
    appointmentPopulateOptions
  );

  await createAppointmentStatusNotifications(populatedAppointment);

  return buildAppointmentResponse(populatedAppointment);
};

const getAppointmentCatalog = () => ({
  appointmentTypes: APPOINTMENT_TYPES,
  appointmentModes: APPOINTMENT_MODES,
  appointmentStatuses: APPOINTMENT_STATUSES,
});

module.exports = {
  createAppointment,
  getAppointmentCatalog,
  listAppointments,
  updateAppointmentStatus,
};
