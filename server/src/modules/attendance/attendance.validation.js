import { z } from "zod";

export const checkInSchema = z.object({
  token: z.string().optional(),
  notes: z.string().optional(),
});

export const checkOutSchema = z.object({
  notes: z.string().optional(),
});

export const attendanceQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "LEAVE"]).optional(),
  period: z.enum(["daily", "weekly", "monthly"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  employeeId: z.string().optional(),
});
