const express = require("express");
const router = express.Router();
const {
  checkIn,
  checkOut,
  getAttendance,
  getTodayAttendance,
  updateAttendance,
} = require("../controllers/attendance.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");

// All attendance routes require authentication
router.use(verifyToken);

// GET /api/attendance/today — Own today's record
router.get("/today", getTodayAttendance);

// POST /api/attendance/check-in — Any authenticated user
router.post("/check-in", checkIn);

// POST /api/attendance/check-out — Any authenticated user
router.post("/check-out", checkOut);

// GET /api/attendance — Scoped in controller (employee=own, admin/manager=all)
router.get("/", getAttendance);

// PATCH /api/attendance/:id — Admin/Manager: manually correct record
router.patch("/:id", requireRole("admin", "manager"), updateAttendance);

module.exports = router;
