import express from "express";
import { verifyToken } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { upload } from "../../middleware/upload.middleware.js";
import * as usersController from "./users.controller.js";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  updateProfileSchema,
} from "./users.validation.js";

const router = express.Router();

router.use(verifyToken);

// Employee own profile
router.get("/me", usersController.getMe);
router.patch("/me", upload.single("profileImage"), validate(updateProfileSchema), usersController.updateMe);

// Admin & HR management routes
router.post("/", requireRole("ADMIN", "HR"), validate(createEmployeeSchema), usersController.createEmployee);
router.get("/", requireRole("ADMIN", "HR"), usersController.getEmployees);
router.get("/:id", requireRole("ADMIN", "HR"), usersController.getEmployeeById);
router.patch("/:id", requireRole("ADMIN", "HR"), validate(updateEmployeeSchema), usersController.updateEmployee);
router.delete("/:id", requireRole("ADMIN", "HR"), usersController.softDeleteEmployee);

export default router;
