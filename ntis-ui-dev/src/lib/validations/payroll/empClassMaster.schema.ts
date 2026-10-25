import { z } from 'zod';
import { PAYROLL_LIMITS } from '@/lib/constants/payroll.constants';

const empClassValidationMessageMap = {
  codeRequired: 'Class Code is required.',
  codeMinLength: `Employee Class Code must be at least ${PAYROLL_LIMITS.CODE_MIN_LENGTH} characters`,
  codeMaxLength: `Employee Class Code must not exceed ${PAYROLL_LIMITS.CODE_MAX_LENGTH} characters`,
  codeFormat: 'Code must contain only letters, numbers, underscores, and hyphens',
  nameRequired: 'Employee Class is required.',
  nameMaxLength: `Employee Class must not exceed ${PAYROLL_LIMITS.NAME_MAX_LENGTH} characters`,
  nameMarathiRequired: 'Employee Class (Regional) is required.',
  nameMarathiMaxLength: `Employee Class (Regional) must not exceed ${PAYROLL_LIMITS.NAME_MAX_LENGTH} characters`,
  descMaxLength: `Description must not exceed ${PAYROLL_LIMITS.DESCRIPTION_MAX_LENGTH} characters`,
  idRequired: 'ID is required',
} as const;

export type EmpClassTranslateFn = (
  key: keyof typeof empClassValidationMessageMap | string
) => string;

const defaultEmpClassTranslate: EmpClassTranslateFn = (key) =>
  empClassValidationMessageMap[key as keyof typeof empClassValidationMessageMap] ?? String(key);

export function createEmpClassMasterSchemas(t: EmpClassTranslateFn = defaultEmpClassTranslate) {
  const msg = (key: keyof typeof empClassValidationMessageMap) => {
    const res = t(key);
    if (
      !res ||
      res.startsWith('form.validation.') ||
      res.startsWith('drawer.validation.') ||
      res === key
    ) {
      return empClassValidationMessageMap[key] ?? String(key);
    }
    return res;
  };

  const classCodeSchema = z
    .string()
    .trim()
    .min(1, { message: msg('codeRequired') })
    .min(PAYROLL_LIMITS.CODE_MIN_LENGTH, { message: msg('codeMinLength') })
    .max(PAYROLL_LIMITS.CODE_MAX_LENGTH, { message: msg('codeMaxLength') })
    .regex(/^[A-Za-z0-9_-]+$/, { message: msg('codeFormat') })
    .transform((val) => val.toUpperCase());

  const classNameSchema = z
    .string()
    .trim()
    .min(1, { message: msg('nameRequired') })
    .max(PAYROLL_LIMITS.NAME_MAX_LENGTH, { message: msg('nameMaxLength') });

  const classNameMarathiSchema = z
    .string()
    .trim()
    .min(1, { message: msg('nameMarathiRequired') })
    .max(PAYROLL_LIMITS.NAME_MAX_LENGTH, { message: msg('nameMarathiMaxLength') });

  const descriptionSchema = z
    .string()
    .trim()
    .max(PAYROLL_LIMITS.DESCRIPTION_MAX_LENGTH, { message: msg('descMaxLength') })
    .optional()
    .transform((v) => v || undefined);

  const isActiveSchema = z.boolean().default(true);

  const formSchema = z.object({
    classCode: classCodeSchema,
    className: classNameSchema,
    classNameMarathi: classNameMarathiSchema,
    description: descriptionSchema,
    isActive: isActiveSchema,
  });

  const createActionSchema = formSchema;

  const updateActionSchema = formSchema.partial().extend({
    id: z.string().or(z.number()).optional(),
  });

  const querySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(PAYROLL_LIMITS.MAX_PAGE_SIZE).default(10),
    q: z.string().trim().optional(),
    status: z.enum(['all', 'active', 'inactive']).optional(),
    sortBy: z.string().trim().optional(),
    sortOrder: z.string().trim().optional(),
  });

  const idSchema = z.object({
    id: z.union([z.string().min(1, { message: msg('idRequired') }), z.number()]),
  });

  return {
    classCodeSchema,
    classNameSchema,
    classNameMarathiSchema,
    descriptionSchema,
    isActiveSchema,
    formSchema,
    createActionSchema,
    updateActionSchema,
    querySchema,
    idSchema,
  };
}

export const defaultEmpClassMasterSchemas = createEmpClassMasterSchemas();
export const empClassMasterFormSchema = defaultEmpClassMasterSchemas.formSchema;
export const createEmpClassMasterActionSchema = defaultEmpClassMasterSchemas.createActionSchema;
export const updateEmpClassMasterActionSchema = defaultEmpClassMasterSchemas.updateActionSchema;
export const empClassMasterQuerySchema = defaultEmpClassMasterSchemas.querySchema;
export const empClassMasterIdActionSchema = defaultEmpClassMasterSchemas.idSchema;
