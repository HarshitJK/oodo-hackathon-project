import express from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../../middleware/validate.middleware.js";
import { verifyToken } from "../../middleware/auth.middleware.js";
import * as authController from "./auth.controller.js";
import {
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.validation.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many authentication requests, please try again after 15 minutes.",
    errors: [],
  },
});

router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/change-password", verifyToken, validate(changePasswordSchema), authController.changePassword);
router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.post("/refresh", authController.refresh);
router.post("/logout", verifyToken, authController.logout);
router.get("/me", verifyToken, authController.getMe);

export default router;
