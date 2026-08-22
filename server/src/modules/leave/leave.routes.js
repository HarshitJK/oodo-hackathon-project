import express from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { upload } from "../../middleware/upload.middleware.js";
import * as leaveController from "./leave.controller.js";
import { applyLeaveSchema, rejectLeaveSchema } from "./leave.validation.js";

const router = express.Router();

router.use(verifyToken);

// Employee routes
router.post("/", upload.single("attachment"), validate(applyLeaveSchema), leaveController.applyLeave);
router.get("/me", leaveController.getMyLeaves);

// Admin / HR routes
router.get("/", requireRole("ADMIN", "HR"), leaveController.getAllLeaves);
router.patch("/:id/approve", requireRole("ADMIN", "HR"), leaveController.approveLeave);
router.patch("/:id/reject", requireRole("ADMIN", "HR"), validate(rejectLeaveSchema), leaveController.rejectLeave);

export default router;
