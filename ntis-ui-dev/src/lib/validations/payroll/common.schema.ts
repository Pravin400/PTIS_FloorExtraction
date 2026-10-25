import { z } from 'zod';

export const payrollMasterQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().optional(),
  status: z.enum(['all', 'active', 'inactive']).optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type PayrollMasterQueryParams = z.infer<typeof payrollMasterQuerySchema>;
