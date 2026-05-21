import { fetchCurrentUser } from "./auth-api.js";
import { clearAuthSession, getAuthSession, saveAuthSession } from "./auth-storage.js";
import { setStatusBanner } from "./auth-ui.js";
import { getDashboardUrlForRole } from "./dashboard-routing.js";
import {
  dispatchDueEmailNotifications,
  fetchNotifications,
  markNotificationRead,
  runAppointmentReminderJob,
} from "./notification-api.js";

const session = getAuthSession();
const state = {
  token: session?.token || "",
  user: session?.user || null,
  notifications: [],
};

const nodes = {
  userName: document.querySelector("[data-user-name]"),
  userEmail: document.querySelector("[data-user-email]"),
  userRole: document.querySelector("[data-user-role]"),
  dashboardLink: document.querySelector("[data-dashboard-link]"),
  signOutButton: document.querySelector("[data-sign-out]"),
  refreshButton: document.querySelector("[data-refresh-notifications]"),
  reminderButton: document.querySelector("[data-run-reminders]"),
  dispatchButton: document.querySelector("[data-dispatch-emails]"),
  list: document.querySelector("[data-notifications-list]"),
};

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

const labelize = (value) =>
  String(value || "")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const renderUser = () => {
  nodes.userName.textContent = state.user?.name || "Unknown user";
  nodes.userEmail.textContent = state.user?.email || "No email available";
  nodes.userRole.textContent = state.user?.role ? `${state.user.role} access` : "Checking access";
  nodes.dashboardLink.href = getDashboardUrlForRole(state.user?.role);
  nodes.reminderButton.hidden = state.user?.role !== "admin";
  nodes.dispatchButton.hidden = state.user?.role !== "admin";
};

const renderNotifications = () => {
  if (state.notifications.length === 0) {
    nodes.list.innerHTML = '<p class="notifications-empty">No notifications yet.</p>';
    return;
  }

  nodes.list.innerHTML = state.notifications
    .map(
      (notification) => `
        <article class="notification-card ${notification.status === "read" ? "is-read" : ""}">
          <div>
            <span class="notification-pill">${labelize(notification.type)}</span>
            <h3>${escapeHtml(notification.title)}</h3>
            <p>${escapeHtml(notification.message)}</p>
            <small class="notification-meta">${formatDateTime(notification.createdAt)} | ${escapeHtml(notification.status)}</small>
          </div>
          ${
            notification.status !== "read"
              ? `<button class="secondary-button" type="button" data-mark-read="${escapeHtml(notification.id)}">Mark Read</button>`
              : ""
          }
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

const loadNotifications = async ({ showSuccess = false } = {}) => {
  try {
    nodes.list.innerHTML = '<p class="notifications-empty">Loading notifications...</p>';
    const response = await fetchNotifications(state.token);
    state.notifications = response.data.notifications;
    renderNotifications();

    if (showSuccess) {
      setStatusBanner("Notifications refreshed.", "success");
    }
  } catch (error) {
    setStatusBanner(error.message || "Unable to load notifications.");
  }
};

const attachEvents = () => {
  nodes.signOutButton.addEventListener("click", () => {
    clearAuthSession();
    window.location.href = "./login.html";
  });

  nodes.refreshButton.addEventListener("click", () => loadNotifications({ showSuccess: true }));

  nodes.list.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-mark-read]");

    if (!button) {
      return;
    }

    button.disabled = true;

    try {
      await markNotificationRead({
        token: state.token,
        notificationId: button.dataset.markRead,
      });
      setStatusBanner("Notification marked as read.", "success");
      await loadNotifications();
    } catch (error) {
      setStatusBanner(error.message || "Unable to update notification.");
    } finally {
      button.disabled = false;
    }
  });

  nodes.reminderButton.addEventListener("click", async () => {
    nodes.reminderButton.disabled = true;

    try {
      const response = await runAppointmentReminderJob({
        token: state.token,
        windowMinutes: 1440,
      });
      setStatusBanner(
        `Created ${response.data.remindersCreated} reminder notifications. Emails sent: ${response.data.emailResults.sent}.`,
        "success"
      );
      await loadNotifications();
    } catch (error) {
      setStatusBanner(error.message || "Unable to run reminders.");
    } finally {
      nodes.reminderButton.disabled = false;
    }
  });

  nodes.dispatchButton.addEventListener("click", async () => {
    nodes.dispatchButton.disabled = true;

    try {
      const response = await dispatchDueEmailNotifications(state.token);
      setStatusBanner(
        `Email dispatch finished. Sent: ${response.data.emailResults.sent}, failed: ${response.data.emailResults.failed}, skipped: ${response.data.emailResults.skipped}.`,
        "success"
      );
    } catch (error) {
      setStatusBanner(error.message || "Unable to dispatch emails.");
    } finally {
      nodes.dispatchButton.disabled = false;
    }
  });
};

const init = async () => {
  renderUser();
  attachEvents();

  const isVerified = await verifySession();

  if (!isVerified) {
    return;
  }

  await loadNotifications();
};

init();
