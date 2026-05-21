const setFieldError = (fieldName, message) => {
  const fieldGroup = document.querySelector(`[data-field-group="${fieldName}"]`);
  const errorNode = document.querySelector(`[data-field-error="${fieldName}"]`);

  if (!fieldGroup || !errorNode) {
    return;
  }

  fieldGroup.classList.toggle("has-error", Boolean(message));
  errorNode.textContent = message || "";
};

const clearFieldErrors = (fieldNames) => {
  fieldNames.forEach((fieldName) => setFieldError(fieldName, ""));
};

const setStatusBanner = (message, type = "error") => {
  const banner = document.querySelector("[data-status-banner]");

  if (!banner) {
    return;
  }

  if (!message) {
    banner.className = "status-banner";
    banner.textContent = "";
    return;
  }

  banner.className = `status-banner is-visible ${type === "success" ? "is-success" : "is-error"}`;
  banner.textContent = message;
};

const setSubmitState = (button, isSubmitting, idleLabel, busyLabel) => {
  button.disabled = isSubmitting;
  button.textContent = isSubmitting ? busyLabel : idleLabel;
};

const attachPasswordToggle = (buttonSelector, inputSelector) => {
  const button = document.querySelector(buttonSelector);
  const input = document.querySelector(inputSelector);

  if (!button || !input) {
    return;
  }

  button.addEventListener("click", () => {
    const isPasswordHidden = input.type === "password";
    input.type = isPasswordHidden ? "text" : "password";
    button.textContent = isPasswordHidden ? "Hide" : "Show";
  });
};

export {
  setFieldError,
  clearFieldErrors,
  setStatusBanner,
  setSubmitState,
  attachPasswordToggle,
};
