import AuditLog from "../models/AuditLog.js";

export const auditLogger = async ({
  actorId,
  action,
  module,
  targetId = null,
  targetType = null,
  metadata = {},
  ipAddress = "",
}) => {
  try {
    if (!actorId || !action || !module) return;
    await AuditLog.create({
      actor: actorId,
      action,
      module,
      targetId,
      targetType,
      metadata,
      ipAddress,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("⚠️ AuditLog write failed:", err.message);
  }
};
