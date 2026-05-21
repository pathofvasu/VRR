import {
  fetchAdminAnalyticsOverview,
  fetchAdminCompletedEventAnalytics,
  fetchAdminMonthlyAnalytics,
  fetchAdminOrganizerAnalytics,
} from "./admin-api.js";
import { fetchCurrentUser } from "./auth-api.js";
import { clearAuthSession, getAuthSession, saveAuthSession } from "./auth-storage.js";
import { setStatusBanner } from "./auth-ui.js";

const session = getAuthSession();
const state = {
  token: session?.token || "",
  user: session?.user || null,
};

const nodes = {
  userName: document.querySelector("[data-user-name]"),
  userEmail: document.querySelector("[data-user-email]"),
  userRole: document.querySelector("[data-user-role]"),
  signOutButton: document.querySelector("[data-sign-out]"),
  metrics: document.querySelectorAll("[data-metric]"),
  completedMetrics: document.querySelectorAll("[data-completed-metric]"),
  monthlyBookings: document.querySelector("[data-monthly-bookings]"),
  completedEvents: document.querySelector("[data-completed-events]"),
  organizerAnalytics: document.querySelector("[data-organizer-analytics]"),
  recentCompleted: document.querySelector("[data-recent-completed]"),
};

const formatCurrency = (value, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatMonth = ({ year, month }) =>
  new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "2-digit",
  }).format(new Date(Date.UTC(year, month - 1, 1)));

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "Not set";

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const renderUser = () => {
  nodes.userName.textContent = state.user?.name || "Unknown admin";
  nodes.userEmail.textContent = state.user?.email || "No email available";
  nodes.userRole.textContent = state.user?.role ? `${state.user.role} access` : "Checking access";
};

const renderMetricCards = (overview) => {
  nodes.metrics.forEach((node) => {
    node.textContent = overview[node.dataset.metric] ?? 0;
  });
};

const renderCompletedMetricCards = (completed) => {
  nodes.completedMetrics.forEach((node) => {
    const value = completed[node.dataset.completedMetric] ?? 0;
    node.textContent = formatCurrency(value);
  });
};

const renderBars = ({ container, rows, valueKey, labelFormatter, emptyMessage }) => {
  if (!rows || rows.length === 0) {
    container.innerHTML = `<p class="analytics-empty">${emptyMessage}</p>`;
    return;
  }

  const maxValue = Math.max(...rows.map((row) => row[valueKey]), 1);
  container.innerHTML = rows
    .map((row) => {
      const width = Math.max((row[valueKey] / maxValue) * 100, 8);

      return `
        <div class="bar-row">
          <strong>${labelFormatter(row)}</strong>
          <span class="bar-track">
            <span class="bar-fill" style="width:${width}%"></span>
          </span>
          <small>${row[valueKey]}</small>
        </div>
      `;
    })
    .join("");
};

const renderOrganizerAnalytics = (organizers = []) => {
  if (organizers.length === 0) {
    nodes.organizerAnalytics.innerHTML = `
      <tr>
        <td colspan="7">No organizer analytics are available yet.</td>
      </tr>
    `;
    return;
  }

  nodes.organizerAnalytics.innerHTML = organizers
    .map(
      (organizer) => `
        <tr>
          <td>
            <strong>${escapeHtml(organizer.name)}</strong><br>
            <small>${escapeHtml(organizer.email)}</small>
          </td>
          <td>${organizer.assignedBookings}</td>
          <td>${organizer.scheduledEvents}</td>
          <td>${organizer.inProgressEvents}</td>
          <td>${organizer.completedEvents}</td>
          <td>${organizer.completionRate}%</td>
          <td>${formatCurrency(organizer.quotedRevenue)}</td>
        </tr>
      `
    )
    .join("");
};

const renderRecentCompleted = (bookings = []) => {
  if (bookings.length === 0) {
    nodes.recentCompleted.innerHTML = '<p class="analytics-empty">No completed events yet.</p>';
    return;
  }

  nodes.recentCompleted.innerHTML = bookings
    .map(
      (booking) => `
        <article class="completed-card">
          <strong>${escapeHtml(booking.eventTitle)}</strong>
          <span>${escapeHtml(booking.bookingCode)} | ${formatDate(booking.workflowStateUpdatedAt)}</span>
        </article>
      `
    )
    .join("");
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
      setStatusBanner("Analytics requires an admin account.");
      window.setTimeout(() => {
        window.location.href = "./booking.html";
      }, 1000);
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

const loadAnalytics = async () => {
  try {
    const [overviewResponse, monthlyResponse, completedResponse, organizerResponse] =
      await Promise.all([
        fetchAdminAnalyticsOverview(state.token),
        fetchAdminMonthlyAnalytics(state.token),
        fetchAdminCompletedEventAnalytics(state.token),
        fetchAdminOrganizerAnalytics(state.token),
      ]);

    renderMetricCards(overviewResponse.data);
    renderCompletedMetricCards(completedResponse.data);
    renderBars({
      container: nodes.monthlyBookings,
      rows: monthlyResponse.data.monthly,
      valueKey: "bookingsCreated",
      labelFormatter: formatMonth,
      emptyMessage: "No monthly booking data is available yet.",
    });
    renderBars({
      container: nodes.completedEvents,
      rows: completedResponse.data.completedByMonth,
      valueKey: "completedEvents",
      labelFormatter: formatMonth,
      emptyMessage: "No completed-event trend is available yet.",
    });
    renderOrganizerAnalytics(organizerResponse.data.organizers);
    renderRecentCompleted(completedResponse.data.completedEvents);
  } catch (error) {
    setStatusBanner(error.message || "Unable to load analytics.");
  }
};

const attachEvents = () => {
  nodes.signOutButton.addEventListener("click", () => {
    clearAuthSession();
    window.location.href = "./login.html";
  });
};

const init = async () => {
  renderUser();
  attachEvents();

  const isAdmin = await verifyAdminSession();

  if (!isAdmin) {
    return;
  }

  await loadAnalytics();
};

init();
