import { z } from 'zod';

/**
 * Zod schema for Tax Zoning form data validation.
 * Used to ensure data integrity before API submission.
 */
export const taxZoningSchema = z.object({
  taxZoneId: z.number().min(1, "taxZoneRequired"),
  
  wardId: z.number().min(1, "wardRequired"),
  
  propertyNo: z.string().optional().default(""),
  fromProperty: z.string().optional().default(""),
  toProperty: z.string().optional().default(""),
  isActive: z.boolean().default(true),
  updatedBy: z.number().optional().default(1),
  propertyId: z.number().optional().default(0),
});

export type TaxZoningInput = z.infer<typeof taxZoningSchema>;
