import { request } from "./api-client.js";

const fetchWorkflowStates = () =>
  request("/bookings/workflow-states", {
    method: "GET",
  });

const createBooking = ({ token, payload }) =>
  request("/bookings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

export {
  fetchWorkflowStates,
  createBooking,
};
