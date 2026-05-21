import { request } from "./api-client.js";

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

const fetchNotifications = (token) =>
  request("/notifications", {
    method: "GET",
    headers: authHeaders(token),
  });

const markNotificationRead = ({ token, notificationId }) =>
  request(`/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: authHeaders(token),
  });

const runAppointmentReminderJob = ({ token, windowMinutes = 1440 }) =>
  request("/notifications/reminders/appointments", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      windowMinutes,
    }),
  });

const dispatchDueEmailNotifications = (token) =>
  request("/notifications/dispatch-emails", {
    method: "POST",
    headers: authHeaders(token),
  });

export {
  fetchNotifications,
  markNotificationRead,
  runAppointmentReminderJob,
  dispatchDueEmailNotifications,
};
