import { request } from "./api-client.js";

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
