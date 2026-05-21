const User = require("../models/User");
const { generateAuthToken, buildAuthResponse } = require("../services/authService");
const asyncHandler = require("../utils/asyncHandler");
const createHttpError = require("../utils/createHttpError");
const { isValidEmail, isValidPassword, normalizeEmail } = require("../utils/validators");

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw createHttpError(400, "Name, email, and password are required.");
  }

  if (!isValidEmail(email)) {
    throw createHttpError(400, "Please provide a valid email address.");
  }

  if (!isValidPassword(password)) {
    throw createHttpError(
      400,
      "Password must be at least 8 characters long and include at least one letter and one number."
    );
  }

  const normalizedEmail = normalizeEmail(email);
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw createHttpError(409, "An account with this email already exists.");
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: "client",
  });

  const token = generateAuthToken(user);

  res.status(201).json({
    success: true,
    message: "Account created successfully.",
    data: buildAuthResponse(user, token),
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw createHttpError(400, "Email and password are required.");
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  if (!user) {
    throw createHttpError(401, "Invalid email or password.");
  }

  const passwordMatches = await user.comparePassword(password);

  if (!passwordMatches) {
    throw createHttpError(401, "Invalid email or password.");
  }

  const token = generateAuthToken(user);

  res.status(200).json({
    success: true,
    message: "Login successful.",
    data: buildAuthResponse(user, token),
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Authenticated user profile fetched successfully.",
    data: {
      user: req.user.toSafeObject(),
    },
  });
});

module.exports = {
  register,
  login,
  getCurrentUser,
};
