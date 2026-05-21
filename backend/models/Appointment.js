const mongoose = require("mongoose");

const appointmentTypeOptions = [
  "consultation",
  "planning-review",
  "vendor-review",
  "venue-visit",
  "final-briefing",
  "other",
];

const appointmentModeOptions = ["video-call", "phone-call", "in-person"];
const appointmentStatusOptions = ["scheduled", "rescheduled", "cancelled", "completed"];

const appointmentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    scheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 140,
    },
    appointmentType: {
      type: String,
      enum: appointmentTypeOptions,
      default: "consultation",
    },
    startAt: {
      type: Date,
      required: true,
      index: true,
    },
    endAt: {
      type: Date,
      required: true,
      index: true,
    },
    mode: {
      type: String,
      enum: appointmentModeOptions,
      default: "video-call",
    },
    location: {
      type: String,
      trim: true,
      maxlength: 220,
    },
    meetingLink: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    status: {
      type: String,
      enum: appointmentStatusOptions,
      default: "scheduled",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

appointmentSchema.index({ organizer: 1, startAt: 1, endAt: 1 });
appointmentSchema.index({ client: 1, startAt: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
