const mongoose = require("mongoose");

const notificationTypeOptions = [
  "appointment_scheduled",
  "appointment_status_updated",
  "appointment_reminder",
  "booking_workflow_updated",
  "agreement_confirmed",
  "general",
];

const notificationChannelOptions = ["in_app", "email"];
const notificationStatusOptions = ["pending", "sent", "failed", "read"];

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
      index: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: notificationTypeOptions,
      default: "general",
      index: true,
    },
    channel: {
      type: String,
      enum: notificationChannelOptions,
      default: "in_app",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1200,
    },
    status: {
      type: String,
      enum: notificationStatusOptions,
      default: "pending",
      index: true,
    },
    scheduledFor: {
      type: Date,
      default: Date.now,
      index: true,
    },
    sentAt: {
      type: Date,
    },
    readAt: {
      type: Date,
    },
    failureReason: {
      type: String,
      trim: true,
      maxlength: 600,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ channel: 1, status: 1, scheduledFor: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
