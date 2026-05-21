const mongoose = require("mongoose");

const Booking = require("../models/Booking");
const User = require("../models/User");
const createHttpError = require("../utils/createHttpError");
const {
  BOOKING_WORKFLOW_STATES,
  buildAdminBookingFilters,
  buildBookingResponse,
  buildWorkflowStateCatalog,
  createWorkflowHistoryEntry,
  ensureWorkflowStateTransitionAllowed,
  getBookingPopulateOptions,
} = require("./bookingService");

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
};

const listAdminBookings = async (query) => {
  const page = parsePositiveInteger(query.page, 1);
  const limit = Math.min(parsePositiveInteger(query.limit, 12), 100);
  const skip = (page - 1) * limit;
  const filters = buildAdminBookingFilters(query);

  const [total, bookings] = await Promise.all([
    Booking.countDocuments(filters),
    Booking.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(getBookingPopulateOptions()),
  ]);

  return {
    bookings: bookings.map((booking) => buildBookingResponse(booking)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  };
};

const getAdminBookingById = async (bookingId) => {
  const booking = await Booking.findById(bookingId).populate(getBookingPopulateOptions());

  if (!booking) {
    throw createHttpError(404, "Booking not found.");
  }

  return buildBookingResponse(booking);
};

const assignOrganizerToBooking = async ({ bookingId, organizerId, adminUserId, note }) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw createHttpError(404, "Booking not found.");
  }

  let organizer = null;

  if (organizerId) {
    if (!mongoose.Types.ObjectId.isValid(organizerId)) {
      throw createHttpError(400, "Organizer ID is invalid.");
    }

    organizer = await User.findById(organizerId);

    if (!organizer || organizer.role !== "organizer") {
      throw createHttpError(404, "Organizer not found.");
    }
  }

  booking.assignedOrganizer = organizer ? organizer._id : null;
  booking.workflowHistory.push(
    createWorkflowHistoryEntry({
      state: booking.workflowState,
      changedBy: adminUserId,
      note:
        note ||
        (organizer
          ? `Organizer assigned: ${organizer.name}.`
          : "Organizer assignment cleared by admin."),
    })
  );

  await booking.save();

  const updatedBooking = await Booking.findById(booking._id).populate(getBookingPopulateOptions());
  return buildBookingResponse(updatedBooking);
};

const updateBookingWorkflowState = async ({ bookingId, workflowState, adminUserId, note }) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw createHttpError(404, "Booking not found.");
  }

  ensureWorkflowStateTransitionAllowed(booking.workflowState, workflowState);

  booking.workflowState = workflowState;
  booking.workflowStateUpdatedAt = new Date();
  booking.workflowHistory.push(
    createWorkflowHistoryEntry({
      state: workflowState,
      changedBy: adminUserId,
      note: note || `Workflow moved to ${workflowState}.`,
    })
  );

  await booking.save();

  const updatedBooking = await Booking.findById(booking._id).populate(getBookingPopulateOptions());
  return buildBookingResponse(updatedBooking);
};

const listOrganizers = async () => {
  const organizers = await User.find({ role: "organizer" }).sort({ name: 1 });
  const assignmentCounts = await Booking.aggregate([
    {
      $match: {
        assignedOrganizer: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$assignedOrganizer",
        assignedBookings: { $sum: 1 },
      },
    },
  ]);

  const countMap = new Map(
    assignmentCounts.map((entry) => [String(entry._id), entry.assignedBookings])
  );

  return organizers.map((organizer) => ({
    ...organizer.toSafeObject(),
    assignedBookings: countMap.get(String(organizer._id)) || 0,
  }));
};

const getAnalyticsOverview = async () => {
  const [
    totalBookings,
    unassignedBookings,
    completedEvents,
    activeOrganizerCount,
    workflowCounts,
    upcomingBookings,
    recentBookings,
  ] = await Promise.all([
    Booking.countDocuments(),
    Booking.countDocuments({ assignedOrganizer: null }),
    Booking.countDocuments({ workflowState: BOOKING_WORKFLOW_STATES.EVENT_COMPLETED }),
    User.countDocuments({ role: "organizer" }),
    Booking.aggregate([
      {
        $group: {
          _id: "$workflowState",
          count: { $sum: 1 },
        },
      },
    ]),
    Booking.countDocuments({
      eventDate: { $gte: new Date() },
      workflowState: {
        $in: [
          BOOKING_WORKFLOW_STATES.EVENT_SCHEDULED,
          BOOKING_WORKFLOW_STATES.EVENT_IN_PROGRESS,
        ],
      },
    }),
    Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate(getBookingPopulateOptions()),
  ]);

  const workflowBreakdown = buildWorkflowStateCatalog().map((state) => ({
    ...state,
    count:
      workflowCounts.find((entry) => entry._id === state.key)?.count || 0,
  }));

  const reviewQueueCount = workflowBreakdown
    .filter((state) =>
      [BOOKING_WORKFLOW_STATES.REQUEST_SUBMITTED, BOOKING_WORKFLOW_STATES.ADMIN_REVIEW].includes(
        state.key
      )
    )
    .reduce((sum, state) => sum + state.count, 0);

  return {
    totalBookings,
    reviewQueueCount,
    unassignedBookings,
    completedEvents,
    activeOrganizerCount,
    upcomingBookings,
    workflowBreakdown,
    recentBookings: recentBookings.map((booking) => buildBookingResponse(booking)),
  };
};

const getMonthlyBookingAnalytics = async () => {
  const today = new Date();
  const rangeStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5, 1));

  const monthlyStats = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: rangeStart },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        bookingsCreated: { $sum: 1 },
        totalGuests: { $sum: "$guestCount" },
      },
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
      },
    },
  ]);

  return monthlyStats.map((entry) => ({
    year: entry._id.year,
    month: entry._id.month,
    bookingsCreated: entry.bookingsCreated,
    totalGuests: entry.totalGuests,
  }));
};

const getCompletedEventAnalytics = async () => {
  const today = new Date();
  const rangeStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 11, 1));

  const [completedEvents, completedByMonth, quotedCompletedEvents] = await Promise.all([
    Booking.find({ workflowState: BOOKING_WORKFLOW_STATES.EVENT_COMPLETED })
      .sort({ workflowStateUpdatedAt: -1 })
      .limit(10)
      .populate(getBookingPopulateOptions()),
    Booking.aggregate([
      {
        $match: {
          workflowState: BOOKING_WORKFLOW_STATES.EVENT_COMPLETED,
          workflowStateUpdatedAt: { $gte: rangeStart },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$workflowStateUpdatedAt" },
            month: { $month: "$workflowStateUpdatedAt" },
          },
          completedEvents: { $sum: 1 },
          completedGuests: { $sum: "$guestCount" },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]),
    Booking.aggregate([
      {
        $match: {
          workflowState: BOOKING_WORKFLOW_STATES.EVENT_COMPLETED,
          "quotation.total": { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          quotedRevenue: { $sum: "$quotation.total" },
          averageQuoteValue: { $avg: "$quotation.total" },
        },
      },
    ]),
  ]);

  const quoteSummary = quotedCompletedEvents[0] || {
    quotedRevenue: 0,
    averageQuoteValue: 0,
  };

  return {
    completedEvents: completedEvents.map((booking) => buildBookingResponse(booking)),
    completedByMonth: completedByMonth.map((entry) => ({
      year: entry._id.year,
      month: entry._id.month,
      completedEvents: entry.completedEvents,
      completedGuests: entry.completedGuests,
    })),
    quotedRevenue: Math.round(quoteSummary.quotedRevenue || 0),
    averageQuoteValue: Math.round(quoteSummary.averageQuoteValue || 0),
  };
};

const getOrganizerPerformanceAnalytics = async () => {
  const organizers = await User.find({ role: "organizer" }).sort({ name: 1 });
  const performance = await Booking.aggregate([
    {
      $match: {
        assignedOrganizer: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$assignedOrganizer",
        assignedBookings: { $sum: 1 },
        completedEvents: {
          $sum: {
            $cond: [{ $eq: ["$workflowState", BOOKING_WORKFLOW_STATES.EVENT_COMPLETED] }, 1, 0],
          },
        },
        inProgressEvents: {
          $sum: {
            $cond: [{ $eq: ["$workflowState", BOOKING_WORKFLOW_STATES.EVENT_IN_PROGRESS] }, 1, 0],
          },
        },
        scheduledEvents: {
          $sum: {
            $cond: [{ $eq: ["$workflowState", BOOKING_WORKFLOW_STATES.EVENT_SCHEDULED] }, 1, 0],
          },
        },
        totalGuests: { $sum: "$guestCount" },
        quotedRevenue: { $sum: { $ifNull: ["$quotation.total", 0] } },
      },
    },
  ]);

  const performanceMap = new Map(performance.map((entry) => [String(entry._id), entry]));

  return organizers.map((organizer) => {
    const entry = performanceMap.get(String(organizer._id)) || {};
    const assignedBookings = entry.assignedBookings || 0;
    const completedEvents = entry.completedEvents || 0;

    return {
      ...organizer.toSafeObject(),
      assignedBookings,
      completedEvents,
      inProgressEvents: entry.inProgressEvents || 0,
      scheduledEvents: entry.scheduledEvents || 0,
      totalGuests: entry.totalGuests || 0,
      quotedRevenue: Math.round(entry.quotedRevenue || 0),
      completionRate:
        assignedBookings > 0 ? Math.round((completedEvents / assignedBookings) * 100) : 0,
    };
  });
};

module.exports = {
  listAdminBookings,
  getAdminBookingById,
  assignOrganizerToBooking,
  updateBookingWorkflowState,
  listOrganizers,
  getAnalyticsOverview,
  getMonthlyBookingAnalytics,
  getCompletedEventAnalytics,
  getOrganizerPerformanceAnalytics,
};
