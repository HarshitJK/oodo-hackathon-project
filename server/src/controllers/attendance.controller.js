const Attendance = require("../models/Attendance");
const { getIO } = require("../sockets");
const { auditLogger } = require("../utils/auditLogger");

// ─────────────────────────────────────────────
// POST /api/attendance/check-in
// Employee checks in for the day
// ─────────────────────────────────────────────
const checkIn = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Prevent double check-in on the same day
    const existing = await Attendance.findOne({ userId, date: today });
    if (existing && existing.checkIn) {
      return res.status(409).json({
        success: false,
        message: "You have already checked in today.",
      });
    }

    // TODO: Implement late check-in threshold (e.g., after 9:30 AM = half-day)
    const record = await Attendance.findOneAndUpdate(
      { userId, date: today },
      {
        $set: {
          checkIn: new Date(),
          status: "present",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Emit real-time event to all connected clients
    try {
      getIO().emit("attendance:new", {
        type: "check-in",
        userId: userId.toString(),
        record,
      });
    } catch {
      // Socket not initialized — non-fatal
    }

    await auditLogger({
      actorId: userId,
      action: "ATTENDANCE_CHECKED_IN",
      targetId: record._id,
      targetType: "Attendance",
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, message: "Checked in successfully.", data: { record } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// POST /api/attendance/check-out
// Employee checks out for the day
// ─────────────────────────────────────────────
const checkOut = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await Attendance.findOne({ userId, date: today });
    if (!record || !record.checkIn) {
      return res.status(400).json({ success: false, message: "You have not checked in today." });
    }
    if (record.checkOut) {
      return res.status(409).json({ success: false, message: "You have already checked out today." });
    }

    record.checkOut = new Date();
    // TODO: Calculate hours worked; set status to "half-day" if < 4 hrs
    await record.save();

    try {
      getIO().emit("attendance:new", {
        type: "check-out",
        userId: userId.toString(),
        record,
      });
    } catch {}

    await auditLogger({
      actorId: userId,
      action: "ATTENDANCE_CHECKED_OUT",
      targetId: record._id,
      targetType: "Attendance",
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, message: "Checked out successfully.", data: { record } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// GET /api/attendance
// Employee: own records. Admin/Manager: all records (with filters)
// Query params: ?userId=&startDate=&endDate=&status=&page=&limit=
// ─────────────────────────────────────────────
const getAttendance = async (req, res, next) => {
  try {
    const { startDate, endDate, status, page = 1, limit = 30 } = req.query;
    let { userId } = req.query;

    // Scope: employees can only see their own records
    if (req.user.role === "employee") {
      userId = req.user._id.toString();
    }

    const filter = {};
    if (userId) filter.userId = userId;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // TODO: Populate userId with name/employeeId for admin views
    const records = await Attendance.find(filter)
      .populate("userId", "name employeeId department")
      .sort({ date: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Attendance.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        records,
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// GET /api/attendance/today
// Returns today's attendance record for the authenticated user
// ─────────────────────────────────────────────
const getTodayAttendance = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await Attendance.findOne({ userId: req.user._id, date: today });

    res.status(200).json({
      success: true,
      data: { record: record || null },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// PATCH /api/attendance/:id  (Admin only)
// Manually correct an attendance record
// ─────────────────────────────────────────────
const updateAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    // TODO: Validate allowed fields; prevent updating userId/date
    const { checkIn, checkOut, status, notes } = req.body;

    const record = await Attendance.findByIdAndUpdate(
      id,
      { $set: { checkIn, checkOut, status, notes } },
      { new: true, runValidators: true }
    );

    if (!record) {
      return res.status(404).json({ success: false, message: "Attendance record not found." });
    }

    await auditLogger({
      actorId: req.user._id,
      action: "ATTENDANCE_MANUALLY_UPDATED",
      targetId: record._id,
      targetType: "Attendance",
      metadata: { updatedFields: Object.keys(req.body) },
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, data: { record } });
  } catch (error) {
    next(error);
  }
};

module.exports = { checkIn, checkOut, getAttendance, getTodayAttendance, updateAttendance };
