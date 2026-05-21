const mongoose = require("mongoose");

const { BOOKING_WORKFLOW_SEQUENCE, BOOKING_WORKFLOW_STATES } = require("../utils/bookingWorkflow");

const serviceOptions = [
  "planning-and-coordination",
  "venue-sourcing",
  "decor-and-styling",
  "guest-management",
  "vendor-management",
  "catering-curation",
  "entertainment-and-stage",
  "photography-and-film",
  "hospitality-and-logistics",
  "other",
];

const eventTypeOptions = [
  "wedding",
  "engagement",
  "birthday",
  "corporate",
  "private-party",
  "cultural-event",
  "other",
];

const locationSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    venueName: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    venueAddress: {
      type: String,
      trim: true,
      maxlength: 240,
    },
  },
  {
    _id: false,
  }
);

const budgetSchema = new mongoose.Schema(
  {
    currency: {
      type: String,
      default: "INR",
      trim: true,
      uppercase: true,
      maxlength: 6,
    },
    minimum: {
      type: Number,
      min: 0,
    },
    maximum: {
      type: Number,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 240,
    },
  },
  {
    _id: false,
  }
);

const quotationLineItemSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 260,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const quotationSchema = new mongoose.Schema(
  {
    packageTier: {
      type: String,
      enum: ["essential", "signature", "luxury"],
      default: "signature",
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
      uppercase: true,
      maxlength: 6,
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    serviceFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      default: 0,
      min: 0,
    },
    validUntil: {
      type: Date,
    },
    proposalNotes: {
      type: String,
      trim: true,
      maxlength: 1600,
    },
    lineItems: {
      type: [quotationLineItemSchema],
      default: [],
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    generatedAt: {
      type: Date,
    },
  },
  {
    _id: false,
  }
);

const agreementSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["generated", "confirmed"],
      default: "generated",
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    fileName: {
      type: String,
      trim: true,
      maxlength: 180,
    },
    filePath: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    generatedAt: {
      type: Date,
    },
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    confirmedAt: {
      type: Date,
    },
  },
  {
    _id: false,
  }
);

const consultationPreferenceSchema = new mongoose.Schema(
  {
    requested: {
      type: Boolean,
      default: true,
    },
    preferredDate: {
      type: Date,
    },
    preferredTimeSlot: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    preferredMode: {
      type: String,
      enum: ["video-call", "phone-call", "in-person", "flexible"],
      default: "flexible",
    },
  },
  {
    _id: false,
  }
);

const workflowHistorySchema = new mongoose.Schema(
  {
    state: {
      type: String,
      enum: BOOKING_WORKFLOW_SEQUENCE,
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 240,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assignedOrganizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    eventTitle: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    eventType: {
      type: String,
      required: true,
      enum: eventTypeOptions,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    guestCount: {
      type: Number,
      required: true,
      min: 1,
      max: 100000,
    },
    location: {
      type: locationSchema,
      required: true,
    },
    budget: {
      type: budgetSchema,
      default: () => ({
        currency: "INR",
      }),
    },
    quotation: {
      type: quotationSchema,
      default: null,
    },
    agreement: {
      type: agreementSchema,
      default: null,
    },
    servicesRequested: {
      type: [String],
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one requested service is required.",
      },
      enum: serviceOptions,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    consultationPreference: {
      type: consultationPreferenceSchema,
      default: () => ({
        requested: true,
        preferredMode: "flexible",
      }),
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    workflowState: {
      type: String,
      enum: BOOKING_WORKFLOW_SEQUENCE,
      default: BOOKING_WORKFLOW_STATES.REQUEST_SUBMITTED,
      index: true,
    },
    workflowHistory: {
      type: [workflowHistorySchema],
      default: [],
    },
    workflowStateUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

bookingSchema.index({ client: 1, createdAt: -1 });
bookingSchema.index({ workflowState: 1, eventDate: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
