import { z } from 'zod';
import { payrollMasterQuerySchema } from './common.schema';

const deptValidationMessageMap = {
  codeRequired: 'Department Code is required.',
  codeMaxLength: 'Department code must not exceed 20 characters',
  codeFormat: 'Code must contain only letters, numbers, underscores, and hyphens',
  nameRequired: 'Department Name is required.',
  nameMinLength: 'Department name must be at least 5 characters',
  nameMaxLength: 'Department name must not exceed 100 characters',
  nameFormat: 'Department Name can only contain letters, spaces, and valid punctuation (. - / & ())',
  nameMarathiRequired: 'Department Name (Regional) is required.',
  nameMarathiMinLength: 'Department name (Regional) must be at least 5 characters',
  nameMarathiMaxLength: 'Department name (Regional) must not exceed 100 characters',
  nameMarathiFormat: 'Department Name (Regional) can only contain valid characters and punctuation (. - / & ())',
  descMaxLength: 'Description must not exceed 250 characters',
} as const;

export type DeptTranslateFn = (key: keyof typeof deptValidationMessageMap | string) => string;

const defaultDeptTranslate: DeptTranslateFn = (key) =>
  deptValidationMessageMap[key as keyof typeof deptValidationMessageMap] ?? String(key);

export function createDeptMasterSchemas(t: DeptTranslateFn = defaultDeptTranslate) {
  const msg = (key: keyof typeof deptValidationMessageMap) => {
    const res = t(key);
    if (!res || res.startsWith('form.validation.') || res === key) {
      return deptValidationMessageMap[key] ?? String(key);
    }
    return res;
  };

  const departmentCodeSchema = z
    .string()
    .trim()
    .min(1, { message: msg('codeRequired') })
    .max(20, { message: msg('codeMaxLength') })
    .regex(/^[A-Za-z0-9_-]+$/, { message: msg('codeFormat') })
    .transform((val) => val.toUpperCase());

  const departmentNameSchema = z
    .string()
    .trim()
    .min(1, { message: msg('nameRequired') })
    .min(5, { message: msg('nameMinLength') })
    .max(100, { message: msg('nameMaxLength') })
    .regex(/^[A-Za-z\s.\-()\/&]+$/, { message: msg('nameFormat') });

  const departmentNameMarathiSchema = z
    .string()
    .trim()
    .min(1, { message: msg('nameMarathiRequired') })
    .min(5, { message: msg('nameMarathiMinLength') })
    .max(100, { message: msg('nameMarathiMaxLength') })
    .regex(/^[A-Za-z\u0900-\u0965\u0970-\u097F\s.\-()\/&]+$/, { message: msg('nameMarathiFormat') });

  const descriptionSchema = z
    .string()
    .trim()
    .max(250, { message: msg('descMaxLength') })
    .optional()
    .or(z.literal(''));

  const isActiveSchema = z.boolean().default(true);

  const formSchema = z.object({
    departmentCode: departmentCodeSchema,
    departmentName: departmentNameSchema,
    departmentNameMarathi: departmentNameMarathiSchema,
    description: descriptionSchema,
    isActive: isActiveSchema,
  });

  const createActionSchema = formSchema;

  const updateActionSchema = formSchema.partial().extend({
    id: z.string().or(z.number()).optional(),
  });
  const querySchema = payrollMasterQuerySchema;

  return {
    departmentCodeSchema,
    departmentNameSchema,
    departmentNameMarathiSchema,
    descriptionSchema,
    isActiveSchema,
    formSchema,
    createActionSchema,
    updateActionSchema,
    querySchema,
  };
}

export const defaultDeptMasterSchemas = createDeptMasterSchemas();
export const deptMasterFormSchema = defaultDeptMasterSchemas.formSchema;
export const createDeptMasterActionSchema = defaultDeptMasterSchemas.createActionSchema;
export const updateDeptMasterActionSchema = defaultDeptMasterSchemas.updateActionSchema;
export const deptMasterQuerySchema = defaultDeptMasterSchemas.querySchema;
export { payrollMasterQuerySchema } from './common.schema';
