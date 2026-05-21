import { fetchCurrentUser } from "./auth-api.js";
import { getApiBaseUrl } from "./auth-config.js";
import { getAuthSession, clearAuthSession } from "./auth-storage.js";
import { setStatusBanner } from "./auth-ui.js";

const session = getAuthSession();
const signOutButton = document.querySelector("[data-sign-out]");
const reloadButton = document.querySelector("[data-refresh-profile]");
const apiBaseNode = document.querySelector("[data-api-base]");
const nameNode = document.querySelector("[data-user-name]");
const emailNode = document.querySelector("[data-user-email]");
const roleNode = document.querySelector("[data-user-role]");
const createdAtNode = document.querySelector("[data-user-created-at]");

if (!session?.token) {
  window.location.href = "./login.html";
}

apiBaseNode.textContent = getApiBaseUrl();

const renderProfile = (user) => {
  nameNode.textContent = user.name;
  emailNode.textContent = user.email;
  roleNode.textContent = user.role;
  createdAtNode.textContent = new Date(user.createdAt).toLocaleString();
};

renderProfile(session.user);

const loadProfile = async () => {
  try {
    const response = await fetchCurrentUser(session.token);
    renderProfile(response.data.user);
    setStatusBanner("Authenticated session confirmed with the backend.", "success");
  } catch (error) {
    clearAuthSession();
    setStatusBanner(error.message || "Your session could not be verified.");
    window.setTimeout(() => {
      window.location.href = "./login.html";
    }, 1000);
  }
};

signOutButton.addEventListener("click", () => {
  clearAuthSession();
  window.location.href = "./login.html";
});

reloadButton.addEventListener("click", () => {
  setStatusBanner("");
  loadProfile();
});

loadProfile();
