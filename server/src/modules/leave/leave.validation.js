import { z } from "zod";

export const applyLeaveSchema = z.object({
  leaveType: z.enum(["PAID", "SICK", "UNPAID"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  remarks: z.string().optional(),
  attachment: z.string().optional(),
});

export const rejectLeaveSchema = z.object({
  comment: z.string().min(1, "Rejection comment is required"),
});
