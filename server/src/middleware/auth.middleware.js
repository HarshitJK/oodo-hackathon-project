const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Verifies the JWT access token from the Authorization header.
 * Attaches the decoded user payload to req.user.
 *
 * Header format: Authorization: Bearer <token>
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired.",
          code: "TOKEN_EXPIRED", // Client uses this code to trigger silent refresh
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    // Optionally verify user still exists in DB (guards against deleted accounts)
    const user = await User.findById(decoded.userId).select("-passwordHash -refreshToken");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }

    req.user = user; // { _id, employeeId, name, email, role, department, ... }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { verifyToken };
