const fs = require("fs/promises");
const path = require("path");

const Booking = require("../models/Booking");
const createHttpError = require("../utils/createHttpError");
const { BOOKING_WORKFLOW_STATES } = require("../utils/bookingWorkflow");
const { createSimplePdfBuffer } = require("../utils/pdfWriter");
const {
  buildBookingResponse,
  createWorkflowHistoryEntry,
  getBookingAccessFilter,
  getBookingPopulateOptions,
} = require("./bookingService");

const agreementsDirectory = path.resolve(__dirname, "..", "uploads", "agreements");

const formatCurrency = (value, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "Not set";

const getSafeAgreementFileName = (bookingCode, version) =>
  `${String(bookingCode).replace(/[^A-Z0-9-]/gi, "_")}-agreement-v${version}.pdf`;

const buildAgreementPdfLines = (booking) => {
  const quotation = booking.quotation;
  const clientName = booking.client?.name || "Client";
  const organizerName = booking.assignedOrganizer?.name || "Organizer pending assignment";

  return [
    "VRR EVENTS - EVENT AGREEMENT",
    "",
    `Agreement Reference: ${booking.bookingCode}`,
    `Generated Date: ${formatDate(new Date())}`,
    "",
    "PARTIES",
    `Client: ${clientName}`,
    `Organizer: ${organizerName}`,
    "Service Provider: VRR Events",
    "",
    "EVENT SUMMARY",
    `Event: ${booking.eventTitle}`,
    `Event Type: ${booking.eventType}`,
    `Event Date: ${formatDate(booking.eventDate)}`,
    `City: ${booking.location?.city || "Not set"}`,
    `Guest Count: ${booking.guestCount}`,
    "",
    "COMMERCIAL TERMS",
    `Package Tier: ${quotation.packageTier}`,
    `Subtotal: ${formatCurrency(quotation.subtotal, quotation.currency)}`,
    `Service Fee: ${formatCurrency(quotation.serviceFee, quotation.currency)}`,
    `Tax: ${formatCurrency(quotation.tax, quotation.currency)}`,
    `Discount: ${formatCurrency(quotation.discount, quotation.currency)}`,
    `Agreement Total: ${formatCurrency(quotation.total, quotation.currency)}`,
    `Quote Valid Until: ${formatDate(quotation.validUntil)}`,
    "",
    "SCOPE OF WORK",
    ...quotation.lineItems.map((item) => `- ${item.label}: ${formatCurrency(item.total, quotation.currency)}`),
    "",
    "PROPOSAL NOTES",
    quotation.proposalNotes || "No additional proposal notes.",
    "",
    "CONFIRMATION",
    "By confirming this agreement in VRR Events, the client accepts the quoted scope and authorizes scheduling.",
    "This generated PDF is a system artifact and may be superseded by a signed legal agreement if required.",
  ];
};

const findAccessibleBooking = async ({ user, bookingId }) => {
  const booking = await Booking.findOne(
    getBookingAccessFilter({
      user,
      bookingId,
    })
  ).populate(getBookingPopulateOptions());

  if (!booking) {
    throw createHttpError(404, "Booking not found or not accessible.");
  }

  return booking;
};

const acceptBookingQuotation = async ({ user, bookingId }) => {
  const booking = await findAccessibleBooking({ user, bookingId });

  if (!booking.quotation) {
    throw createHttpError(400, "A quotation must be generated before it can be accepted.");
  }

  if (booking.workflowState !== BOOKING_WORKFLOW_STATES.QUOTE_GENERATED) {
    throw createHttpError(400, "Only generated quotations can be accepted.");
  }

  booking.workflowState = BOOKING_WORKFLOW_STATES.QUOTE_ACCEPTED;
  booking.workflowStateUpdatedAt = new Date();
  booking.workflowHistory.push(
    createWorkflowHistoryEntry({
      state: BOOKING_WORKFLOW_STATES.QUOTE_ACCEPTED,
      changedBy: user._id,
      note: "Quotation accepted.",
    })
  );

  await booking.save();

  const updatedBooking = await Booking.findById(booking._id).populate(getBookingPopulateOptions());
  return buildBookingResponse(updatedBooking);
};

const generateAgreementForBooking = async ({ bookingId, adminUserId }) => {
  const booking = await Booking.findById(bookingId).populate(getBookingPopulateOptions());

  if (!booking) {
    throw createHttpError(404, "Booking not found.");
  }

  if (!booking.quotation) {
    throw createHttpError(400, "A quotation must be generated before creating an agreement.");
  }

  if (booking.workflowState !== BOOKING_WORKFLOW_STATES.QUOTE_ACCEPTED) {
    throw createHttpError(400, "The quotation must be accepted before agreement generation.");
  }

  await fs.mkdir(agreementsDirectory, { recursive: true });

  const version = (booking.agreement?.version || 0) + 1;
  const fileName = getSafeAgreementFileName(booking.bookingCode, version);
  const filePath = path.join(agreementsDirectory, fileName);
  const pdfBuffer = createSimplePdfBuffer(buildAgreementPdfLines(booking));

  await fs.writeFile(filePath, pdfBuffer);

  booking.agreement = {
    status: "generated",
    version,
    fileName,
    filePath,
    generatedBy: adminUserId,
    generatedAt: new Date(),
  };
  booking.workflowState = BOOKING_WORKFLOW_STATES.AGREEMENT_GENERATED;
  booking.workflowStateUpdatedAt = new Date();
  booking.workflowHistory.push(
    createWorkflowHistoryEntry({
      state: BOOKING_WORKFLOW_STATES.AGREEMENT_GENERATED,
      changedBy: adminUserId,
      note: `Agreement PDF generated: ${fileName}.`,
    })
  );

  await booking.save();

  const updatedBooking = await Booking.findById(booking._id).populate(getBookingPopulateOptions());
  return buildBookingResponse(updatedBooking);
};

const getAgreementDownload = async ({ user, bookingId }) => {
  const booking = await findAccessibleBooking({ user, bookingId });

  if (!booking.agreement?.filePath || !booking.agreement?.fileName) {
    throw createHttpError(404, "Agreement PDF has not been generated for this booking.");
  }

  const resolvedPath = path.resolve(booking.agreement.filePath);

  if (!resolvedPath.startsWith(agreementsDirectory)) {
    throw createHttpError(400, "Agreement file path is invalid.");
  }

  try {
    await fs.access(resolvedPath);
  } catch (_error) {
    throw createHttpError(404, "Agreement PDF file is missing.");
  }

  return {
    filePath: resolvedPath,
    fileName: booking.agreement.fileName,
  };
};

const confirmBookingAgreement = async ({ user, bookingId }) => {
  const booking = await findAccessibleBooking({ user, bookingId });

  if (!booking.agreement?.filePath) {
    throw createHttpError(400, "Agreement must be generated before confirmation.");
  }

  if (booking.workflowState !== BOOKING_WORKFLOW_STATES.AGREEMENT_GENERATED) {
    throw createHttpError(400, "Only generated agreements can be confirmed.");
  }

  booking.agreement.status = "confirmed";
  booking.agreement.confirmedBy = user._id;
  booking.agreement.confirmedAt = new Date();
  booking.workflowState = BOOKING_WORKFLOW_STATES.EVENT_SCHEDULED;
  booking.workflowStateUpdatedAt = new Date();
  booking.workflowHistory.push(
    createWorkflowHistoryEntry({
      state: BOOKING_WORKFLOW_STATES.EVENT_SCHEDULED,
      changedBy: user._id,
      note: "Agreement confirmed and event scheduled.",
    })
  );

  await booking.save();

  const updatedBooking = await Booking.findById(booking._id).populate(getBookingPopulateOptions());
  return buildBookingResponse(updatedBooking);
};

module.exports = {
  acceptBookingQuotation,
  confirmBookingAgreement,
  generateAgreementForBooking,
  getAgreementDownload,
};
