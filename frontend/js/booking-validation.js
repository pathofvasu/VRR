const validEventTypes = new Set([
  "wedding",
  "engagement",
  "birthday",
  "corporate",
  "private-party",
  "cultural-event",
  "other",
]);

const validConsultationModes = new Set(["video-call", "phone-call", "in-person", "flexible"]);

const trimValue = (value) => String(value || "").trim();

const validateApiBaseUrlField = (value) => {
  const trimmed = trimValue(value);

  try {
    const parsed = new URL(trimmed);
    if (!/^https?:$/.test(parsed.protocol)) {
      return "Use an http or https URL for the backend API.";
    }
    return "";
  } catch (_error) {
    return "Please enter a valid backend API URL.";
  }
};

const validateEventTitle = (value) => {
  if (trimValue(value).length < 3) {
    return "Event title must be at least 3 characters long.";
  }

  return "";
};

const validateEventType = (value) => {
  if (!validEventTypes.has(value)) {
    return "Please choose an event type.";
  }

  return "";
};

const validateEventDate = (value) => {
  if (!value) {
    return "Please select the event date.";
  }

  const selectedDate = new Date(value);

  if (Number.isNaN(selectedDate.getTime())) {
    return "Please provide a valid event date.";
  }

  if (selectedDate.getTime() <= Date.now()) {
    return "Event date must be in the future.";
  }

  return "";
};

const validateGuestCount = (value) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return "Guest count must be a positive whole number.";
  }

  return "";
};

const validateCity = (value) => {
  if (trimValue(value).length < 2) {
    return "Please enter the event city.";
  }

  return "";
};

const validateContactPhone = (value) => {
  if (trimValue(value).length < 7) {
    return "Please enter a valid contact phone number.";
  }

  return "";
};

const validateServicesRequested = (values) => {
  if (!Array.isArray(values) || values.length === 0) {
    return "Choose at least one requested service.";
  }

  return "";
};

const parseOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? Number.NaN : parsed;
};

const validateBudgetMinimum = (value) => {
  const parsed = parseOptionalNumber(value);

  if (Number.isNaN(parsed)) {
    return "Budget minimum must be a valid number.";
  }

  if (parsed !== undefined && parsed < 0) {
    return "Budget minimum cannot be negative.";
  }

  return "";
};

const validateBudgetMaximum = (value) => {
  const parsed = parseOptionalNumber(value);

  if (Number.isNaN(parsed)) {
    return "Budget maximum must be a valid number.";
  }

  if (parsed !== undefined && parsed < 0) {
    return "Budget maximum cannot be negative.";
  }

  return "";
};

const validateBudgetRange = (minimumValue, maximumValue) => {
  const minimum = parseOptionalNumber(minimumValue);
  const maximum = parseOptionalNumber(maximumValue);

  if (
    minimum !== undefined &&
    maximum !== undefined &&
    !Number.isNaN(minimum) &&
    !Number.isNaN(maximum) &&
    minimum > maximum
  ) {
    return "Budget minimum cannot be greater than budget maximum.";
  }

  return "";
};

const validateConsultationMode = (value) => {
  if (!validConsultationModes.has(value)) {
    return "Please choose a valid consultation mode.";
  }

  return "";
};

const validatePreferredConsultationDate = (requested, value) => {
  if (!requested || !value) {
    return "";
  }

  const selectedDate = new Date(value);

  if (Number.isNaN(selectedDate.getTime())) {
    return "Please provide a valid consultation date.";
  }

  return "";
};

const validateBookingForm = (values) => {
  const servicesRequested = Array.isArray(values.servicesRequested) ? values.servicesRequested : [];
  const consultationRequested = Boolean(values.consultationRequested);

  const errors = {
    apiBaseUrl: validateApiBaseUrlField(values.apiBaseUrl),
    eventTitle: validateEventTitle(values.eventTitle),
    eventType: validateEventType(values.eventType),
    eventDate: validateEventDate(values.eventDate),
    guestCount: validateGuestCount(values.guestCount),
    city: validateCity(values.city),
    contactPhone: validateContactPhone(values.contactPhone),
    servicesRequested: validateServicesRequested(servicesRequested),
    budgetMinimum: validateBudgetMinimum(values.budgetMinimum),
    budgetMaximum: validateBudgetMaximum(values.budgetMaximum),
    budgetRange: validateBudgetRange(values.budgetMinimum, values.budgetMaximum),
    preferredConsultationMode: validateConsultationMode(values.preferredConsultationMode),
    preferredConsultationDate: validatePreferredConsultationDate(
      consultationRequested,
      values.preferredConsultationDate
    ),
  };

  return errors;
};

export {
  validateBookingForm,
};
