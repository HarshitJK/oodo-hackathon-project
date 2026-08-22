import express from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import usersRoutes from "../modules/users/users.routes.js";
import attendanceRoutes from "../modules/attendance/attendance.routes.js";
import leaveRoutes from "../modules/leave/leave.routes.js";
import payrollRoutes from "../modules/payroll/payroll.routes.js";
import dashboardRoutes from "../modules/dashboard/dashboard.routes.js";
import notificationsRoutes from "../modules/notifications/notifications.routes.js";
import auditRoutes from "../modules/audit/audit.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/leave", leaveRoutes);
router.use("/payroll", payrollRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/audit", auditRoutes);

export default router;
