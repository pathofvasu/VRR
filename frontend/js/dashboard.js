import {
  assignBookingOrganizer,
  fetchAdminAnalyticsOverview,
  fetchAdminBookings,
  fetchAdminMonthlyAnalytics,
  fetchAdminOrganizers,
  updateBookingWorkflowState,
} from "./admin-api.js";
import { fetchCurrentUser } from "./auth-api.js";
import { clearAuthSession, getAuthSession, saveAuthSession } from "./auth-storage.js";
import { setStatusBanner } from "./auth-ui.js";
import { fetchWorkflowStates } from "./booking-api.js";
import { getDashboardUrlForRole } from "./dashboard-routing.js";

const session = getAuthSession();
const state = {
  token: session?.token || "",
  user: session?.user || null,
  workflowStates: [],
  organizers: [],
  bookings: [],
  pagination: {
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 1,
  },
  filters: {
    page: 1,
    limit: 8,
  },
};

const nodes = {
  signOutButton: document.querySelector("[data-sign-out]"),
  refreshButton: document.querySelector("[data-refresh-dashboard]"),
  filterForm: document.querySelector("[data-admin-filters]"),
  clearFiltersButton: document.querySelector("[data-clear-filters]"),
  workflowFilter: document.querySelector("[data-workflow-filter]"),
  organizerFilter: document.querySelector("[data-organizer-filter]"),
  bookingTableBody: document.querySelector("[data-booking-table-body]"),
  bookingCount: document.querySelector("[data-booking-count]"),
  pagePrevious: document.querySelector("[data-page-previous]"),
  pageNext: document.querySelector("[data-page-next]"),
  pageSummary: document.querySelector("[data-page-summary]"),
  monthlyChart: document.querySelector("[data-monthly-chart]"),
  workflowBreakdown: document.querySelector("[data-workflow-breakdown]"),
  recentBookings: document.querySelector("[data-recent-bookings]"),
  userName: document.querySelector("[data-user-name]"),
  userEmail: document.querySelector("[data-user-email]"),
  userRole: document.querySelector("[data-user-role]"),
  metrics: document.querySelectorAll("[data-metric]"),
};

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "Not set";

const formatMonth = ({ year, month }) =>
  new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "2-digit",
  }).format(new Date(Date.UTC(year, month - 1, 1)));

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

const getWorkflowLabel = (key) =>
  state.workflowStates.find((workflowState) => workflowState.key === key)?.label || key;

const renderUser = () => {
  nodes.userName.textContent = state.user?.name || "Unknown admin";
  nodes.userEmail.textContent = state.user?.email || "No email available";
  nodes.userRole.textContent = state.user?.role ? `${state.user.role} access` : "Checking access";
};

const renderSelectOptions = () => {
  const workflowOptions = state.workflowStates
    .map(
      (workflowState) =>
        `<option value="${escapeHtml(workflowState.key)}">${escapeHtml(workflowState.label)}</option>`
    )
    .join("");

  nodes.workflowFilter.insertAdjacentHTML("beforeend", workflowOptions);

  const organizerOptions = state.organizers
    .map(
      (organizer) =>
        `<option value="${escapeHtml(organizer.id)}">${escapeHtml(organizer.name)} (${organizer.assignedBookings})</option>`
    )
    .join("");

  nodes.organizerFilter.insertAdjacentHTML("beforeend", organizerOptions);
};

const renderMetrics = (overview) => {
  nodes.metrics.forEach((node) => {
    const metricName = node.dataset.metric;
    node.textContent = overview[metricName] ?? 0;
  });
};

const renderWorkflowBreakdown = (workflowBreakdown = []) => {
  if (workflowBreakdown.length === 0) {
    nodes.workflowBreakdown.innerHTML = '<p class="is-empty-state">No workflow data is available yet.</p>';
    return;
  }

  nodes.workflowBreakdown.innerHTML = workflowBreakdown
    .map(
      (workflowState) => `
        <div class="workflow-row">
          <div>
            <strong>${escapeHtml(workflowState.label)}</strong>
            <small>${escapeHtml(workflowState.key)}</small>
          </div>
          <span class="workflow-pill">${workflowState.count}</span>
        </div>
      `
    )
    .join("");
};

const renderRecentBookings = (recentBookings = []) => {
  if (recentBookings.length === 0) {
    nodes.recentBookings.innerHTML = '<p class="is-empty-state">No recent booking requests yet.</p>';
    return;
  }

  nodes.recentBookings.innerHTML = recentBookings
    .map(
      (booking) => `
        <div class="recent-item">
          <strong>${escapeHtml(booking.eventTitle)}</strong>
          <small>${escapeHtml(booking.bookingCode)} | ${escapeHtml(booking.workflowStateLabel)} | ${formatDate(booking.createdAt)}</small>
        </div>
      `
    )
    .join("");
};

const renderMonthlyChart = (monthly = []) => {
  if (monthly.length === 0) {
    nodes.monthlyChart.innerHTML = '<p class="is-empty-state">Monthly booking analytics will appear after bookings are created.</p>';
    return;
  }

  const maxBookings = Math.max(...monthly.map((entry) => entry.bookingsCreated), 1);

  nodes.monthlyChart.innerHTML = monthly
    .map((entry) => {
      const width = Math.max((entry.bookingsCreated / maxBookings) * 100, 8);

      return `
        <div class="monthly-row">
          <strong>${formatMonth(entry)}</strong>
          <span class="monthly-bar-track">
            <span class="monthly-bar" style="display:block;width:${width}%"></span>
          </span>
          <span>${entry.bookingsCreated}</span>
        </div>
      `;
    })
    .join("");
};

const buildOrganizerOptions = (selectedOrganizerId) => {
  const baseOptions = ['<option value="">Unassigned</option>'];
  const organizerOptions = state.organizers.map((organizer) => {
    const isSelected = organizer.id === selectedOrganizerId ? "selected" : "";
    return `<option value="${escapeHtml(organizer.id)}" ${isSelected}>${escapeHtml(organizer.name)}</option>`;
  });

  return [...baseOptions, ...organizerOptions].join("");
};

const buildWorkflowOptions = (currentWorkflowState) =>
  state.workflowStates
    .map((workflowState) => {
      const isSelected = workflowState.key === currentWorkflowState ? "selected" : "";
      return `<option value="${escapeHtml(workflowState.key)}" ${isSelected}>${escapeHtml(workflowState.label)}</option>`;
    })
    .join("");

const renderBookings = () => {
  if (state.bookings.length === 0) {
    nodes.bookingTableBody.innerHTML = `
      <tr>
        <td colspan="6">
          <p class="is-empty-state">No bookings match the current filters.</p>
        </td>
      </tr>
    `;
  } else {
    nodes.bookingTableBody.innerHTML = state.bookings
      .map((booking) => {
        const organizerId = booking.assignedOrganizer?.id || "";

        return `
          <tr data-booking-row="${escapeHtml(booking.id)}">
            <td>
              <span class="booking-code">${escapeHtml(booking.bookingCode)}</span>
              <span class="booking-meta">Submitted ${formatDate(booking.createdAt)}</span>
            </td>
            <td>
              <span class="booking-title">${escapeHtml(booking.client?.name || "Unknown client")}</span>
              <span class="booking-subtext">${escapeHtml(booking.client?.email || "No email")}</span>
              <span class="booking-subtext">${escapeHtml(booking.contactPhone)}</span>
            </td>
            <td>
              <span class="booking-title">${escapeHtml(booking.eventTitle)}</span>
              <span class="booking-subtext">${formatEventType(booking.eventType)} | ${formatDate(booking.eventDate)}</span>
              <span class="booking-subtext">${escapeHtml(booking.location?.city || "City not set")} | ${booking.guestCount} guests</span>
            </td>
            <td>
              <span class="workflow-pill">${escapeHtml(booking.workflowStateLabel || getWorkflowLabel(booking.workflowState))}</span>
              <span class="booking-subtext">Updated ${formatDate(booking.workflowStateUpdatedAt)}</span>
            </td>
            <td>
              <span class="booking-title">${escapeHtml(booking.assignedOrganizer?.name || "Unassigned")}</span>
              <span class="booking-subtext">${escapeHtml(booking.assignedOrganizer?.email || "Needs assignment")}</span>
            </td>
            <td>
              <div class="booking-actions">
                <select class="booking-action-select" data-organizer-select="${escapeHtml(booking.id)}" aria-label="Organizer for ${escapeHtml(booking.bookingCode)}">
                  ${buildOrganizerOptions(organizerId)}
                </select>
                <select class="booking-action-select" data-workflow-select="${escapeHtml(booking.id)}" aria-label="Workflow state for ${escapeHtml(booking.bookingCode)}">
                  ${buildWorkflowOptions(booking.workflowState)}
                </select>
                <textarea class="booking-action-note" data-note-input="${escapeHtml(booking.id)}" placeholder="Optional admin note"></textarea>
                <div class="booking-action-buttons">
                  <button class="secondary-button" type="button" data-assign-organizer="${escapeHtml(booking.id)}">Assign</button>
                  <button class="secondary-button" type="button" data-update-workflow="${escapeHtml(booking.id)}">Update</button>
                </div>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  const { page, total, totalPages } = state.pagination;
  nodes.bookingCount.textContent = `${total} booking${total === 1 ? "" : "s"}`;
  nodes.pageSummary.textContent = `Page ${page} of ${totalPages}`;
  nodes.pagePrevious.disabled = page <= 1;
  nodes.pageNext.disabled = page >= totalPages;
};

const loadAnalytics = async () => {
  const [overviewResponse, monthlyResponse] = await Promise.all([
    fetchAdminAnalyticsOverview(state.token),
    fetchAdminMonthlyAnalytics(state.token),
  ]);

  renderMetrics(overviewResponse.data);
  renderWorkflowBreakdown(overviewResponse.data.workflowBreakdown);
  renderRecentBookings(overviewResponse.data.recentBookings);
  renderMonthlyChart(monthlyResponse.data.monthly);
};

const loadBookings = async () => {
  nodes.bookingTableBody.innerHTML = `
    <tr>
      <td colspan="6">Loading bookings...</td>
    </tr>
  `;

  const response = await fetchAdminBookings({
    token: state.token,
    filters: state.filters,
  });

  state.bookings = response.data.bookings;
  state.pagination = response.data.pagination;
  renderBookings();
};

const refreshDashboard = async ({ showSuccess = false } = {}) => {
  try {
    await Promise.all([loadAnalytics(), loadBookings()]);

    if (showSuccess) {
      setStatusBanner("Admin dashboard refreshed successfully.", "success");
    }
  } catch (error) {
    setStatusBanner(error.message || "Unable to load admin dashboard data.");
  }
};

const verifyAdminSession = async () => {
  if (!state.token) {
    window.location.href = "./login.html";
    return false;
  }

  try {
    const response = await fetchCurrentUser(state.token);
    state.user = response.data.user;
    saveAuthSession({ token: state.token, user: state.user });
    renderUser();

    if (state.user.role !== "admin") {
      setStatusBanner("This dashboard requires an admin account. Redirecting to your workspace.");
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

const loadCatalogs = async () => {
  const [workflowResponse, organizerResponse] = await Promise.all([
    fetchWorkflowStates(),
    fetchAdminOrganizers(state.token),
  ]);

  state.workflowStates = workflowResponse.data.workflowStates;
  state.organizers = organizerResponse.data.organizers;
  renderSelectOptions();
};

const getNoteForBooking = (bookingId) =>
  document.querySelector(`[data-note-input="${bookingId}"]`)?.value.trim() || "";

const handleFilterSubmit = (event) => {
  event.preventDefault();
  const formData = new FormData(nodes.filterForm);

  state.filters = {
    page: 1,
    limit: state.pagination.limit,
    search: formData.get("search"),
    workflowState: formData.get("workflowState"),
    assignedOrganizer: formData.get("assignedOrganizer"),
    eventType: formData.get("eventType"),
  };

  refreshDashboard({ showSuccess: true });
};

const handleTableAction = async (event) => {
  const assignButton = event.target.closest("[data-assign-organizer]");
  const workflowButton = event.target.closest("[data-update-workflow]");
  const bookingId = assignButton?.dataset.assignOrganizer || workflowButton?.dataset.updateWorkflow;

  if (!bookingId) {
    return;
  }

  const clickedButton = assignButton || workflowButton;
  clickedButton.disabled = true;

  try {
    if (assignButton) {
      const organizerSelect = document.querySelector(`[data-organizer-select="${bookingId}"]`);
      await assignBookingOrganizer({
        token: state.token,
        bookingId,
        organizerId: organizerSelect.value || null,
        note: getNoteForBooking(bookingId),
      });
      setStatusBanner("Organizer assignment updated.", "success");
    }

    if (workflowButton) {
      const workflowSelect = document.querySelector(`[data-workflow-select="${bookingId}"]`);
      await updateBookingWorkflowState({
        token: state.token,
        bookingId,
        workflowState: workflowSelect.value,
        note: getNoteForBooking(bookingId),
      });
      setStatusBanner("Workflow state updated.", "success");
    }

    await refreshDashboard();
  } catch (error) {
    setStatusBanner(error.message || "Admin update failed.");
  } finally {
    clickedButton.disabled = false;
  }
};

const attachEvents = () => {
  nodes.signOutButton.addEventListener("click", () => {
    clearAuthSession();
    window.location.href = "./login.html";
  });

  nodes.refreshButton.addEventListener("click", () => refreshDashboard({ showSuccess: true }));
  nodes.filterForm.addEventListener("submit", handleFilterSubmit);
  nodes.bookingTableBody.addEventListener("click", handleTableAction);

  nodes.clearFiltersButton.addEventListener("click", () => {
    nodes.filterForm.reset();
    state.filters = {
      page: 1,
      limit: state.pagination.limit,
    };
    refreshDashboard({ showSuccess: true });
  });

  nodes.pagePrevious.addEventListener("click", () => {
    if (state.pagination.page <= 1) {
      return;
    }

    state.filters = {
      ...state.filters,
      page: state.pagination.page - 1,
      limit: state.pagination.limit,
    };
    refreshDashboard();
  });

  nodes.pageNext.addEventListener("click", () => {
    if (state.pagination.page >= state.pagination.totalPages) {
      return;
    }

    state.filters = {
      ...state.filters,
      page: state.pagination.page + 1,
      limit: state.pagination.limit,
    };
    refreshDashboard();
  });
};

const init = async () => {
  renderUser();
  attachEvents();

  const isAdmin = await verifyAdminSession();

  if (!isAdmin) {
    return;
  }

  try {
    await loadCatalogs();
    await refreshDashboard();
  } catch (error) {
    setStatusBanner(error.message || "Unable to initialize the admin dashboard.");
  }
};

init();
