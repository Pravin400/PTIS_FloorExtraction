import { z } from 'zod';
import type { EmpTypeMasterItem } from '@/types/payroll/MasterModule';

const defaultValidationMessages = {
  typeCodeRequired: 'Employee Type Code is required.',
  typeCodeMinLength: 'Employee Type Code must be at least 5 characters.',
  typeCodeLettersOnly: 'Type Code must contain letters, hyphens, and underscores only.',
  typeCodeDuplicate: 'This Type Code already exists. Codes must be unique.',
  typeNameRequired: 'Employee Type Name is required.',
  typeNameLettersOnly: 'Type Name cannot contain numbers (letters only).',
  typeNameDuplicate: 'An employee type with this name already exists.',
  typeNameMarathiRequired: 'Employee Type Name (Regional) is required.',
  typeNameMarathiNoNumbers: 'Type Name in regional language cannot contain numbers.',
  sequenceNoPositiveInteger: 'Sequence number must be a valid positive integer.',
} as const;

export type EmpTypeValidationKey = keyof typeof defaultValidationMessages;
export type EmpTypeTranslator = (key: string) => string;

export interface EmpTypeSchemaOptions {
  t?: EmpTypeTranslator;
  existingItems?: EmpTypeMasterItem[];
  existingCodes?: string[];
  initialItem?: EmpTypeMasterItem | null;
}

export function createEmpTypeSchema(options: EmpTypeSchemaOptions = {}) {
  const { t, existingItems, existingCodes, initialItem } = options;

  const getMsg = (key: EmpTypeValidationKey): string => {
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
      employeeTypeCode: z
        .string()
        .trim()
        .min(1, { message: getMsg('typeCodeRequired') })
        .min(5, { message: getMsg('typeCodeMinLength') })
        .regex(/^[A-Za-z_-]+$/, { message: getMsg('typeCodeLettersOnly') }),
      employeeTypeName: z
        .string()
        .trim()
        .min(1, { message: getMsg('typeNameRequired') })
        .refine((val) => !/\d/.test(val), { message: getMsg('typeNameLettersOnly') }),
      employeeTypeNameMarathi: z
        .string()
        .trim()
        .min(1, { message: getMsg('typeNameMarathiRequired') })
        .refine((val) => !/[\d\u0966-\u096F]/.test(val), { message: getMsg('typeNameMarathiNoNumbers') }),
      sequenceNo: z.coerce
        .number()
        .int({ message: getMsg('sequenceNoPositiveInteger') })
        .min(1, { message: getMsg('sequenceNoPositiveInteger') })
        .default(1),
      isActive: z.boolean().default(true),
    })
    .superRefine((data, ctx) => {
      const code = data.employeeTypeCode.trim().toUpperCase();
      const name = data.employeeTypeName.trim().toLowerCase();

      // Check code uniqueness
      const isCodeDuplicate =
        (existingCodes &&
          existingCodes.some(
            (c) => c.toUpperCase() === code && c.toUpperCase() !== initialItem?.employeeTypeCode.toUpperCase()
          )) ||
        (existingItems &&
          existingItems.some(
            (item) => item.employeeTypeCode.toUpperCase() === code && item.employeeTypeId !== initialItem?.employeeTypeId
          ));

      if (isCodeDuplicate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: getMsg('typeCodeDuplicate'),
          path: ['employeeTypeCode'],
        });
      }

      if (existingItems && existingItems.length > 0 && code && name) {
        const isDuplicate = existingItems.some(
          (item) =>
            item.employeeTypeCode.toUpperCase() === code &&
            item.employeeTypeName.trim().toLowerCase() === name &&
            item.employeeTypeId !== initialItem?.employeeTypeId
        );

        if (isDuplicate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: getMsg('typeNameDuplicate'),
            path: ['employeeTypeName'],
          });
        }
      }
    });
}

/** Schema for validating Server Action payloads */
export const empTypeActionSchema = z.object({
  employeeTypeCode: z
    .string()
    .trim()
    .min(1, 'Employee Type Code is required.')
    .min(5, 'Employee Type Code must be at least 5 characters.')
    .regex(/^[A-Za-z_-]+$/, 'Type Code must contain letters, hyphens, and underscores only.')
    .transform((val) => val.toUpperCase()),
  employeeTypeName: z
    .string()
    .trim()
    .min(1, 'Employee Type Name is required.')
    .refine((val) => !/\d/.test(val), 'Type Name cannot contain numbers (letters only).'),
  employeeTypeNameMarathi: z
    .string()
    .trim()
    .min(1, 'Employee Type (Regional) is required.')
    .refine((val) => !/[\d\u0966-\u096F]/.test(val), 'Type Name in regional language cannot contain numbers.'),
  sequenceNo: z.coerce
    .number()
    .int('Sequence number must be an integer.')
    .min(1, 'Sequence number must be a valid positive integer (>= 1).')
    .default(1),
  isActive: z.boolean().default(true),
});

/** Schema for validating Server Action update payloads */
export const updateEmpTypeActionSchema = empTypeActionSchema.partial().extend({
  id: z.string().trim().min(1, 'Employee Type ID is required').optional(),
});

/** Schema for validating ID in delete / update actions */
export const empTypeIdActionSchema = z.object({
  id: z.string().trim().min(1, 'Employee Type ID is required'),
});

export type EmpTypeSchemaType = ReturnType<typeof createEmpTypeSchema>;
export type EmpTypeActionPayload = z.infer<typeof empTypeActionSchema>;
