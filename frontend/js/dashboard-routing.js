const getDashboardUrlForRole = (role) => {
  if (role === "admin") {
    return "./dashboard.html";
  }

  if (role === "organizer") {
    return "./organizer-dashboard.html";
  }

  return "./booking.html";
};

export {
  getDashboardUrlForRole,
};
