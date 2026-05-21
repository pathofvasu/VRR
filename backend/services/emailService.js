const nodemailer = require("nodemailer");

const env = require("../config/env");

let transporter = null;

const isEmailConfigured = () => Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);

const getTransporter = () => {
  if (!isEmailConfigured()) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
    });
  }

  return transporter;
};

const sendEmail = async ({ to, subject, text }) => {
  const activeTransporter = getTransporter();

  if (!activeTransporter) {
    return {
      skipped: true,
      reason: "SMTP is not configured.",
    };
  }

  await activeTransporter.sendMail({
    from: env.smtp.from,
    to,
    subject,
    text,
  });

  return {
    skipped: false,
  };
};

module.exports = {
  isEmailConfigured,
  sendEmail,
};
