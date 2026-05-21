const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const validateName = (name) => {
  if (!name.trim()) {
    return "Please enter your full name.";
  }

  if (name.trim().length < 2) {
    return "Name must be at least 2 characters long.";
  }

  return "";
};

const validateEmail = (email) => {
  if (!email.trim()) {
    return "Please enter your email address.";
  }

  if (!emailPattern.test(email.trim().toLowerCase())) {
    return "Please enter a valid email address.";
  }

  return "";
};

const validatePassword = (password) => {
  if (!password) {
    return "Please enter your password.";
  }

  if (!passwordPattern.test(password)) {
    return "Use at least 8 characters with at least one letter and one number.";
  }

  return "";
};

const validatePasswordConfirmation = (password, confirmation) => {
  if (!confirmation) {
    return "Please confirm your password.";
  }

  if (password !== confirmation) {
    return "Passwords do not match.";
  }

  return "";
};

const validateApiBaseUrl = (value) => {
  try {
    const parsed = new URL(value.trim());
    if (!/^https?:$/.test(parsed.protocol)) {
      return "Use an http or https URL for the backend API.";
    }
    return "";
  } catch (_error) {
    return "Please enter a valid backend API URL.";
  }
};

export {
  validateName,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateApiBaseUrl,
};
