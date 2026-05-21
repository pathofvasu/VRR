const jwt = require("jsonwebtoken");

const env = require("../config/env");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const createHttpError = require("../utils/createHttpError");

const protect = asyncHandler(async (req, _res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    throw createHttpError(401, "Authorization token is required.");
  }

  const token = authorizationHeader.split(" ")[1];

  let decodedToken;

  try {
    decodedToken = jwt.verify(token, env.jwtSecret);
  } catch (_error) {
    throw createHttpError(401, "Invalid or expired authorization token.");
  }

  const user = await User.findById(decodedToken.sub);

  if (!user) {
    throw createHttpError(401, "The user linked to this token no longer exists.");
  }

  req.user = user;
  next();
});

const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(createHttpError(401, "Authentication is required before role checks."));
  }

  if (!roles.includes(req.user.role)) {
    return next(createHttpError(403, "You do not have permission to access this resource."));
  }

  return next();
};

module.exports = {
  protect,
  authorize,
};
