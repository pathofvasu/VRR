const Booking = require("../models/Booking");
const createHttpError = require("../utils/createHttpError");
const { BOOKING_WORKFLOW_STATES } = require("../utils/bookingWorkflow");
const {
  buildBookingResponse,
  createWorkflowHistoryEntry,
  getBookingPopulateOptions,
} = require("./bookingService");

const PACKAGE_PRICING = Object.freeze({
  essential: {
    label: "Essential",
    basePrice: 65000,
    guestRate: 450,
    serviceMultiplier: 0.85,
    serviceFeeRate: 0.08,
  },
  signature: {
    label: "Signature",
    basePrice: 125000,
    guestRate: 850,
    serviceMultiplier: 1,
    serviceFeeRate: 0.1,
  },
  luxury: {
    label: "Luxury",
    basePrice: 240000,
    guestRate: 1500,
    serviceMultiplier: 1.35,
    serviceFeeRate: 0.12,
  },
});

const SERVICE_PRICING = Object.freeze({
  "planning-and-coordination": 42000,
  "venue-sourcing": 28000,
  "decor-and-styling": 75000,
  "guest-management": 36000,
  "vendor-management": 32000,
  "catering-curation": 54000,
  "entertainment-and-stage": 68000,
  "photography-and-film": 58000,
  "hospitality-and-logistics": 46000,
  other: 25000,
});

const EVENT_COMPLEXITY_MULTIPLIER = Object.freeze({
  wedding: 1.25,
  engagement: 1.1,
  birthday: 0.85,
  corporate: 1,
  "private-party": 0.9,
  "cultural-event": 1.15,
  other: 1,
});

const roundCurrency = (value) => Math.round(Number(value || 0));

const getQuotationCatalog = () => ({
  packages: Object.entries(PACKAGE_PRICING).map(([key, value]) => ({
    key,
    label: value.label,
    basePrice: value.basePrice,
    guestRate: value.guestRate,
    serviceMultiplier: value.serviceMultiplier,
    serviceFeeRate: value.serviceFeeRate,
  })),
  services: Object.entries(SERVICE_PRICING).map(([key, basePrice]) => ({
    key,
    basePrice,
  })),
});

const validateQuotationPayload = (payload = {}) => {
  const packageTier = payload.packageTier || "signature";
  const discount = payload.discount === undefined || payload.discount === "" ? 0 : Number(payload.discount);

  if (!PACKAGE_PRICING[packageTier]) {
    throw createHttpError(400, "Package tier is invalid.");
  }

  if (!Number.isFinite(discount) || discount < 0) {
    throw createHttpError(400, "Discount must be a positive number.");
  }

  return {
    packageTier,
    discount: roundCurrency(discount),
    proposalNotes: payload.proposalNotes ? String(payload.proposalNotes).trim() : "",
    validDays: Number.isInteger(Number(payload.validDays)) ? Number(payload.validDays) : 14,
  };
};

const buildQuotationForBooking = ({ booking, packageTier, discount, proposalNotes, validDays }) => {
  const packageConfig = PACKAGE_PRICING[packageTier];
  const complexityMultiplier = EVENT_COMPLEXITY_MULTIPLIER[booking.eventType] || 1;
  const currency = booking.budget?.currency || "INR";

  const lineItems = [
    {
      label: `${packageConfig.label} planning package`,
      description: "Core planning, coordination, run-of-show preparation, and event oversight.",
      quantity: 1,
      unitPrice: roundCurrency(packageConfig.basePrice * complexityMultiplier),
      total: roundCurrency(packageConfig.basePrice * complexityMultiplier),
    },
    {
      label: "Guest experience planning",
      description: "Guest-count based planning coverage and coordination capacity.",
      quantity: booking.guestCount,
      unitPrice: packageConfig.guestRate,
      total: roundCurrency(booking.guestCount * packageConfig.guestRate),
    },
    ...booking.servicesRequested.map((service) => {
      const unitPrice = roundCurrency((SERVICE_PRICING[service] || SERVICE_PRICING.other) * packageConfig.serviceMultiplier);

      return {
        label: service
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" "),
        description: "Requested service estimate based on selected package tier.",
        quantity: 1,
        unitPrice,
        total: unitPrice,
      };
    }),
  ];

  const subtotal = roundCurrency(lineItems.reduce((sum, item) => sum + item.total, 0));
  const serviceFee = roundCurrency(subtotal * packageConfig.serviceFeeRate);
  const taxableAmount = Math.max(subtotal + serviceFee - discount, 0);
  const tax = roundCurrency(taxableAmount * 0.18);
  const total = roundCurrency(taxableAmount + tax);
  const validUntil = new Date(Date.now() + Math.max(validDays, 1) * 24 * 60 * 60 * 1000);

  return {
    packageTier,
    currency,
    subtotal,
    serviceFee,
    tax,
    discount,
    total,
    validUntil,
    proposalNotes:
      proposalNotes ||
      "Estimate generated from selected services, guest count, event type, and package tier. Final vendor costs may vary after consultation.",
    lineItems,
  };
};

const generateQuotationForBooking = async ({ bookingId, adminUserId, payload }) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw createHttpError(404, "Booking not found.");
  }

  const validatedPayload = validateQuotationPayload(payload);
  const quotation = buildQuotationForBooking({
    booking,
    ...validatedPayload,
  });

  booking.quotation = {
    ...quotation,
    generatedBy: adminUserId,
    generatedAt: new Date(),
  };

  if (
    [
      BOOKING_WORKFLOW_STATES.REQUEST_SUBMITTED,
      BOOKING_WORKFLOW_STATES.ADMIN_REVIEW,
      BOOKING_WORKFLOW_STATES.CONSULTATION_SCHEDULED,
      BOOKING_WORKFLOW_STATES.CONSULTATION_COMPLETED,
    ].includes(booking.workflowState)
  ) {
    booking.workflowState = BOOKING_WORKFLOW_STATES.QUOTE_GENERATED;
    booking.workflowStateUpdatedAt = new Date();
  }

  booking.workflowHistory.push(
    createWorkflowHistoryEntry({
      state: booking.workflowState,
      changedBy: adminUserId,
      note: `Quotation generated for ${quotation.currency} ${quotation.total}.`,
    })
  );

  await booking.save();

  const updatedBooking = await Booking.findById(booking._id).populate(getBookingPopulateOptions());
  return buildBookingResponse(updatedBooking);
};

module.exports = {
  generateQuotationForBooking,
  getQuotationCatalog,
};
