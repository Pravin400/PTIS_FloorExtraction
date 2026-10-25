import { z } from 'zod';
import { payrollMasterQuerySchema } from './common.schema';

const designationValidationMessageMap = {
  codeRequired: 'Designation Code is required.',
  codeMaxLength: 'Designation code must not exceed 20 characters',
  codeFormat: 'Designation code must contain only letters, numbers, underscores, and hyphens',
  nameRequired: 'Designation Name is required.',
  nameMinLength: 'Designation name must be at least 5 characters',
  nameMaxLength: 'Designation name must not exceed 100 characters',
  nameFormat: 'Designation Name can only contain letters, spaces, and valid punctuation (. - / & ())',
  nameMarathiRequired: 'Designation Name (Regional) is required.',
  nameMarathiMinLength: 'Designation name (Regional) must be at least 5 characters',
  nameMarathiMaxLength: 'Designation name (Regional) must not exceed 100 characters',
  nameMarathiFormat: 'Designation Name (Regional) can only contain valid characters and punctuation (. - / & ())',
  descMaxLength: 'Description must not exceed 250 characters',
} as const;

export type DesignationTranslateFn = (
  key: keyof typeof designationValidationMessageMap | string
) => string;

const defaultDesignationTranslate: DesignationTranslateFn = (key) =>
  designationValidationMessageMap[key as keyof typeof designationValidationMessageMap] ??
  String(key);

export function createDesignationMasterSchemas(
  t: DesignationTranslateFn = defaultDesignationTranslate
) {
  const msg = (key: keyof typeof designationValidationMessageMap) => {
    const res = t(key);
    if (!res || res.startsWith('form.validation.') || res === key) {
      return designationValidationMessageMap[key] ?? String(key);
    }
    return res;
  };

  const designationCodeSchema = z
    .string()
    .trim()
    .min(1, { message: msg('codeRequired') })
    .max(20, { message: msg('codeMaxLength') })
    .regex(/^[A-Za-z0-9_-]+$/, { message: msg('codeFormat') })
    .transform((val) => val.toUpperCase());

  const designationNameSchema = z
    .string()
    .trim()
    .min(1, { message: msg('nameRequired') })
    .min(5, { message: msg('nameMinLength') })
    .max(100, { message: msg('nameMaxLength') })
    .regex(/^[A-Za-z\s.\-()\/&]+$/, { message: msg('nameFormat') });

  const designationNameMarathiSchema = z
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

  const departmentIdSchema = z.number().nullable().optional();

  const isActiveSchema = z.boolean().default(true);

  const formSchema = z.object({
    designationCode: designationCodeSchema,
    designationName: designationNameSchema,
    designationNameMarathi: designationNameMarathiSchema,
    departmentId: departmentIdSchema,
    description: descriptionSchema,
    isActive: isActiveSchema,
  });

  const createActionSchema = formSchema;

  const updateActionSchema = formSchema.partial().extend({
    id: z.string().or(z.number()).optional(),
  });

  const querySchema = payrollMasterQuerySchema;

  return {
    designationCodeSchema,
    designationNameSchema,
    designationNameMarathiSchema,
    descriptionSchema,
    departmentIdSchema,
    isActiveSchema,
    formSchema,
    createActionSchema,
    updateActionSchema,
    querySchema,
  };
}

export const defaultDesignationMasterSchemas = createDesignationMasterSchemas();
export const designationMasterFormSchema = defaultDesignationMasterSchemas.formSchema;
export const createDesignationMasterActionSchema =
  defaultDesignationMasterSchemas.createActionSchema;
export const updateDesignationMasterActionSchema =
  defaultDesignationMasterSchemas.updateActionSchema;
export const designationMasterQuerySchema = defaultDesignationMasterSchemas.querySchema;
