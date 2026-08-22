import express from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import * as payrollController from "./payroll.controller.js";
import { updatePayrollSchema } from "./payroll.validation.js";

const router = express.Router();

router.use(verifyToken);

// Employee read-only
router.get("/me", payrollController.getMyPayroll);

// Admin & HR
router.get("/", requireRole("ADMIN", "HR"), payrollController.getAllPayroll);
router.patch("/:employeeId", requireRole("ADMIN", "HR"), validate(updatePayrollSchema), payrollController.updatePayroll);

export default router;
