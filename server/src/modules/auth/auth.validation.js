import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or Login ID is required"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters long"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Valid email address is required"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters long"),
});
