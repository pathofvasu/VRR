const asyncHandler = require("../utils/asyncHandler");
const createHttpError = require("../utils/createHttpError");
const { BOOKING_WORKFLOW_LABELS } = require("../utils/bookingWorkflow");
const {
  ORGANIZER_PROGRESS_STATES,
  getOrganizerDashboardSummary,
  listAssignedBookings,
  updateAssignedBookingProgress,
} = require("../services/organizerService");

const getOrganizerAssignments = asyncHandler(async (req, res) => {
  const [bookings, summary] = await Promise.all([
    listAssignedBookings(req.user._id),
    getOrganizerDashboardSummary(req.user._id),
  ]);

  res.status(200).json({
    success: true,
    message: "Organizer assignments fetched successfully.",
    data: {
      summary,
      bookings,
    },
  });
});

const getOrganizerProgressStates = asyncHandler(async (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Organizer progress states fetched successfully.",
    data: {
      progressStates: ORGANIZER_PROGRESS_STATES.map((state, index) => ({
        key: state,
        label: BOOKING_WORKFLOW_LABELS[state],
        order: index + 1,
      })),
    },
  });
});

const updateOrganizerBookingProgress = asyncHandler(async (req, res) => {
  const { workflowState, note } = req.body;

  if (!workflowState) {
    throw createHttpError(400, "Workflow state is required.");
  }

  const booking = await updateAssignedBookingProgress({
    bookingId: req.params.bookingId,
    organizerId: req.user._id,
    workflowState,
    note,
  });

  res.status(200).json({
    success: true,
    message: "Organizer progress updated successfully.",
    data: {
      booking,
    },
  });
});

module.exports = {
  getOrganizerAssignments,
  getOrganizerProgressStates,
  updateOrganizerBookingProgress,
};
