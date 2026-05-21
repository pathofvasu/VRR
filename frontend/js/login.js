import { loginUser } from "./auth-api.js";
import { DEFAULT_API_BASE_URL, getApiBaseUrl, setApiBaseUrl } from "./auth-config.js";
import { consumePostAuthRedirectUrl, getAuthSession, isAuthenticated, saveAuthSession } from "./auth-storage.js";
import { validateApiBaseUrl, validateEmail } from "./auth-validation.js";
import { clearFieldErrors, setFieldError, setStatusBanner, setSubmitState, attachPasswordToggle } from "./auth-ui.js";
import { getDashboardUrlForRole } from "./dashboard-routing.js";

if (isAuthenticated()) {
  const existingSession = getAuthSession();
  window.location.href =
    consumePostAuthRedirectUrl() || getDashboardUrlForRole(existingSession?.user?.role);
}

const form = document.querySelector("[data-auth-form='login']");
const submitButton = document.querySelector("[data-submit-button]");
const apiBaseUrlInput = document.querySelector("#apiBaseUrl");

apiBaseUrlInput.value = getApiBaseUrl();
attachPasswordToggle("[data-toggle-password='password']", "#password");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  clearFieldErrors(["apiBaseUrl", "email", "password"]);
  setStatusBanner("");

  const formData = new FormData(form);
  const apiBaseUrl = String(formData.get("apiBaseUrl") || "");
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  const errors = {
    apiBaseUrl: validateApiBaseUrl(apiBaseUrl),
    email: validateEmail(email),
    password: password ? "" : "Please enter your password.",
  };

  let hasErrors = false;

  Object.entries(errors).forEach(([fieldName, message]) => {
    if (message) {
      hasErrors = true;
      setFieldError(fieldName, message);
    }
  });

  if (hasErrors) {
    setStatusBanner("Please fix the highlighted fields and try again.");
    return;
  }

  setApiBaseUrl(apiBaseUrl || DEFAULT_API_BASE_URL);
  setSubmitState(submitButton, true, "Log In", "Signing In...");

  try {
    const response = await loginUser({
      email,
      password,
    });

    saveAuthSession(response.data);
    const redirectDestination =
      consumePostAuthRedirectUrl() || getDashboardUrlForRole(response.data.user.role);
    setStatusBanner("Login successful. Redirecting to continue your flow...", "success");
    window.setTimeout(() => {
      window.location.href = redirectDestination;
    }, 650);
  } catch (error) {
    setStatusBanner(error.message || "Unable to sign you in right now.");
  } finally {
    setSubmitState(submitButton, false, "Log In", "Signing In...");
  }
});
