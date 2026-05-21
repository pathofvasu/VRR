const jwt = require("jsonwebtoken");

const env = require("../config/env");

const generateAuthToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
    }
  );

const buildAuthResponse = (user, token) => ({
  token,
  user: user.toSafeObject(),
});

module.exports = {
  generateAuthToken,
  buildAuthResponse,
};
