const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getAttendanceAnalytics,
  getLeaveAnalytics,
  getPayroll,
  getAuditLogs,
} = require("../controllers/admin.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");

// All admin routes require authentication + admin role
router.use(verifyToken);
router.use(requireRole("admin"));

// GET /api/admin/stats
router.get("/stats", getDashboardStats);

// GET /api/admin/analytics/attendance?days=30
router.get("/analytics/attendance", getAttendanceAnalytics);

// GET /api/admin/analytics/leave
router.get("/analytics/leave", getLeaveAnalytics);

// GET /api/admin/payroll
router.get("/payroll", getPayroll);

// GET /api/admin/audit-logs
router.get("/audit-logs", getAuditLogs);

module.exports = router;
