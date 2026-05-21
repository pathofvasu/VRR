const Booking = require("../models/Booking");
const asyncHandler = require("../utils/asyncHandler");
const createHttpError = require("../utils/createHttpError");
const {
  buildBookingCreationPayload,
  buildBookingResponse,
  buildWorkflowStateCatalog,
  generateBookingCode,
  getBookingAccessFilter,
  getBookingListFilter,
  validateBookingPayload,
} = require("../services/bookingService");

const bookingPopulateOptions = [
  {
    path: "client",
    select: "name email role createdAt updatedAt",
  },
  {
    path: "assignedOrganizer",
    select: "name email role createdAt updatedAt",
  },
  {
    path: "workflowHistory.changedBy",
    select: "name email role",
  },
];

const createBooking = asyncHandler(async (req, res) => {
  const validatedBookingInput = validateBookingPayload(req.body);

  const booking = await Booking.create(
    buildBookingCreationPayload({
      bookingCode: generateBookingCode(),
      clientId: req.user._id,
      validatedBookingInput,
    })
  );

  const populatedBooking = await Booking.findById(booking._id).populate(bookingPopulateOptions);

  res.status(201).json({
    success: true,
    message: "Booking request submitted successfully.",
    data: {
      booking: buildBookingResponse(populatedBooking),
    },
  });
});

const listBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find(getBookingListFilter(req.user))
    .sort({ createdAt: -1 })
    .populate(bookingPopulateOptions);

  res.status(200).json({
    success: true,
    message: "Bookings fetched successfully.",
    data: {
      bookings: bookings.map((booking) => buildBookingResponse(booking)),
    },
  });
});

const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne(
    getBookingAccessFilter({
      user: req.user,
      bookingId: req.params.bookingId,
    })
  ).populate(bookingPopulateOptions);

  if (!booking) {
    throw createHttpError(404, "Booking not found or not accessible.");
  }

  res.status(200).json({
    success: true,
    message: "Booking fetched successfully.",
    data: {
      booking: buildBookingResponse(booking),
    },
  });
});

const getWorkflowStates = asyncHandler(async (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Booking workflow states fetched successfully.",
    data: {
      workflowStates: buildWorkflowStateCatalog(),
    },
  });
});

module.exports = {
  createBooking,
  listBookings,
  getBookingById,
  getWorkflowStates,
};
