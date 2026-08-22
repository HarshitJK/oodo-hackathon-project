import { z } from "zod";

export const updatePayrollSchema = z.object({
  basicSalary: z.number().optional(),
  hra: z.number().optional(),
  specialAllowance: z.number().optional(),
  bonus: z.number().optional(),
  deductions: z.number().optional(),
  month: z.number().min(1).max(12).optional(),
  year: z.number().optional(),
});
