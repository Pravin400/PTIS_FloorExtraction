import { z } from 'zod';
import { PAYROLL_LIMITS } from '@/lib/constants/payroll.constants';

const zoneDivisionValidationMessageMap = {
  codeRequired: 'Office Code is required.',
  codeMinLength: `Office Code must be at least ${PAYROLL_LIMITS.CODE_MIN_LENGTH} characters`,
  codeMaxLength: `Office Code must not exceed ${PAYROLL_LIMITS.CODE_MAX_LENGTH} characters`,
  codeFormat: 'Code must contain only letters, numbers, hyphens, and underscores',
  nameRequired: 'Office Name is required.',
  nameMinLength: `Office Name must be at least ${PAYROLL_LIMITS.NAME_MIN_LENGTH} characters`,
  nameMaxLength: `Office Name must not exceed ${PAYROLL_LIMITS.NAME_MAX_LENGTH} characters`,
  nameFormat: 'Office Name can only contain letters, numbers, spaces, and valid punctuation (. - / & ())',
  nameRegionalRequired: 'Office Name (Regional) is required.',
  nameRegionalMinLength: `Office Name (Regional) must be at least ${PAYROLL_LIMITS.NAME_REGIONAL_MIN_LENGTH} characters`,
  nameRegionalMaxLength: `Office Name (Regional) must not exceed ${PAYROLL_LIMITS.NAME_MAX_LENGTH} characters`,
  nameRegionalFormat: 'Office Name (Regional) can only contain valid characters and punctuation (. - / & ())',
  addressRequired: 'Physical Address is required.',
  addressMinLength: `Physical Address must be at least ${PAYROLL_LIMITS.ADDRESS_MIN_LENGTH} characters`,
  addressMaxLength: `Physical Address must not exceed ${PAYROLL_LIMITS.ADDRESS_MAX_LENGTH} characters`,
  idRequired: 'ID is required',
} as const;

export const ZONE_DIVISION_NAME_REGEX = /^[A-Za-z0-9\s.\-()\/&]+$/;
export const ZONE_DIVISION_REGIONAL_NAME_REGEX = /^[A-Za-z0-9\u0900-\u097F\s.\-()\/&]+$/;

export type ZoneDivisionTranslateFn = (
  key: keyof typeof zoneDivisionValidationMessageMap | string
) => string;

const defaultZoneDivisionTranslate: ZoneDivisionTranslateFn = (key) =>
  zoneDivisionValidationMessageMap[key as keyof typeof zoneDivisionValidationMessageMap] ??
  String(key);

export function createZoneDivisionMasterSchemas(
  t: ZoneDivisionTranslateFn = defaultZoneDivisionTranslate
) {
  const msg = (key: keyof typeof zoneDivisionValidationMessageMap) => {
    const res = t(key);
    if (
      !res ||
      res.startsWith('drawer.validation.') ||
      res.startsWith('form.validation.') ||
      res === key
    ) {
      return zoneDivisionValidationMessageMap[key] ?? String(key);
    }
    return res;
  };

  const zoneDivisionCodeSchema = z
    .string()
    .trim()
    .min(1, { message: msg('codeRequired') })
    .min(PAYROLL_LIMITS.CODE_MIN_LENGTH, { message: msg('codeMinLength') })
    .max(PAYROLL_LIMITS.CODE_MAX_LENGTH, { message: msg('codeMaxLength') })
    .regex(/^[A-Za-z0-9_-]+$/, { message: msg('codeFormat') })
    .transform((val) => val.toUpperCase());

  const zoneDivisionNameSchema = z
    .string()
    .trim()
    .min(1, { message: msg('nameRequired') })
    .min(PAYROLL_LIMITS.NAME_MIN_LENGTH, { message: msg('nameMinLength') })
    .max(PAYROLL_LIMITS.NAME_MAX_LENGTH, { message: msg('nameMaxLength') })
    .regex(ZONE_DIVISION_NAME_REGEX, { message: msg('nameFormat') });

  const zoneDivisionNameRegionalSchema = z
    .string()
    .trim()
    .min(1, { message: msg('nameRegionalRequired') })
    .min(PAYROLL_LIMITS.NAME_REGIONAL_MIN_LENGTH, { message: msg('nameRegionalMinLength') })
    .max(PAYROLL_LIMITS.NAME_MAX_LENGTH, { message: msg('nameRegionalMaxLength') })
    .regex(ZONE_DIVISION_REGIONAL_NAME_REGEX, { message: msg('nameRegionalFormat') });

  const addressSchema = z
    .string()
    .trim()
    .min(1, { message: msg('addressRequired') })
    .min(PAYROLL_LIMITS.ADDRESS_MIN_LENGTH, { message: msg('addressMinLength') })
    .max(PAYROLL_LIMITS.ADDRESS_MAX_LENGTH, { message: msg('addressMaxLength') });

  const isActiveSchema = z.boolean().default(true);

  const formSchema = z.object({
    zoneDivisionCode: zoneDivisionCodeSchema,
    zoneDivisionName: zoneDivisionNameSchema,
    zoneDivisionNameRegional: zoneDivisionNameRegionalSchema,
    address: addressSchema,
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
    zoneDivisionCodeSchema,
    zoneDivisionNameSchema,
    zoneDivisionNameRegionalSchema,
    addressSchema,
    isActiveSchema,
    formSchema,
    createActionSchema,
    updateActionSchema,
    querySchema,
    idSchema,
  };
}

export const defaultZoneDivisionMasterSchemas = createZoneDivisionMasterSchemas();
export const zoneDivisionMasterFormSchema = defaultZoneDivisionMasterSchemas.formSchema;
export const createZoneDivisionMasterActionSchema =
  defaultZoneDivisionMasterSchemas.createActionSchema;
export const updateZoneDivisionMasterActionSchema =
  defaultZoneDivisionMasterSchemas.updateActionSchema;
export const zoneDivisionMasterQuerySchema = defaultZoneDivisionMasterSchemas.querySchema;
export const zoneDivisionMasterIdActionSchema = defaultZoneDivisionMasterSchemas.idSchema;
