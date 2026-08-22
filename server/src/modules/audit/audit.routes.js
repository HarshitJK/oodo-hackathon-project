import express from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import * as auditController from "./audit.controller.js";

const router = express.Router();

router.use(verifyToken, requireRole("ADMIN"));

router.get("/", auditController.getAuditLogs);

export default router;
