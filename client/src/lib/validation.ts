import { z } from "zod";

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or Login ID is required"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

// ─── Leave Request Schema ─────────────────────────────────────────────────────

export const leaveRequestSchema = z.object({
  leaveType: z.enum(["PAID", "SICK", "UNPAID"], {
    required_error: "Please select a leave type",
  }),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  remarks: z.string().max(500, "Remarks cannot exceed 500 characters").optional(),
});

// ─── Employee Schema ──────────────────────────────────────────────────────────

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  department: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  joiningDate: z.string().min(1, "Joining date is required"),
  role: z.enum(["ADMIN", "HR", "EMPLOYEE"]).default("EMPLOYEE"),
  basicSalary: z.number().min(0).default(0),
  hra: z.number().min(0).default(0),
  specialAllowance: z.number().min(0).default(0),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type LoginFormData = z.infer<typeof loginSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;
export type CreateEmployeeFormData = z.infer<typeof createEmployeeSchema>;
