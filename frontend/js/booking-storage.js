import { STORAGE_KEYS } from "./auth-config.js";

const saveBookingDraft = (draft) => {
  localStorage.setItem(
    STORAGE_KEYS.bookingDraft,
    JSON.stringify({
      ...draft,
      savedAt: new Date().toISOString(),
    })
  );
};

const getBookingDraft = () => {
  const rawDraft = localStorage.getItem(STORAGE_KEYS.bookingDraft);

  if (!rawDraft) {
    return null;
  }

  try {
    return JSON.parse(rawDraft);
  } catch (_error) {
    localStorage.removeItem(STORAGE_KEYS.bookingDraft);
    return null;
  }
};

const clearBookingDraft = () => {
  localStorage.removeItem(STORAGE_KEYS.bookingDraft);
};

export {
  saveBookingDraft,
  getBookingDraft,
  clearBookingDraft,
};
