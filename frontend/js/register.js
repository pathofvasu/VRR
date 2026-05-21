import { registerUser } from "./auth-api.js";
import { DEFAULT_API_BASE_URL, getApiBaseUrl, setApiBaseUrl } from "./auth-config.js";
import { consumePostAuthRedirectUrl, getAuthSession, isAuthenticated, saveAuthSession } from "./auth-storage.js";
import {
  validateApiBaseUrl,
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordConfirmation,
} from "./auth-validation.js";
import { clearFieldErrors, setFieldError, setStatusBanner, setSubmitState, attachPasswordToggle } from "./auth-ui.js";
import { getDashboardUrlForRole } from "./dashboard-routing.js";

if (isAuthenticated()) {
  const existingSession = getAuthSession();
  window.location.href =
    consumePostAuthRedirectUrl() || getDashboardUrlForRole(existingSession?.user?.role);
}

const form = document.querySelector("[data-auth-form='register']");
const submitButton = document.querySelector("[data-submit-button]");
const apiBaseUrlInput = document.querySelector("#apiBaseUrl");

apiBaseUrlInput.value = getApiBaseUrl();
attachPasswordToggle("[data-toggle-password='password']", "#password");
attachPasswordToggle("[data-toggle-password='confirmPassword']", "#confirmPassword");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  clearFieldErrors(["apiBaseUrl", "name", "email", "password", "confirmPassword"]);
  setStatusBanner("");

  const formData = new FormData(form);
  const apiBaseUrl = String(formData.get("apiBaseUrl") || "");
  const name = String(formData.get("name") || "");
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  const errors = {
    apiBaseUrl: validateApiBaseUrl(apiBaseUrl),
    name: validateName(name),
    email: validateEmail(email),
    password: validatePassword(password),
    confirmPassword: validatePasswordConfirmation(password, confirmPassword),
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
  setSubmitState(submitButton, true, "Create Account", "Creating Account...");

  try {
    const response = await registerUser({
      name,
      email,
      password,
    });

    saveAuthSession(response.data);
    const redirectDestination =
      consumePostAuthRedirectUrl() || getDashboardUrlForRole(response.data.user.role);
    setStatusBanner("Account created successfully. Redirecting to continue your flow...", "success");
    window.setTimeout(() => {
      window.location.href = redirectDestination;
    }, 650);
  } catch (error) {
    setStatusBanner(error.message || "Unable to create your account right now.");
  } finally {
    setSubmitState(submitButton, false, "Create Account", "Creating Account...");
  }
});
