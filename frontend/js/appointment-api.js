import { request } from "./api-client.js";

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

const fetchAppointments = (token) =>
  request("/appointments", {
    method: "GET",
    headers: authHeaders(token),
  });

const fetchAppointmentCatalog = (token) =>
  request("/appointments/catalog", {
    method: "GET",
    headers: authHeaders(token),
  });

const scheduleAppointment = ({ token, payload }) =>
  request("/appointments", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

const updateAppointmentStatus = ({ token, appointmentId, status }) =>
  request(`/appointments/${appointmentId}/status`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({
      status,
    }),
  });

export {
  fetchAppointments,
  fetchAppointmentCatalog,
  scheduleAppointment,
  updateAppointmentStatus,
};
