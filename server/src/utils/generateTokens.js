const jwt = require("jsonwebtoken");

/**
 * Generates a short-lived access token and a long-lived refresh token.
 *
 * @param {Object} payload - Data to embed in the token.
 * @param {string} payload.userId - MongoDB ObjectId of the user.
 * @param {string} payload.role  - User role (employee | manager | admin).
 * @returns {{ accessToken: string, refreshToken: string }}
 */
const generateTokens = (payload) => {
  const { userId, role } = payload;

  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

/**
 * Verifies a refresh token and returns its decoded payload.
 *
 * @param {string} token - The refresh token string.
 * @returns {Object} Decoded payload with { userId }
 * @throws {Error} If token is invalid or expired.
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = { generateTokens, verifyRefreshToken };
