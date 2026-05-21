const asyncHandler = require("../utils/asyncHandler");
const createHttpError = require("../utils/createHttpError");
const {
  assignOrganizerToBooking,
  getAdminBookingById,
  getAnalyticsOverview,
  getMonthlyBookingAnalytics,
  listAdminBookings,
  listOrganizers,
  updateBookingWorkflowState,
} = require("../services/adminService");

const getAdminBookings = asyncHandler(async (req, res) => {
  const result = await listAdminBookings(req.query);

  res.status(200).json({
    success: true,
    message: "Admin booking list fetched successfully.",
    data: result,
  });
});

const getAdminBookingDetails = asyncHandler(async (req, res) => {
  const booking = await getAdminBookingById(req.params.bookingId);

  res.status(200).json({
    success: true,
    message: "Admin booking details fetched successfully.",
    data: {
      booking,
    },
  });
});

const updateAdminBookingOrganizer = asyncHandler(async (req, res) => {
  const booking = await assignOrganizerToBooking({
    bookingId: req.params.bookingId,
    organizerId: req.body.organizerId || null,
    adminUserId: req.user._id,
    note: req.body.note,
  });

  res.status(200).json({
    success: true,
    message: "Organizer assignment updated successfully.",
    data: {
      booking,
    },
  });
});

const updateAdminBookingWorkflowState = asyncHandler(async (req, res) => {
  const { workflowState, note } = req.body;

  if (!workflowState) {
    throw createHttpError(400, "Workflow state is required.");
  }

  const booking = await updateBookingWorkflowState({
    bookingId: req.params.bookingId,
    workflowState,
    adminUserId: req.user._id,
    note,
  });

  res.status(200).json({
    success: true,
    message: "Workflow state updated successfully.",
    data: {
      booking,
    },
  });
});

const getAdminOrganizers = asyncHandler(async (_req, res) => {
  const organizers = await listOrganizers();

  res.status(200).json({
    success: true,
    message: "Organizer directory fetched successfully.",
    data: {
      organizers,
    },
  });
});

const getAdminAnalyticsOverview = asyncHandler(async (_req, res) => {
  const overview = await getAnalyticsOverview();

  res.status(200).json({
    success: true,
    message: "Admin analytics overview fetched successfully.",
    data: overview,
  });
});

const getAdminMonthlyAnalytics = asyncHandler(async (_req, res) => {
  const monthly = await getMonthlyBookingAnalytics();

  res.status(200).json({
    success: true,
    message: "Admin monthly booking analytics fetched successfully.",
    data: {
      monthly,
    },
  });
});

module.exports = {
  getAdminBookings,
  getAdminBookingDetails,
  updateAdminBookingOrganizer,
  updateAdminBookingWorkflowState,
  getAdminOrganizers,
  getAdminAnalyticsOverview,
  getAdminMonthlyAnalytics,
};
