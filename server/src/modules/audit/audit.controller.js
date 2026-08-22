import AuditLog from "../../models/AuditLog.js";

export const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, module: mod, action, actorId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};
    if (mod) filter.module = mod;
    if (action) filter.action = { $regex: action, $options: "i" };
    if (actorId) filter.actor = actorId;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("actor", "firstName lastName employeeId loginId role department")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: "Audit logs retrieved successfully.",
      data: {
        logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
