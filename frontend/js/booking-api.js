import { request } from "./api-client.js";
import { getApiBaseUrl } from "./auth-config.js";

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

const fetchUserBookings = (token) =>
  request("/bookings", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

const acceptBookingQuote = ({ token, bookingId }) =>
  request(`/bookings/${bookingId}/quote/accept`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

const confirmBookingAgreement = ({ token, bookingId }) =>
  request(`/bookings/${bookingId}/agreement/confirm`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

const getAgreementDownloadUrl = (bookingId) => `/bookings/${bookingId}/agreement/download`;

const downloadAgreementPdf = async ({ token, bookingId }) => {
  const response = await fetch(`${getApiBaseUrl()}${getAgreementDownloadUrl(bookingId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "Unable to download agreement PDF.",
    }));
    throw new Error(errorData.message || "Unable to download agreement PDF.");
  }

  return response.blob();
};

export {
  fetchWorkflowStates,
  createBooking,
  fetchUserBookings,
  acceptBookingQuote,
  confirmBookingAgreement,
  downloadAgreementPdf,
  getAgreementDownloadUrl,
};
