import express from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import * as dashboardController from "./dashboard.controller.js";

const router = express.Router();

router.use(verifyToken);

router.get("/employee", dashboardController.getEmployeeDashboard);
router.get("/admin", requireRole("ADMIN", "HR"), dashboardController.getAdminDashboard);

export default router;
