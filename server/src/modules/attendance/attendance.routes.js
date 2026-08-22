import express from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import * as attendanceController from "./attendance.controller.js";
import { checkInSchema, checkOutSchema } from "./attendance.validation.js";

const router = express.Router();

router.use(verifyToken);

// Employee routes
router.post("/check-in", validate(checkInSchema), attendanceController.checkIn);
router.post("/check-out", validate(checkOutSchema), attendanceController.checkOut);
router.get("/me", attendanceController.getMyAttendance);
router.get("/today", attendanceController.getTodayAttendance);

// Admin / HR routes
router.get("/", requireRole("ADMIN", "HR"), attendanceController.getAllAttendance);
router.get("/:employeeId", requireRole("ADMIN", "HR"), attendanceController.getAttendanceByEmployeeId);

export default router;
