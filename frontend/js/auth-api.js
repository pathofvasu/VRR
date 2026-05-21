import { getApiBaseUrl } from "./auth-config.js";

const request = async (path, options = {}) => {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const responseData = contentType.includes("application/json")
    ? await response.json()
    : { success: false, message: "Unexpected server response." };

  if (!response.ok) {
    throw new Error(responseData.message || "Request failed.");
  }

  return responseData;
};

const registerUser = (payload) =>
  request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

const loginUser = (payload) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

const fetchCurrentUser = (token) =>
  request("/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export {
  registerUser,
  loginUser,
  fetchCurrentUser,
};
