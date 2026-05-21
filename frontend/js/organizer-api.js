import { request } from "./api-client.js";

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

const fetchOrganizerAssignments = (token) =>
  request("/organizer/assignments", {
    method: "GET",
    headers: authHeaders(token),
  });

const fetchOrganizerProgressStates = (token) =>
  request("/organizer/progress-states", {
    method: "GET",
    headers: authHeaders(token),
  });

const updateOrganizerProgress = ({ token, bookingId, workflowState, note }) =>
  request(`/organizer/assignments/${bookingId}/progress`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({
      workflowState,
      note,
    }),
  });

export {
  fetchOrganizerAssignments,
  fetchOrganizerProgressStates,
  updateOrganizerProgress,
};
