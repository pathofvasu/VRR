const Booking = require("../models/Booking");
const {
  acceptBookingQuotation,
  confirmBookingAgreement,
  getAgreementDownload,
} = require("../services/agreementService");
const asyncHandler = require("../utils/asyncHandler");
const createHttpError = require("../utils/createHttpError");
const {
  buildBookingCreationPayload,
  buildBookingResponse,
  buildWorkflowStateCatalog,
  generateBookingCode,
  getBookingPopulateOptions,
  getBookingAccessFilter,
  getBookingListFilter,
  validateBookingPayload,
} = require("../services/bookingService");

const createBooking = asyncHandler(async (req, res) => {
  const validatedBookingInput = validateBookingPayload(req.body);
  const bookingPopulateOptions = getBookingPopulateOptions();

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
  const bookingPopulateOptions = getBookingPopulateOptions();
  const bookings = await Booking.find(getBookingListFilter(req.user))
    .sort({ createdAt: -1 })
    .populate(getBookingPopulateOptions());

  res.status(200).json({
    success: true,
    message: "Bookings fetched successfully.",
    data: {
      bookings: bookings.map((booking) => buildBookingResponse(booking)),
    },
  });
});

const getBookingById = asyncHandler(async (req, res) => {
  const bookingPopulateOptions = getBookingPopulateOptions();
  const booking = await Booking.findOne(
    getBookingAccessFilter({
      user: req.user,
      bookingId: req.params.bookingId,
    })
  ).populate(getBookingPopulateOptions());

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

const acceptQuote = asyncHandler(async (req, res) => {
  const booking = await acceptBookingQuotation({
    user: req.user,
    bookingId: req.params.bookingId,
  });

  res.status(200).json({
    success: true,
    message: "Quotation accepted successfully.",
    data: {
      booking,
    },
  });
});

const downloadAgreement = asyncHandler(async (req, res) => {
  const agreementDownload = await getAgreementDownload({
    user: req.user,
    bookingId: req.params.bookingId,
  });

  res.download(agreementDownload.filePath, agreementDownload.fileName);
});

const confirmAgreement = asyncHandler(async (req, res) => {
  const booking = await confirmBookingAgreement({
    user: req.user,
    bookingId: req.params.bookingId,
  });

  res.status(200).json({
    success: true,
    message: "Agreement confirmed successfully.",
    data: {
      booking,
    },
  });
});

module.exports = {
  createBooking,
  listBookings,
  getBookingById,
  getWorkflowStates,
  acceptQuote,
  downloadAgreement,
  confirmAgreement,
};
