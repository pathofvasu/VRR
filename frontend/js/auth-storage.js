import { STORAGE_KEYS } from "./auth-config.js";

const saveAuthSession = ({ token, user }) => {
  const payload = {
    token,
    user,
    savedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEYS.authSession, JSON.stringify(payload));
};

const getAuthSession = () => {
  const rawSession = localStorage.getItem(STORAGE_KEYS.authSession);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession);
  } catch (_error) {
    localStorage.removeItem(STORAGE_KEYS.authSession);
    return null;
  }
};

const clearAuthSession = () => {
  localStorage.removeItem(STORAGE_KEYS.authSession);
};

const isAuthenticated = () => Boolean(getAuthSession()?.token);

const setPostAuthRedirectUrl = (value) => {
  localStorage.setItem(STORAGE_KEYS.postAuthRedirect, value);
};

const getPostAuthRedirectUrl = () => localStorage.getItem(STORAGE_KEYS.postAuthRedirect);

const clearPostAuthRedirectUrl = () => {
  localStorage.removeItem(STORAGE_KEYS.postAuthRedirect);
};

const consumePostAuthRedirectUrl = () => {
  const redirectUrl = getPostAuthRedirectUrl();
  clearPostAuthRedirectUrl();
  return redirectUrl;
};

export {
  saveAuthSession,
  getAuthSession,
  clearAuthSession,
  isAuthenticated,
  setPostAuthRedirectUrl,
  getPostAuthRedirectUrl,
  clearPostAuthRedirectUrl,
  consumePostAuthRedirectUrl,
};
