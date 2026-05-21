const crypto = require("crypto");

const createHttpError = require("../utils/createHttpError");
const {
  BOOKING_WORKFLOW_LABELS,
  BOOKING_WORKFLOW_SEQUENCE,
  BOOKING_WORKFLOW_STATES,
} = require("../utils/bookingWorkflow");

const generateBookingCode = () => `VRR-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

const normalizeRequestedServices = (servicesRequested) => {
  if (Array.isArray(servicesRequested)) {
    return servicesRequested.map((service) => String(service).trim()).filter(Boolean);
  }

  if (typeof servicesRequested === "string") {
    return servicesRequested
      .split(",")
      .map((service) => service.trim())
      .filter(Boolean);
  }

  return [];
};

const parseOptionalNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? Number.NaN : parsed;
};

const validateBookingPayload = (payload) => {
  const errors = [];
  const eventDate = payload.eventDate ? new Date(payload.eventDate) : null;
  const guestCount = Number(payload.guestCount);
  const budgetMinimum = parseOptionalNumber(payload.budgetMinimum);
  const budgetMaximum = parseOptionalNumber(payload.budgetMaximum);
  const servicesRequested = normalizeRequestedServices(payload.servicesRequested);

  if (!payload.eventTitle || payload.eventTitle.trim().length < 3) {
    errors.push("Event title must be at least 3 characters long.");
  }

  if (!payload.eventType) {
    errors.push("Event type is required.");
  }

  if (!eventDate || Number.isNaN(eventDate.getTime())) {
    errors.push("A valid event date is required.");
  } else if (eventDate.getTime() <= Date.now()) {
    errors.push("Event date must be in the future.");
  }

  if (!Number.isInteger(guestCount) || guestCount < 1) {
    errors.push("Guest count must be a positive whole number.");
  }

  if (!payload.city || payload.city.trim().length < 2) {
    errors.push("City is required.");
  }

  if (!payload.contactPhone || payload.contactPhone.trim().length < 7) {
    errors.push("A valid contact phone number is required.");
  }

  if (servicesRequested.length === 0) {
    errors.push("At least one requested service is required.");
  }

  if (Number.isNaN(budgetMinimum)) {
    errors.push("Budget minimum must be a valid number when provided.");
  }

  if (Number.isNaN(budgetMaximum)) {
    errors.push("Budget maximum must be a valid number when provided.");
  }

  if (
    budgetMinimum !== undefined &&
    budgetMaximum !== undefined &&
    !Number.isNaN(budgetMinimum) &&
    !Number.isNaN(budgetMaximum) &&
    budgetMinimum > budgetMaximum
  ) {
    errors.push("Budget minimum cannot be greater than budget maximum.");
  }

  if (errors.length > 0) {
    throw createHttpError(400, errors.join(" "));
  }

  return {
    eventTitle: payload.eventTitle.trim(),
    eventType: payload.eventType,
    eventDate,
    guestCount,
    city: payload.city.trim(),
    venueName: payload.venueName ? payload.venueName.trim() : "",
    venueAddress: payload.venueAddress ? payload.venueAddress.trim() : "",
    contactPhone: payload.contactPhone.trim(),
    servicesRequested,
    budgetMinimum,
    budgetMaximum,
    budgetCurrency: payload.budgetCurrency ? String(payload.budgetCurrency).trim().toUpperCase() : "INR",
    budgetNotes: payload.budgetNotes ? payload.budgetNotes.trim() : "",
    notes: payload.notes ? payload.notes.trim() : "",
    consultationRequested:
      payload.consultationRequested === undefined ? true : String(payload.consultationRequested) !== "false",
    preferredConsultationDate: payload.preferredConsultationDate ? new Date(payload.preferredConsultationDate) : null,
    preferredConsultationTimeSlot: payload.preferredConsultationTimeSlot
      ? payload.preferredConsultationTimeSlot.trim()
      : "",
    preferredConsultationMode: payload.preferredConsultationMode || "flexible",
  };
};

const createWorkflowHistoryEntry = ({ state, changedBy, note }) => ({
  state,
  changedBy,
  note: note || "",
  changedAt: new Date(),
});

const buildBookingCreationPayload = ({ bookingCode, clientId, validatedBookingInput }) => ({
  bookingCode,
  client: clientId,
  eventTitle: validatedBookingInput.eventTitle,
  eventType: validatedBookingInput.eventType,
  eventDate: validatedBookingInput.eventDate,
  guestCount: validatedBookingInput.guestCount,
  location: {
    city: validatedBookingInput.city,
    venueName: validatedBookingInput.venueName,
    venueAddress: validatedBookingInput.venueAddress,
  },
  budget: {
    currency: validatedBookingInput.budgetCurrency,
    minimum: validatedBookingInput.budgetMinimum,
    maximum: validatedBookingInput.budgetMaximum,
    notes: validatedBookingInput.budgetNotes,
  },
  servicesRequested: validatedBookingInput.servicesRequested,
  contactPhone: validatedBookingInput.contactPhone,
  consultationPreference: {
    requested: validatedBookingInput.consultationRequested,
    preferredDate: validatedBookingInput.preferredConsultationDate,
    preferredTimeSlot: validatedBookingInput.preferredConsultationTimeSlot,
    preferredMode: validatedBookingInput.preferredConsultationMode,
  },
  notes: validatedBookingInput.notes,
  workflowState: BOOKING_WORKFLOW_STATES.REQUEST_SUBMITTED,
  workflowHistory: [
    createWorkflowHistoryEntry({
      state: BOOKING_WORKFLOW_STATES.REQUEST_SUBMITTED,
      changedBy: clientId,
      note: "Booking request submitted by client.",
    }),
  ],
  workflowStateUpdatedAt: new Date(),
});

const getBookingAccessFilter = ({ user, bookingId }) => {
  if (user.role === "admin") {
    return { _id: bookingId };
  }

  if (user.role === "organizer") {
    return {
      _id: bookingId,
      $or: [{ assignedOrganizer: user._id }, { client: user._id }],
    };
  }

  return {
    _id: bookingId,
    client: user._id,
  };
};

const getBookingListFilter = (user) => {
  if (user.role === "admin") {
    return {};
  }

  if (user.role === "organizer") {
    return {
      $or: [{ assignedOrganizer: user._id }, { client: user._id }],
    };
  }

  return {
    client: user._id,
  };
};

const buildWorkflowStateCatalog = () =>
  BOOKING_WORKFLOW_SEQUENCE.map((state, index) => ({
    key: state,
    label: BOOKING_WORKFLOW_LABELS[state],
    order: index + 1,
  }));

const buildBookingResponse = (booking) => ({
  id: booking._id.toString(),
  bookingCode: booking.bookingCode,
  client: booking.client && booking.client.toSafeObject ? booking.client.toSafeObject() : booking.client,
  assignedOrganizer:
    booking.assignedOrganizer && booking.assignedOrganizer.toSafeObject
      ? booking.assignedOrganizer.toSafeObject()
      : booking.assignedOrganizer,
  eventTitle: booking.eventTitle,
  eventType: booking.eventType,
  eventDate: booking.eventDate,
  guestCount: booking.guestCount,
  location: booking.location,
  budget: booking.budget,
  servicesRequested: booking.servicesRequested,
  contactPhone: booking.contactPhone,
  consultationPreference: booking.consultationPreference,
  notes: booking.notes,
  workflowState: booking.workflowState,
  workflowStateLabel: BOOKING_WORKFLOW_LABELS[booking.workflowState],
  workflowHistory: booking.workflowHistory,
  workflowStateUpdatedAt: booking.workflowStateUpdatedAt,
  createdAt: booking.createdAt,
  updatedAt: booking.updatedAt,
});

module.exports = {
  generateBookingCode,
  validateBookingPayload,
  buildBookingCreationPayload,
  getBookingAccessFilter,
  getBookingListFilter,
  buildWorkflowStateCatalog,
  buildBookingResponse,
};
