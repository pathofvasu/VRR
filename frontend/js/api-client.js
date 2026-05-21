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

export {
  request,
};
