/**
 * Global Express error handler middleware.
 * Must be registered LAST in the Express middleware chain (after all routes).
 *
 * Catches errors passed via next(err) from controllers/middleware.
 */
const errorHandler = (err, req, res, next) => {
  // Log the full error in development
  if (process.env.NODE_ENV !== "production") {
    console.error("❌ Error:", err);
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // Mongoose Duplicate Key Error (e.g., unique email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `Duplicate value for field: ${field}. This ${field} is already in use.`,
    });
  }

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(422).json({
      success: false,
      message: "Mongoose validation failed.",
      errors,
    });
  }

  // JWT Errors (should be caught in middleware, but just in case)
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ success: false, message: "Invalid token." });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ success: false, message: "Token expired.", code: "TOKEN_EXPIRED" });
  }

  // Default: Internal Server Error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error.",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
