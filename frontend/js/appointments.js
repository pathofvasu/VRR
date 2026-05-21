import {
  fetchAppointmentCatalog,
  fetchAppointments,
  scheduleAppointment,
  updateAppointmentStatus,
} from "./appointment-api.js";
import { fetchAdminBookings, fetchAdminOrganizers } from "./admin-api.js";
import { fetchCurrentUser } from "./auth-api.js";
import { clearAuthSession, getAuthSession, saveAuthSession } from "./auth-storage.js";
import { setStatusBanner } from "./auth-ui.js";
import { fetchUserBookings } from "./booking-api.js";
import { getDashboardUrlForRole } from "./dashboard-routing.js";
import { fetchOrganizerAssignments } from "./organizer-api.js";

const session = getAuthSession();
const state = {
  token: session?.token || "",
  user: session?.user || null,
  appointments: [],
  bookings: [],
  organizers: [],
  catalog: {
    appointmentTypes: [],
    appointmentModes: [],
    appointmentStatuses: [],
  },
};

const nodes = {
  userName: document.querySelector("[data-user-name]"),
  userEmail: document.querySelector("[data-user-email]"),
  userRole: document.querySelector("[data-user-role]"),
  signOutButton: document.querySelector("[data-sign-out]"),
  dashboardLink: document.querySelector("[data-dashboard-link]"),
  refreshButton: document.querySelector("[data-refresh-appointments]"),
  form: document.querySelector("[data-appointment-form]"),
  submitButton: document.querySelector("[data-submit-appointment]"),
  bookingSelect: document.querySelector("[data-booking-select]"),
  organizerSelect: document.querySelector("[data-organizer-select]"),
  organizerField: document.querySelector("[data-organizer-field]"),
  typeSelect: document.querySelector("[data-type-select]"),
  modeSelect: document.querySelector("[data-mode-select]"),
  list: document.querySelector("[data-appointments-list]"),
};

const labelize = (value) =>
  String(value || "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "Not set";

const renderUser = () => {
  nodes.userName.textContent = state.user?.name || "Unknown user";
  nodes.userEmail.textContent = state.user?.email || "No email available";
  nodes.userRole.textContent = state.user?.role ? `${state.user.role} access` : "Checking access";
  nodes.dashboardLink.href = getDashboardUrlForRole(state.user?.role);
};

const renderCatalog = () => {
  nodes.typeSelect.innerHTML = state.catalog.appointmentTypes
    .map((type) => `<option value="${escapeHtml(type)}">${labelize(type)}</option>`)
    .join("");

  nodes.modeSelect.innerHTML = state.catalog.appointmentModes
    .map((mode) => `<option value="${escapeHtml(mode)}">${labelize(mode)}</option>`)
    .join("");
};

const renderBookingOptions = () => {
  if (state.bookings.length === 0) {
    nodes.bookingSelect.innerHTML = '<option value="">No accessible bookings found</option>';
    return;
  }

  nodes.bookingSelect.innerHTML = [
    '<option value="">Select a booking</option>',
    ...state.bookings.map(
      (booking) =>
        `<option value="${escapeHtml(booking.id)}">${escapeHtml(booking.bookingCode)} - ${escapeHtml(booking.eventTitle)}</option>`
    ),
  ].join("");
};

const renderOrganizerOptions = () => {
  if (state.user?.role !== "admin") {
    nodes.organizerField.hidden = true;
    return;
  }

  nodes.organizerSelect.innerHTML = [
    '<option value="">Use assigned organizer / none</option>',
    ...state.organizers.map(
      (organizer) =>
        `<option value="${escapeHtml(organizer.id)}">${escapeHtml(organizer.name)}</option>`
    ),
  ].join("");
};

const renderAppointments = () => {
  if (state.appointments.length === 0) {
    nodes.list.innerHTML = '<p class="appointments-empty">No appointments have been scheduled yet.</p>';
    return;
  }

  nodes.list.innerHTML = state.appointments
    .map(
      (appointment) => `
        <article class="appointment-card" data-appointment-card="${escapeHtml(appointment.id)}">
          <div class="appointment-card-header">
            <div>
              <span class="appointment-pill">${labelize(appointment.status)}</span>
              <h3>${escapeHtml(appointment.title)}</h3>
              <span class="appointment-meta">${labelize(appointment.appointmentType)} | ${labelize(appointment.mode)}</span>
            </div>
            <span class="appointment-meta">${formatDateTime(appointment.startAt)}</span>
          </div>

          <div class="appointment-details">
            <div class="appointment-detail">
              <strong>Booking</strong>
              ${escapeHtml(appointment.booking?.bookingCode || "Booking")}<br>
              ${escapeHtml(appointment.booking?.eventTitle || "Event")}
            </div>
            <div class="appointment-detail">
              <strong>Client</strong>
              ${escapeHtml(appointment.client?.name || "Unknown client")}<br>
              ${escapeHtml(appointment.client?.email || "No email")}
            </div>
            <div class="appointment-detail">
              <strong>Organizer</strong>
              ${escapeHtml(appointment.organizer?.name || "Unassigned")}<br>
              ${escapeHtml(appointment.organizer?.email || "No organizer email")}
            </div>
            <div class="appointment-detail">
              <strong>Location / Link</strong>
              ${escapeHtml(appointment.location || "Location not set")}<br>
              ${appointment.meetingLink ? `<a href="${escapeHtml(appointment.meetingLink)}" target="_blank" rel="noreferrer">Open meeting link</a>` : "No meeting link"}
            </div>
          </div>

          <div class="appointment-status-row">
            <select class="appointment-status-select" data-status-select="${escapeHtml(appointment.id)}" aria-label="Status for ${escapeHtml(appointment.title)}">
              ${state.catalog.appointmentStatuses
                .map((status) => {
                  const isSelected = status === appointment.status ? "selected" : "";
                  return `<option value="${escapeHtml(status)}" ${isSelected}>${labelize(status)}</option>`;
                })
                .join("")}
            </select>
            <button class="secondary-button" type="button" data-update-status="${escapeHtml(appointment.id)}">Update Status</button>
          </div>
        </article>
      `
    )
    .join("");
};

const verifySession = async () => {
  if (!state.token) {
    window.location.href = "./login.html";
    return false;
  }

  try {
    const response = await fetchCurrentUser(state.token);
    state.user = response.data.user;
    saveAuthSession({ token: state.token, user: state.user });
    renderUser();
    return true;
  } catch (error) {
    clearAuthSession();
    setStatusBanner(error.message || "Your session could not be verified.");
    window.setTimeout(() => {
      window.location.href = "./login.html";
    }, 1000);
    return false;
  }
};

const loadRoleBookings = async () => {
  if (state.user.role === "admin") {
    const response = await fetchAdminBookings({
      token: state.token,
      filters: {
        limit: 100,
      },
    });
    state.bookings = response.data.bookings;

    const organizerResponse = await fetchAdminOrganizers(state.token);
    state.organizers = organizerResponse.data.organizers;
    return;
  }

  if (state.user.role === "organizer") {
    const response = await fetchOrganizerAssignments(state.token);
    state.bookings = response.data.bookings;
    return;
  }

  const response = await fetchUserBookings(state.token);
  state.bookings = response.data.bookings;
};

const loadAppointments = async ({ showSuccess = false } = {}) => {
  try {
    nodes.list.innerHTML = '<p class="appointments-empty">Loading appointments...</p>';
    const response = await fetchAppointments(state.token);
    state.appointments = response.data.appointments;
    renderAppointments();

    if (showSuccess) {
      setStatusBanner("Appointments refreshed.", "success");
    }
  } catch (error) {
    setStatusBanner(error.message || "Unable to load appointments.");
  }
};

const loadPageData = async () => {
  const catalogResponse = await fetchAppointmentCatalog(state.token);
  state.catalog = catalogResponse.data;
  renderCatalog();

  await loadRoleBookings();
  renderBookingOptions();
  renderOrganizerOptions();
  await loadAppointments();
};

const handleScheduleSubmit = async (event) => {
  event.preventDefault();
  const formData = new FormData(nodes.form);
  nodes.submitButton.disabled = true;

  try {
    await scheduleAppointment({
      token: state.token,
      payload: {
        bookingId: formData.get("bookingId"),
        organizerId: formData.get("organizerId"),
        title: formData.get("title"),
        appointmentType: formData.get("appointmentType"),
        mode: formData.get("mode"),
        startAt: formData.get("startAt"),
        durationMinutes: formData.get("durationMinutes"),
        location: formData.get("location"),
        meetingLink: formData.get("meetingLink"),
        notes: formData.get("notes"),
      },
    });

    nodes.form.reset();
    setStatusBanner("Appointment scheduled successfully.", "success");
    await loadAppointments();
  } catch (error) {
    setStatusBanner(error.message || "Unable to schedule appointment.");
  } finally {
    nodes.submitButton.disabled = false;
  }
};

const handleStatusUpdate = async (event) => {
  const button = event.target.closest("[data-update-status]");

  if (!button) {
    return;
  }

  const appointmentId = button.dataset.updateStatus;
  const statusSelect = document.querySelector(`[data-status-select="${appointmentId}"]`);
  button.disabled = true;

  try {
    await updateAppointmentStatus({
      token: state.token,
      appointmentId,
      status: statusSelect.value,
    });
    setStatusBanner("Appointment status updated.", "success");
    await loadAppointments();
  } catch (error) {
    setStatusBanner(error.message || "Unable to update appointment status.");
  } finally {
    button.disabled = false;
  }
};

const attachEvents = () => {
  nodes.signOutButton.addEventListener("click", () => {
    clearAuthSession();
    window.location.href = "./login.html";
  });

  nodes.refreshButton.addEventListener("click", () => loadAppointments({ showSuccess: true }));
  nodes.form.addEventListener("submit", handleScheduleSubmit);
  nodes.list.addEventListener("click", handleStatusUpdate);
};

const init = async () => {
  renderUser();
  attachEvents();

  const isVerified = await verifySession();

  if (!isVerified) {
    return;
  }

  try {
    await loadPageData();
  } catch (error) {
    setStatusBanner(error.message || "Unable to initialize appointment scheduling.");
  }
};

init();
