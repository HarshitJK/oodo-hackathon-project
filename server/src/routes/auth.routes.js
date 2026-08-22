const express = require("express");
const router = express.Router();
const { signup, login, refresh, logout, verifyEmail, getMe } = require("../controllers/auth.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { z } = require("zod");

// ── Validation Schemas ──────────────────────────────────────────────────────

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  employeeId: z.string().min(1, "Employee ID is required"),
  department: z.string().optional(),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

// ── Routes ──────────────────────────────────────────────────────────────────

// Public routes (rate-limited at app level)
router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/verify-email", verifyEmail); // STUB

// Protected routes
router.get("/me", verifyToken, getMe);

module.exports = router;
