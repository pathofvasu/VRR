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

const fetchAdminCompletedEventAnalytics = (token) =>
  request("/admin/analytics/completed-events", {
    method: "GET",
    headers: authHeaders(token),
  });

const fetchAdminOrganizerAnalytics = (token) =>
  request("/admin/analytics/organizers", {
    method: "GET",
    headers: authHeaders(token),
  });

const fetchQuotationCatalog = (token) =>
  request("/admin/quotations/catalog", {
    method: "GET",
    headers: authHeaders(token),
  });

const generateBookingQuotation = ({ token, bookingId, payload }) =>
  request(`/admin/bookings/${bookingId}/quotation`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

const generateBookingAgreement = ({ token, bookingId }) =>
  request(`/admin/bookings/${bookingId}/agreement`, {
    method: "POST",
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
  fetchAdminCompletedEventAnalytics,
  fetchAdminOrganizerAnalytics,
  fetchQuotationCatalog,
  generateBookingQuotation,
  generateBookingAgreement,
  assignBookingOrganizer,
  updateBookingWorkflowState,
};
