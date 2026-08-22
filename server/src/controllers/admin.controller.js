const User = require("../models/User");
const Attendance = require("../models/Attendance");
const LeaveRequest = require("../models/LeaveRequest");
const AuditLog = require("../models/AuditLog");

// ─────────────────────────────────────────────
// GET /api/admin/stats
// Returns dashboard summary stats for admin panel
// ─────────────────────────────────────────────
const getDashboardStats = async (req, res, next) => {
  try {
    // TODO: Add caching (e.g., Redis or in-memory TTL cache) for performance
    const [totalEmployees, pendingLeaves, todayAttendanceCount, recentLogs] = await Promise.all([
      User.countDocuments({ role: "employee" }),
      LeaveRequest.countDocuments({ status: "pending" }),
      Attendance.countDocuments({
        date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
        status: "present",
      }),
      AuditLog.find().sort({ timestamp: -1 }).limit(10).populate("actorId", "name employeeId"),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalEmployees,
          pendingLeaves,
          todayAttendanceCount,
        },
        recentActivity: recentLogs,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/analytics/attendance
// Returns attendance trend data for the past N days (for Recharts)
// Query: ?days=30
// ─────────────────────────────────────────────
const getAttendanceAnalytics = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    // TODO: Aggregate by date for a line chart:
    // [{ date: "2024-01-15", present: 42, absent: 5, halfDay: 3 }, ...]
    const trend = await Attendance.aggregate([
      { $match: { date: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
          halfDay: { $sum: { $cond: [{ $eq: ["$status", "half-day"] }, 1, 0] } },
          onLeave: { $sum: { $cond: [{ $eq: ["$status", "leave"] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", present: 1, absent: 1, halfDay: 1, onLeave: 1 } },
    ]);

    res.status(200).json({ success: true, data: { trend } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/analytics/leave
// Returns leave breakdown by type (for pie chart)
// ─────────────────────────────────────────────
const getLeaveAnalytics = async (req, res, next) => {
  try {
    // TODO: Breakdown by month, department, etc.
    const breakdown = await LeaveRequest.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, type: "$_id", count: 1 } },
    ]);

    const statusBreakdown = await LeaveRequest.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", count: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: { byType: breakdown, byStatus: statusBreakdown },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/payroll
// STUB: Returns salary data for employees (admin only)
// ─────────────────────────────────────────────
const getPayroll = async (req, res, next) => {
  try {
    // TODO: Implement full payroll calculation logic:
    // - Base salary from User.salary
    // - Deductions for absences
    // - Leave pay based on type (paid/unpaid/sick)
    // - Overtime calculations

    const employees = await User.find({ role: "employee" })
      .select("+salary name employeeId department jobTitle")
      .sort({ department: 1 });

    const payrollData = employees.map((emp) => ({
      employeeId: emp.employeeId,
      name: emp.name,
      department: emp.department,
      jobTitle: emp.jobTitle,
      baseSalary: emp.salary || 0,
      // TODO: deductions, netPay, payPeriod
      deductions: 0,
      netPay: emp.salary || 0,
      payPeriod: new Date().toISOString().slice(0, 7), // "YYYY-MM"
    }));

    res.status(200).json({ success: true, data: { payroll: payrollData } });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/audit-logs
// Admin only: view all audit logs
// Query: ?actorId=&action=&page=&limit=
// ─────────────────────────────────────────────
const getAuditLogs = async (req, res, next) => {
  try {
    const { actorId, action, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (actorId) filter.actorId = actorId;
    if (action) filter.action = { $regex: action, $options: "i" };

    const logs = await AuditLog.find(filter)
      .populate("actorId", "name employeeId role")
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await AuditLog.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAttendanceAnalytics,
  getLeaveAnalytics,
  getPayroll,
  getAuditLogs,
};
