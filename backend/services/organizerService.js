const Booking = require("../models/Booking");
const createHttpError = require("../utils/createHttpError");
const {
  BOOKING_WORKFLOW_SEQUENCE,
  BOOKING_WORKFLOW_STATES,
} = require("../utils/bookingWorkflow");
const {
  buildBookingResponse,
  createWorkflowHistoryEntry,
  getBookingPopulateOptions,
} = require("./bookingService");

const ORGANIZER_PROGRESS_STATES = Object.freeze([
  BOOKING_WORKFLOW_STATES.EVENT_SCHEDULED,
  BOOKING_WORKFLOW_STATES.EVENT_IN_PROGRESS,
  BOOKING_WORKFLOW_STATES.EVENT_COMPLETED,
]);

const ensureOrganizerProgressTransitionAllowed = (currentState, nextState) => {
  if (!ORGANIZER_PROGRESS_STATES.includes(nextState)) {
    throw createHttpError(
      400,
      "Organizers can only update event progress to scheduled, in-progress, or completed states."
    );
  }

  if (currentState === nextState) {
    throw createHttpError(400, "Booking is already in the requested workflow state.");
  }

  const currentIndex = BOOKING_WORKFLOW_SEQUENCE.indexOf(currentState);
  const nextIndex = BOOKING_WORKFLOW_SEQUENCE.indexOf(nextState);
  const firstOrganizerStateIndex = BOOKING_WORKFLOW_SEQUENCE.indexOf(
    BOOKING_WORKFLOW_STATES.EVENT_SCHEDULED
  );

  if (currentIndex < firstOrganizerStateIndex) {
    throw createHttpError(
      400,
      "This booking is not ready for organizer progress updates yet."
    );
  }

  if (nextIndex < currentIndex) {
    throw createHttpError(400, "Workflow state cannot move backwards.");
  }
};

const listAssignedBookings = async (organizerId) => {
  const bookings = await Booking.find({ assignedOrganizer: organizerId })
    .sort({ eventDate: 1, createdAt: -1 })
    .populate(getBookingPopulateOptions());

  return bookings.map((booking) => buildBookingResponse(booking));
};

const getOrganizerDashboardSummary = async (organizerId) => {
  const now = new Date();

  const [assignedBookings, upcomingEvents, inProgressEvents, completedEvents] = await Promise.all([
    Booking.countDocuments({ assignedOrganizer: organizerId }),
    Booking.countDocuments({
      assignedOrganizer: organizerId,
      eventDate: { $gte: now },
      workflowState: {
        $in: [
          BOOKING_WORKFLOW_STATES.EVENT_SCHEDULED,
          BOOKING_WORKFLOW_STATES.EVENT_IN_PROGRESS,
        ],
      },
    }),
    Booking.countDocuments({
      assignedOrganizer: organizerId,
      workflowState: BOOKING_WORKFLOW_STATES.EVENT_IN_PROGRESS,
    }),
    Booking.countDocuments({
      assignedOrganizer: organizerId,
      workflowState: BOOKING_WORKFLOW_STATES.EVENT_COMPLETED,
    }),
  ]);

  return {
    assignedBookings,
    upcomingEvents,
    inProgressEvents,
    completedEvents,
  };
};

const updateAssignedBookingProgress = async ({ bookingId, organizerId, workflowState, note }) => {
  const booking = await Booking.findOne({
    _id: bookingId,
    assignedOrganizer: organizerId,
  });

  if (!booking) {
    throw createHttpError(404, "Assigned booking not found.");
  }

  ensureOrganizerProgressTransitionAllowed(booking.workflowState, workflowState);

  booking.workflowState = workflowState;
  booking.workflowStateUpdatedAt = new Date();
  booking.workflowHistory.push(
    createWorkflowHistoryEntry({
      state: workflowState,
      changedBy: organizerId,
      note: note || `Organizer updated event progress to ${workflowState}.`,
    })
  );

  await booking.save();

  const updatedBooking = await Booking.findById(booking._id).populate(getBookingPopulateOptions());
  return buildBookingResponse(updatedBooking);
};

module.exports = {
  ORGANIZER_PROGRESS_STATES,
  listAssignedBookings,
  getOrganizerDashboardSummary,
  updateAssignedBookingProgress,
};
