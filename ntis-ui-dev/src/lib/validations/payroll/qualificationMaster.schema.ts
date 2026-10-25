import { z } from 'zod';
import { payrollMasterQuerySchema } from './common.schema';

const qualificationValidationMessageMap = {
  codeRequired: 'Qualification Code is required.',
  codeMaxLength: 'Qualification code must not exceed 30 characters',
  codeFormat: 'Code must contain only letters, numbers, underscores, and hyphens',
  nameRequired: 'Qualification Name is required.',
  nameMinLength: 'Qualification name must be at least 2 characters',
  nameMaxLength: 'Qualification name must not exceed 100 characters',
  nameFormat: 'Qualification name can only contain letters, numbers, spaces, and . , - / & () +',
  nameRegionalRequired: 'Qualification Name (Regional) is required.',
  nameRegionalMinLength: 'Qualification name (Regional) must be at least 2 characters',
  nameRegionalMaxLength: 'Qualification name (Regional) must not exceed 150 characters',
  nameRegionalFormat: 'Qualification name (Regional) can only contain valid characters, numbers, and . , - / & () +',
  nameMarathiRequired: 'Qualification Name (Regional) is required.',
  nameMarathiMinLength: 'Qualification name (Regional) must be at least 2 characters',
  nameMarathiMaxLength: 'Qualification name (Regional) must not exceed 150 characters',
  nameMarathiFormat: 'Qualification name (Regional) can only contain valid characters and . - / & ()',
} as const;

export type QualificationTranslateFn = (
  key: keyof typeof qualificationValidationMessageMap | string
) => string;

const defaultQualificationTranslate: QualificationTranslateFn = (key) =>
  qualificationValidationMessageMap[key as keyof typeof qualificationValidationMessageMap] ??
  String(key);

export function createQualificationMasterSchemas(
  t: QualificationTranslateFn = defaultQualificationTranslate
) {
  const msg = (key: keyof typeof qualificationValidationMessageMap) => {
    const res = t(key);
    if (!res || res.startsWith('form.validation.') || res === key) {
      return qualificationValidationMessageMap[key] ?? String(key);
    }
    return res;
  };

  const qualificationCodeSchema = z
    .string()
    .trim()
    .min(1, { message: msg('codeRequired') })
    .max(30, { message: msg('codeMaxLength') })
    .regex(/^[A-Za-z0-9_-]+$/, { message: msg('codeFormat') })
    .transform((val) => val.toUpperCase());

  const qualificationNameSchema = z
    .string()
    .trim()
    .min(1, { message: msg('nameRequired') })
    .min(2, { message: msg('nameMinLength') })
    .max(100, { message: msg('nameMaxLength') })
    .regex(/^[A-Za-z0-9\s.,\-()\/&+]+$/, { message: msg('nameFormat') });

  const qualificationNameRegionalSchema = z
    .string()
    .trim()
    .min(1, { message: msg('nameRegionalRequired') })
    .min(2, { message: msg('nameRegionalMinLength') })
    .max(150, { message: msg('nameRegionalMaxLength') })
    .regex(/^[A-Za-z0-9\u0900-\u097F\s.,\-()\/&+]+$/, { message: msg('nameRegionalFormat') });

  const qualificationNameMarathiSchema = qualificationNameRegionalSchema;

  const sequenceNoSchema = z.coerce.number().int().optional().nullable();

  const isActiveSchema = z.boolean().default(true);

  const formSchema = z.object({
    qualificationCode: qualificationCodeSchema,
    qualificationName: qualificationNameSchema,
    qualificationNameRegional: qualificationNameRegionalSchema,
    sequenceNo: sequenceNoSchema,
    isActive: isActiveSchema,
  });

  const createActionSchema = formSchema;

  const updateActionSchema = formSchema.partial().extend({
    id: z.string().or(z.number()).optional(),
  });
  const querySchema = payrollMasterQuerySchema;

  return {
    qualificationCodeSchema,
    qualificationNameSchema,
    qualificationNameRegionalSchema,
    qualificationNameMarathiSchema,
    sequenceNoSchema,
    isActiveSchema,
    formSchema,
    createActionSchema,
    updateActionSchema,
    querySchema,
  };
}

export const defaultQualificationMasterSchemas = createQualificationMasterSchemas();
export const qualificationMasterFormSchema = defaultQualificationMasterSchemas.formSchema;
export const createQualificationMasterActionSchema = defaultQualificationMasterSchemas.createActionSchema;
export const updateQualificationMasterActionSchema = defaultQualificationMasterSchemas.updateActionSchema;
export const qualificationMasterQuerySchema = defaultQualificationMasterSchemas.querySchema;
export { payrollMasterQuerySchema } from './common.schema';
