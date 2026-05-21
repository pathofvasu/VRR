import { createBooking, fetchWorkflowStates } from "./booking-api.js";
import { DEFAULT_API_BASE_URL, getApiBaseUrl, setApiBaseUrl } from "./auth-config.js";
import {
  clearPostAuthRedirectUrl,
  getAuthSession,
  setPostAuthRedirectUrl,
} from "./auth-storage.js";
import { clearBookingDraft, getBookingDraft, saveBookingDraft } from "./booking-storage.js";
import { validateBookingForm } from "./booking-validation.js";
import { clearFieldErrors, setFieldError, setStatusBanner, setSubmitState } from "./auth-ui.js";

const form = document.querySelector("[data-booking-form]");
const submitButton = document.querySelector("[data-submit-button]");
const apiBaseUrlInput = document.querySelector("#apiBaseUrl");
const consultationToggle = document.querySelector("#consultationRequested");
const consultationFields = document.querySelector("[data-consultation-fields]");
const workflowList = document.querySelector("[data-workflow-list]");
const sessionIndicator = document.querySelector("[data-session-indicator]");
const sessionMessage = document.querySelector("[data-session-message]");
const sessionLinks = document.querySelector("[data-session-links]");
const successPanel = document.querySelector("[data-booking-success]");
const successCode = document.querySelector("[data-booking-code]");
const successEvent = document.querySelector("[data-booking-event]");
const successState = document.querySelector("[data-booking-state]");
const successDate = document.querySelector("[data-booking-date]");
const successHistory = document.querySelector("[data-booking-history-count]");

const fieldNames = [
  "apiBaseUrl",
  "eventTitle",
  "eventType",
  "eventDate",
  "guestCount",
  "city",
  "contactPhone",
  "servicesRequested",
  "budgetMinimum",
  "budgetMaximum",
  "budgetRange",
  "preferredConsultationMode",
  "preferredConsultationDate",
];

const serviceCheckboxes = Array.from(document.querySelectorAll("[name='servicesRequested']"));

const getSelectedServices = () =>
  serviceCheckboxes.filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value);

const collectFormValues = () => {
  const formData = new FormData(form);

  return {
    apiBaseUrl: String(formData.get("apiBaseUrl") || ""),
    eventTitle: String(formData.get("eventTitle") || ""),
    eventType: String(formData.get("eventType") || ""),
    eventDate: String(formData.get("eventDate") || ""),
    guestCount: String(formData.get("guestCount") || ""),
    city: String(formData.get("city") || ""),
    venueName: String(formData.get("venueName") || ""),
    venueAddress: String(formData.get("venueAddress") || ""),
    contactPhone: String(formData.get("contactPhone") || ""),
    servicesRequested: getSelectedServices(),
    budgetMinimum: String(formData.get("budgetMinimum") || ""),
    budgetMaximum: String(formData.get("budgetMaximum") || ""),
    budgetCurrency: String(formData.get("budgetCurrency") || "INR"),
    budgetNotes: String(formData.get("budgetNotes") || ""),
    consultationRequested: consultationToggle.checked,
    preferredConsultationDate: String(formData.get("preferredConsultationDate") || ""),
    preferredConsultationTimeSlot: String(formData.get("preferredConsultationTimeSlot") || ""),
    preferredConsultationMode: String(formData.get("preferredConsultationMode") || "flexible"),
    notes: String(formData.get("notes") || ""),
  };
};

const populateForm = (values) => {
  if (!values) {
    return;
  }

  const entries = {
    apiBaseUrl: values.apiBaseUrl,
    eventTitle: values.eventTitle,
    eventType: values.eventType,
    eventDate: values.eventDate,
    guestCount: values.guestCount,
    city: values.city,
    venueName: values.venueName,
    venueAddress: values.venueAddress,
    contactPhone: values.contactPhone,
    budgetMinimum: values.budgetMinimum,
    budgetMaximum: values.budgetMaximum,
    budgetCurrency: values.budgetCurrency,
    budgetNotes: values.budgetNotes,
    preferredConsultationDate: values.preferredConsultationDate,
    preferredConsultationTimeSlot: values.preferredConsultationTimeSlot,
    preferredConsultationMode: values.preferredConsultationMode,
    notes: values.notes,
  };

  Object.entries(entries).forEach(([fieldName, fieldValue]) => {
    const input = form.querySelector(`[name='${fieldName}']`);
    if (input && fieldValue !== undefined && fieldValue !== null) {
      input.value = fieldValue;
    }
  });

  consultationToggle.checked = values.consultationRequested !== false;

  serviceCheckboxes.forEach((checkbox) => {
    checkbox.checked = Array.isArray(values.servicesRequested) && values.servicesRequested.includes(checkbox.value);
  });

  updateConsultationState();
};

const updateConsultationState = () => {
  const isRequested = consultationToggle.checked;
  consultationFields.hidden = !isRequested;

  consultationFields.querySelectorAll("input, select").forEach((field) => {
    field.disabled = !isRequested;
  });

  if (!isRequested) {
    setFieldError("preferredConsultationDate", "");
    setFieldError("preferredConsultationMode", "");
  }
};

const hasValidationErrors = (errors) => Object.values(errors).some(Boolean);

const renderValidationErrors = (errors) => {
  clearFieldErrors(fieldNames);
  Object.entries(errors).forEach(([fieldName, message]) => {
    if (message) {
      setFieldError(fieldName, message);
    }
  });
};

const syncDraft = () => {
  saveBookingDraft(collectFormValues());
};

const renderSessionState = () => {
  const session = getAuthSession();

  if (session?.user) {
    sessionIndicator.className = "session-indicator is-authenticated";
    sessionIndicator.textContent = "Authenticated session";
    sessionMessage.textContent = `Signed in as ${session.user.name}. Your booking can be submitted immediately and linked to your client account.`;
    sessionLinks.innerHTML = "";
    return;
  }

  sessionIndicator.className = "session-indicator is-guest";
  sessionIndicator.textContent = "Guest draft mode";
  sessionMessage.textContent =
    "You can complete the full form now. When you submit, we'll save the draft locally, send you to log in, and bring you right back to finish.";
  sessionLinks.innerHTML = `
    <a class="secondary-button dashboard-link" href="./login.html">Log In</a>
    <a class="ghost-button dashboard-link" href="./register.html">Create Account</a>
  `;
};

const renderWorkflowStates = async () => {
  try {
    const response = await fetchWorkflowStates();
    workflowList.innerHTML = response.data.workflowStates
      .map(
        (state) => `
          <div class="workflow-step">
            <div class="workflow-index">${state.order}</div>
            <div>
              <strong>${state.label}</strong>
              <p class="draft-note">${state.key}</p>
            </div>
          </div>
        `
      )
      .join("");
  } catch (_error) {
    workflowList.innerHTML = `
      <div class="workflow-step">
        <div class="workflow-index">!</div>
        <div>
          <strong>Workflow preview unavailable</strong>
          <p class="draft-note">The backend workflow catalog could not be loaded right now.</p>
        </div>
      </div>
    `;
  }
};

const resetFormToDefaults = () => {
  form.reset();
  apiBaseUrlInput.value = getApiBaseUrl();
  consultationToggle.checked = true;
  const budgetCurrencyInput = form.querySelector("[name='budgetCurrency']");
  const consultationModeInput = form.querySelector("[name='preferredConsultationMode']");
  if (budgetCurrencyInput) {
    budgetCurrencyInput.value = "INR";
  }
  if (consultationModeInput) {
    consultationModeInput.value = "flexible";
  }
  updateConsultationState();
};

const renderSuccessState = (booking) => {
  successPanel.hidden = false;
  successCode.textContent = booking.bookingCode;
  successEvent.textContent = booking.eventTitle;
  successState.textContent = booking.workflowStateLabel;
  successDate.textContent = new Date(booking.eventDate).toLocaleDateString();
  successHistory.textContent = String(booking.workflowHistory.length);
  successPanel.scrollIntoView({ behavior: "smooth", block: "start" });
};

const buildBookingPayload = (values) => ({
  eventTitle: values.eventTitle,
  eventType: values.eventType,
  eventDate: values.eventDate,
  guestCount: Number(values.guestCount),
  city: values.city,
  venueName: values.venueName,
  venueAddress: values.venueAddress,
  contactPhone: values.contactPhone,
  servicesRequested: values.servicesRequested,
  budgetMinimum: values.budgetMinimum,
  budgetMaximum: values.budgetMaximum,
  budgetCurrency: values.budgetCurrency,
  budgetNotes: values.budgetNotes,
  consultationRequested: values.consultationRequested,
  preferredConsultationDate: values.preferredConsultationDate,
  preferredConsultationTimeSlot: values.preferredConsultationTimeSlot,
  preferredConsultationMode: values.preferredConsultationMode,
  notes: values.notes,
});

const validateLive = () => {
  const values = collectFormValues();
  const errors = validateBookingForm(values);
  renderValidationErrors(errors);
  return errors;
};

apiBaseUrlInput.value = getApiBaseUrl();
apiBaseUrlInput.addEventListener("change", () => {
  setApiBaseUrl(apiBaseUrlInput.value || DEFAULT_API_BASE_URL);
  syncDraft();
  validateLive();
});

consultationToggle.addEventListener("change", () => {
  updateConsultationState();
  syncDraft();
  validateLive();
});

serviceCheckboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    syncDraft();
    validateLive();
  });
});

form.querySelectorAll("input, select, textarea").forEach((field) => {
  if (field.name === "servicesRequested" || field.name === "apiBaseUrl") {
    return;
  }

  const eventName = field.tagName === "SELECT" ? "change" : "input";
  field.addEventListener(eventName, () => {
    syncDraft();
    validateLive();
  });

  field.addEventListener("blur", () => {
    validateLive();
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  successPanel.hidden = true;
  setStatusBanner("");

  const values = collectFormValues();
  const errors = validateBookingForm(values);
  renderValidationErrors(errors);

  if (hasValidationErrors(errors)) {
    saveBookingDraft(values);
    setStatusBanner("Please correct the highlighted booking fields before continuing.");
    return;
  }

  setApiBaseUrl(values.apiBaseUrl || DEFAULT_API_BASE_URL);
  saveBookingDraft(values);

  const session = getAuthSession();

  if (!session?.token) {
    setPostAuthRedirectUrl("./booking.html");
    setStatusBanner("Your booking draft has been saved. Redirecting you to log in...", "success");
    window.setTimeout(() => {
      window.location.href = "./login.html";
    }, 700);
    return;
  }

  setSubmitState(submitButton, true, "Submit Booking Request", "Submitting Request...");

  try {
    const response = await createBooking({
      token: session.token,
      payload: buildBookingPayload(values),
    });

    clearBookingDraft();
    clearPostAuthRedirectUrl();
    clearFieldErrors(fieldNames);
    resetFormToDefaults();
    renderSuccessState(response.data.booking);
    setStatusBanner("Booking request submitted successfully. Your workflow has started.", "success");
  } catch (error) {
    setStatusBanner(error.message || "Unable to submit the booking request right now.");
  } finally {
    setSubmitState(submitButton, false, "Submit Booking Request", "Submitting Request...");
  }
});

resetFormToDefaults();
renderSessionState();
renderWorkflowStates();

const restoredDraft = getBookingDraft();
if (restoredDraft) {
  populateForm(restoredDraft);
  setStatusBanner("Your saved booking draft has been restored.", "success");
}

const eventDateInput = form.querySelector("[name='eventDate']");
const consultationDateInput = form.querySelector("[name='preferredConsultationDate']");
const todayString = new Date().toISOString().slice(0, 10);
eventDateInput.min = todayString;
consultationDateInput.min = todayString;
