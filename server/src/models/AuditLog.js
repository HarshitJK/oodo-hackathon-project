const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      // e.g. "USER_CREATED", "LEAVE_APPROVED", "ATTENDANCE_CHECKED_IN"
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    targetType: {
      type: String,
      default: null,
      // e.g. "User", "LeaveRequest", "Attendance"
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // Arbitrary key-value pairs for additional context
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      default: "",
    },
  },
  {
    // No timestamps here; we use our own timestamp field
    versionKey: false,
  }
);

// TTL index — auto-delete logs older than 90 days (optional, remove if you want permanent logs)
// auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
