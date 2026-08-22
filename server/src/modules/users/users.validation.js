import { z } from "zod";

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dob: z.string().optional(),
  address: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  manager: z.string().optional().nullable(),
  joiningDate: z.string().min(1, "Joining date is required"),
  role: z.enum(["ADMIN", "HR", "EMPLOYEE"]).default("EMPLOYEE"),
  basicSalary: z.number().optional().default(0),
  hra: z.number().optional().default(0),
  specialAllowance: z.number().optional().default(0),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dob: z.string().optional(),
  address: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  manager: z.string().optional().nullable(),
  joiningDate: z.string().optional(),
  role: z.enum(["ADMIN", "HR", "EMPLOYEE"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const updateProfileSchema = z.object({
  phone: z.string().optional(),
  address: z.string().optional(),
  profileImage: z.string().optional(),
});
