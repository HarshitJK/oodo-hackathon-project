import User from "../../models/User.js";
import Attendance from "../../models/Attendance.js";
import LeaveRequest from "../../models/LeaveRequest.js";
import Payroll from "../../models/Payroll.js";

const getStartOfDay = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfDay = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

export const getEmployeeDashboard = async (userId) => {
  const startOfDay = getStartOfDay();
  const endOfDay = getEndOfDay();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [profile, todayAttendance, recentLeaveRequests, currentPayroll, leaveStats] = await Promise.all([
    User.findById(userId).select("-passwordHash -refreshToken").populate("manager", "firstName lastName employeeId email"),
    Attendance.findOne({
      employee: userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    }),
    LeaveRequest.find({ employee: userId }).sort({ createdAt: -1 }).limit(5),
    Payroll.findOne({ employee: userId, month: currentMonth, year: currentYear }),
    LeaveRequest.aggregate([
      { $match: { employee: userId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const leaveBalance = {
    totalApplied: recentLeaveRequests.length,
    approved: leaveStats.find((s) => s._id === "APPROVED")?.count || 0,
    pending: leaveStats.find((s) => s._id === "PENDING")?.count || 0,
    rejected: leaveStats.find((s) => s._id === "REJECTED")?.count || 0,
  };

  return {
    profile,
    todayAttendance,
    leaveBalance,
    recentLeaveRequests,
    currentPayroll,
  };
};

export const getAdminDashboard = async () => {
  const startOfDay = getStartOfDay();
  const endOfDay = getEndOfDay();

  const [
    totalEmployees,
    activeEmployees,
    presentToday,
    halfDayToday,
    pendingLeaveRequests,
    departmentDistribution,
    recentEmployees,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: "ACTIVE" }),
    Attendance.countDocuments({
      date: { $gte: startOfDay, $lte: endOfDay },
      status: "PRESENT",
    }),
    Attendance.countDocuments({
      date: { $gte: startOfDay, $lte: endOfDay },
      status: "HALF_DAY",
    }),
    LeaveRequest.countDocuments({ status: "PENDING" }),
    User.aggregate([
      { $match: { status: "ACTIVE" } },
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, department: "$_id", count: 1 } },
      { $sort: { count: -1 } },
    ]),
    User.find({ status: "ACTIVE" })
      .select("-passwordHash -refreshToken")
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  const absentToday = Math.max(0, activeEmployees - (presentToday + halfDayToday));

  return {
    totalEmployees,
    activeEmployees,
    presentToday,
    halfDayToday,
    absentToday,
    pendingLeaveRequests,
    departmentDistribution,
    recentEmployees,
  };
};
