const DEFAULT_API_BASE_URL = "http://localhost:5000/api/v1";
const STORAGE_KEYS = {
  apiBaseUrl: "vrr-events-api-base-url",
  authSession: "vrr-events-auth-session",
};

const getApiBaseUrl = () => localStorage.getItem(STORAGE_KEYS.apiBaseUrl) || DEFAULT_API_BASE_URL;

const setApiBaseUrl = (value) => {
  const normalizedValue = value.trim().replace(/\/+$/, "");
  localStorage.setItem(STORAGE_KEYS.apiBaseUrl, normalizedValue || DEFAULT_API_BASE_URL);
};

export {
  DEFAULT_API_BASE_URL,
  STORAGE_KEYS,
  getApiBaseUrl,
  setApiBaseUrl,
};
