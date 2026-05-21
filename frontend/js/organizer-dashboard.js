import { fetchCurrentUser } from "./auth-api.js";
import { clearAuthSession, getAuthSession, saveAuthSession } from "./auth-storage.js";
import { setStatusBanner } from "./auth-ui.js";
import { getDashboardUrlForRole } from "./dashboard-routing.js";
import {
  fetchOrganizerAssignments,
  fetchOrganizerProgressStates,
  updateOrganizerProgress,
} from "./organizer-api.js";

const session = getAuthSession();
const state = {
  token: session?.token || "",
  user: session?.user || null,
  assignments: [],
  progressStates: [],
};

const nodes = {
  userName: document.querySelector("[data-user-name]"),
  userEmail: document.querySelector("[data-user-email]"),
  userRole: document.querySelector("[data-user-role]"),
  signOutButton: document.querySelector("[data-sign-out]"),
  refreshButton: document.querySelector("[data-refresh-assignments]"),
  assignmentList: document.querySelector("[data-assignment-list]"),
  summaryNodes: document.querySelectorAll("[data-summary]"),
};

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "Not set";

const formatEventType = (value) =>
  value
    ? value
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "Event";

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const renderUser = () => {
  nodes.userName.textContent = state.user?.name || "Unknown organizer";
  nodes.userEmail.textContent = state.user?.email || "No email available";
  nodes.userRole.textContent = state.user?.role ? `${state.user.role} access` : "Checking access";
};

const renderSummary = (summary = {}) => {
  nodes.summaryNodes.forEach((node) => {
    node.textContent = summary[node.dataset.summary] ?? 0;
  });
};

const buildProgressOptions = (currentState) =>
  state.progressStates
    .map((progressState) => {
      const isSelected = progressState.key === currentState ? "selected" : "";
      return `<option value="${escapeHtml(progressState.key)}" ${isSelected}>${escapeHtml(progressState.label)}</option>`;
    })
    .join("");

const getRecentTimeline = (workflowHistory = []) =>
  [...workflowHistory]
    .sort((first, second) => new Date(second.changedAt) - new Date(first.changedAt))
    .slice(0, 3);

const renderAssignments = () => {
  if (state.assignments.length === 0) {
    nodes.assignmentList.innerHTML = `
      <p class="organizer-empty">
        No events are assigned to you yet. New assignments will appear here once an admin assigns bookings.
      </p>
    `;
    return;
  }

  nodes.assignmentList.innerHTML = state.assignments
    .map((booking) => {
      const timelineItems = getRecentTimeline(booking.workflowHistory)
        .map(
          (entry) => `
            <div class="timeline-item">
              <strong>${escapeHtml(entry.state)}</strong>
              <small>${formatDate(entry.changedAt)}${entry.note ? ` | ${escapeHtml(entry.note)}` : ""}</small>
            </div>
          `
        )
        .join("");

      return `
        <article class="assignment-card" data-assignment-card="${escapeHtml(booking.id)}">
          <div class="assignment-card-header">
            <div>
              <span class="assignment-code">${escapeHtml(booking.bookingCode)}</span>
              <h3>${escapeHtml(booking.eventTitle)}</h3>
              <span class="assignment-meta">${formatEventType(booking.eventType)} | ${formatDate(booking.eventDate)}</span>
            </div>
            <span class="progress-pill">${escapeHtml(booking.workflowStateLabel)}</span>
          </div>

          <div class="assignment-details">
            <div class="assignment-detail">
              <strong>Client</strong>
              ${escapeHtml(booking.client?.name || "Unknown client")}<br>
              ${escapeHtml(booking.client?.email || "No email")}
            </div>
            <div class="assignment-detail">
              <strong>Venue</strong>
              ${escapeHtml(booking.location?.venueName || "Venue TBD")}<br>
              ${escapeHtml(booking.location?.city || "City not set")}
            </div>
            <div class="assignment-detail">
              <strong>Guests</strong>
              ${booking.guestCount}
            </div>
            <div class="assignment-detail">
              <strong>Services</strong>
              ${escapeHtml((booking.servicesRequested || []).join(", ") || "Services not listed")}
            </div>
          </div>

          <form class="progress-form" data-progress-form="${escapeHtml(booking.id)}">
            <label>
              <span>Progress state</span>
              <select name="workflowState">
                ${buildProgressOptions(booking.workflowState)}
              </select>
            </label>
            <label>
              <span>Progress note</span>
              <textarea name="note" placeholder="Add a short update for the admin timeline"></textarea>
            </label>
            <button class="primary-button" type="submit">Update Progress</button>
          </form>

          <div class="assignment-timeline">
            <strong>Recent workflow history</strong>
            ${timelineItems || "<span class=\"assignment-meta\">No workflow history yet.</span>"}
          </div>
        </article>
      `;
    })
    .join("");
};

const loadAssignments = async ({ showSuccess = false } = {}) => {
  try {
    nodes.assignmentList.innerHTML = '<p class="organizer-empty">Loading assigned events...</p>';
    const response = await fetchOrganizerAssignments(state.token);
    state.assignments = response.data.bookings;
    renderSummary(response.data.summary);
    renderAssignments();

    if (showSuccess) {
      setStatusBanner("Organizer assignments refreshed.", "success");
    }
  } catch (error) {
    setStatusBanner(error.message || "Unable to load assigned events.");
  }
};

const verifyOrganizerSession = async () => {
  if (!state.token) {
    window.location.href = "./login.html";
    return false;
  }

  try {
    const response = await fetchCurrentUser(state.token);
    state.user = response.data.user;
    saveAuthSession({ token: state.token, user: state.user });
    renderUser();

    if (state.user.role !== "organizer") {
      setStatusBanner("This dashboard requires an organizer account. Redirecting to your workspace.");
      window.setTimeout(() => {
        window.location.href = getDashboardUrlForRole(state.user.role);
      }, 1200);
      return false;
    }

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

const loadProgressStates = async () => {
  const response = await fetchOrganizerProgressStates(state.token);
  state.progressStates = response.data.progressStates;
};

const handleProgressSubmit = async (event) => {
  const form = event.target.closest("[data-progress-form]");

  if (!form) {
    return;
  }

  event.preventDefault();

  const submitButton = form.querySelector("button[type='submit']");
  const formData = new FormData(form);
  submitButton.disabled = true;

  try {
    await updateOrganizerProgress({
      token: state.token,
      bookingId: form.dataset.progressForm,
      workflowState: formData.get("workflowState"),
      note: String(formData.get("note") || "").trim(),
    });
    setStatusBanner("Event progress updated successfully.", "success");
    await loadAssignments();
  } catch (error) {
    setStatusBanner(error.message || "Unable to update event progress.");
  } finally {
    submitButton.disabled = false;
  }
};

const attachEvents = () => {
  nodes.signOutButton.addEventListener("click", () => {
    clearAuthSession();
    window.location.href = "./login.html";
  });

  nodes.refreshButton.addEventListener("click", () => loadAssignments({ showSuccess: true }));
  nodes.assignmentList.addEventListener("submit", handleProgressSubmit);
};

const init = async () => {
  renderUser();
  attachEvents();

  const isOrganizer = await verifyOrganizerSession();

  if (!isOrganizer) {
    return;
  }

  try {
    await loadProgressStates();
    await loadAssignments();
  } catch (error) {
    setStatusBanner(error.message || "Unable to initialize organizer dashboard.");
  }
};

init();
