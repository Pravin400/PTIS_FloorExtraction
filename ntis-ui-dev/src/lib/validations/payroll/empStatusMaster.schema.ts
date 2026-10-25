import { z } from 'zod';
import type { EmpStatusMasterItem } from '@/types/payroll/MasterModule';

const defaultValidationMessages = {
  statusCodeRequired: 'Employee Status Code is required.',
  statusCodeMinLength: 'Employee Status Code must be at least 5 characters.',
  statusCodeLettersOnly: 'Status Code must contain letters, hyphens, and underscores only.',
  statusCodeDuplicate: 'This Status Code already exists. Codes must be unique.',
  statusNameRequired: 'Employee Status Name is required.',
  statusNameLettersOnly: 'Status Name cannot contain numbers (letters only).',
  statusNameDuplicate: 'An employee status with this name already exists for this code.',
  statusNameMarathiRequired: 'Employee Status Name (Regional) is required.',
  statusNameMarathiNoNumbers: 'Status in regional language cannot contain numbers.',
} as const;

export type EmpStatusValidationKey = keyof typeof defaultValidationMessages;
export type EmpStatusTranslator = (key: string) => string;

export interface EmpStatusSchemaOptions {
  t?: EmpStatusTranslator;
  existingItems?: EmpStatusMasterItem[];
  existingCodes?: string[];
  initialItem?: EmpStatusMasterItem | null;
}

export function createEmpStatusSchema(options: EmpStatusSchemaOptions = {}) {
  const { t, existingItems, existingCodes, initialItem } = options;

  const getMsg = (key: EmpStatusValidationKey): string => {
    if (t) {
      try {
        const val = t(`drawer.validation.${key}`);
        if (val && !val.includes('drawer.validation.')) return val;
      } catch {
        // fallback
      }
      try {
        const val = t(`validation.${key}`);
        if (val && !val.includes('validation.')) return val;
      } catch {
        // fallback
      }
      try {
        const val = t(key);
        if (val && val !== key) return val;
      } catch {
        // fallback
      }
    }
    return defaultValidationMessages[key];
  };

  return z
    .object({
      employeeStatusCode: z
        .string()
        .trim()
        .min(1, { message: getMsg('statusCodeRequired') })
        .min(5, { message: getMsg('statusCodeMinLength') })
        .regex(/^[A-Za-z_-]+$/, { message: getMsg('statusCodeLettersOnly') }),
      employeeStatus: z
        .string()
        .trim()
        .min(1, { message: getMsg('statusNameRequired') })
        .refine((val) => !/\d/.test(val), { message: getMsg('statusNameLettersOnly') }),
      employeeStatusMarathi: z
        .string()
        .trim()
        .min(1, { message: getMsg('statusNameMarathiRequired') })
        .refine((val) => !/[\d\u0966-\u096F]/.test(val), { message: getMsg('statusNameMarathiNoNumbers') }),
      description: z.string().max(250).optional().default(''),
      isActive: z.boolean().default(true),
    })
    .superRefine((data, ctx) => {
      const code = data.employeeStatusCode.trim().toUpperCase();
      const name = data.employeeStatus.trim().toLowerCase();

      // Check code uniqueness
      const isCodeDuplicate =
        (existingCodes &&
          existingCodes.some(
            (c) => c.toUpperCase() === code && c.toUpperCase() !== initialItem?.employeeStatusCode.toUpperCase()
          )) ||
        (existingItems &&
          existingItems.some(
            (item) => item.employeeStatusCode.toUpperCase() === code && item.employeeStatusId !== initialItem?.employeeStatusId
          ));

      if (isCodeDuplicate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: getMsg('statusCodeDuplicate'),
          path: ['employeeStatusCode'],
        });
      }

      // Check name uniqueness under same code
      if (existingItems && code && name) {
        const isNameDuplicate = existingItems.some(
          (item) =>
            item.employeeStatusCode.toUpperCase() === code &&
            item.employeeStatus.trim().toLowerCase() === name &&
            item.employeeStatusId !== initialItem?.employeeStatusId
        );

        if (isNameDuplicate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: getMsg('statusNameDuplicate'),
            path: ['employeeStatus'],
          });
        }
      }
    });
}

/** Schema for validating Server Action payloads */
export const empStatusActionSchema = z.object({
  employeeStatusCode: z
    .string()
    .trim()
    .min(1, 'Employee Status Code is required.')
    .min(5, 'Employee Status Code must be at least 5 characters.')
    .regex(/^[A-Za-z_-]+$/, 'Status Code must contain letters, hyphens, and underscores only.')
    .transform((val) => val.toUpperCase()),
  employeeStatus: z
    .string()
    .trim()
    .min(1, 'Employee Status name is required.')
    .refine((val) => !/\d/.test(val), 'Employee Status cannot contain numbers (letters only).'),
  employeeStatusMarathi: z
    .string()
    .trim()
    .min(1, 'Employee Status (Regional) is required.')
    .refine((val) => !/[\d\u0966-\u096F]/.test(val), 'Status in regional language cannot contain numbers.'),
  description: z.string().max(250).optional(),
  isActive: z.boolean().default(true),
});

/** Schema for validating Server Action update payloads */
export const updateEmpStatusActionSchema = empStatusActionSchema.partial().extend({
  id: z.string().trim().min(1, 'Employee Status ID is required').optional(),
});

/** Schema for validating ID in delete / update actions */
export const empStatusIdActionSchema = z.object({
  id: z.string().trim().min(1, 'Employee Status ID is required'),
});

export type EmpStatusSchemaType = ReturnType<typeof createEmpStatusSchema>;
export type EmpStatusActionPayload = z.infer<typeof empStatusActionSchema>;
