const AuditLog = require("../models/AuditLog");

/**
 * Creates an audit log entry in the database.
 *
 * Usage:
 *   await auditLogger({
 *     actorId: req.user._id,
 *     action: "LEAVE_APPROVED",
 *     targetId: leaveRequest._id,
 *     targetType: "LeaveRequest",
 *     metadata: { previousStatus: "pending", newStatus: "approved" },
 *     ipAddress: req.ip,
 *   });
 *
 * This function swallows errors so that a logging failure never breaks
 * the main request flow. Errors are printed to console.
 *
 * @param {Object} options
 * @param {import("mongoose").Types.ObjectId} options.actorId
 * @param {string} options.action
 * @param {import("mongoose").Types.ObjectId} [options.targetId]
 * @param {string} [options.targetType]
 * @param {Object} [options.metadata]
 * @param {string} [options.ipAddress]
 */
const auditLogger = async ({
  actorId,
  action,
  targetId = null,
  targetType = null,
  metadata = {},
  ipAddress = "",
}) => {
  try {
    await AuditLog.create({
      actorId,
      action,
      targetId,
      targetType,
      metadata,
      ipAddress,
      timestamp: new Date(),
    });
  } catch (err) {
    // Log failure should NEVER crash the main request
    console.error("⚠️  AuditLog write failed:", err.message);
  }
};

module.exports = { auditLogger };
