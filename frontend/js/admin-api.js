import { request } from "./api-client.js";

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      query.set(key, String(value).trim());
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

const fetchAdminBookings = ({ token, filters }) =>
  request(`/admin/bookings${buildQueryString(filters)}`, {
    method: "GET",
    headers: authHeaders(token),
  });

const fetchAdminOrganizers = (token) =>
  request("/admin/organizers", {
    method: "GET",
    headers: authHeaders(token),
  });

const fetchAdminAnalyticsOverview = (token) =>
  request("/admin/analytics/overview", {
    method: "GET",
    headers: authHeaders(token),
  });

const fetchAdminMonthlyAnalytics = (token) =>
  request("/admin/analytics/monthly", {
    method: "GET",
    headers: authHeaders(token),
  });

const assignBookingOrganizer = ({ token, bookingId, organizerId, note }) =>
  request(`/admin/bookings/${bookingId}/assign-organizer`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({
      organizerId,
      note,
    }),
  });

const updateBookingWorkflowState = ({ token, bookingId, workflowState, note }) =>
  request(`/admin/bookings/${bookingId}/workflow-state`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({
      workflowState,
      note,
    }),
  });

export {
  fetchAdminBookings,
  fetchAdminOrganizers,
  fetchAdminAnalyticsOverview,
  fetchAdminMonthlyAnalytics,
  assignBookingOrganizer,
  updateBookingWorkflowState,
};
