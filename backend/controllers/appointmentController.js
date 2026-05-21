const asyncHandler = require("../utils/asyncHandler");
const createHttpError = require("../utils/createHttpError");
const {
  createAppointment,
  getAppointmentCatalog,
  listAppointments,
  updateAppointmentStatus,
} = require("../services/appointmentService");

const getAppointments = asyncHandler(async (req, res) => {
  const appointments = await listAppointments(req.user);

  res.status(200).json({
    success: true,
    message: "Appointments fetched successfully.",
    data: {
      appointments,
    },
  });
});

const scheduleAppointment = asyncHandler(async (req, res) => {
  const appointment = await createAppointment({
    user: req.user,
    payload: req.body,
  });

  res.status(201).json({
    success: true,
    message: "Appointment scheduled successfully.",
    data: {
      appointment,
    },
  });
});

const patchAppointmentStatus = asyncHandler(async (req, res) => {
  if (!req.body.status) {
    throw createHttpError(400, "Appointment status is required.");
  }

  const appointment = await updateAppointmentStatus({
    user: req.user,
    appointmentId: req.params.appointmentId,
    status: req.body.status,
  });

  res.status(200).json({
    success: true,
    message: "Appointment status updated successfully.",
    data: {
      appointment,
    },
  });
});

const getAppointmentSchedulingCatalog = asyncHandler(async (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Appointment scheduling catalog fetched successfully.",
    data: getAppointmentCatalog(),
  });
});

module.exports = {
  getAppointments,
  scheduleAppointment,
  patchAppointmentStatus,
  getAppointmentSchedulingCatalog,
};
