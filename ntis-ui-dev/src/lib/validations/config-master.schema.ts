import { z } from 'zod';
import { CODE_REGEX, TEXT_ALLOWED, isAllZeros } from '../utils/validation-rules';
import { DateUtils } from '../utils/date-helpers';

/**
 * Shared audit fields
 */
export const AuditSchema = z.object({
  createdBy: z.number().optional(),
  updatedBy: z.number().optional(),
});


/**
 * Config Category Schemas
 */
export const CreateConfigCategorySchema = z.object({
  categoryCode: z.string()
    .trim()
    .min(1, 'modals.addCategory.form.validation.codeRequired')
    .min(3, 'Category code must be at least 3 characters')
    .max(50, 'modals.addCategory.form.validation.codeMaxLength')
    .regex(CODE_REGEX, 'modals.addCategory.form.validation.codeAlphanumeric')
    .refine(val => !isAllZeros(val), 'modals.addCategory.form.validation.codeInvalid'),
  categoryName: z.string()
    .trim()
    .min(1, 'modals.addCategory.form.validation.nameRequired')
    .min(3, 'Category name must be at least 3 characters')
    .max(100, 'modals.addCategory.form.validation.nameMaxLength')
    .regex(TEXT_ALLOWED, 'modals.addCategory.form.validation.nameAlphanumeric'),
  displayOrder: z.number()
    .int('modals.addCategory.form.validation.orderRequired')
    .min(0, 'Display order cannot be negative')
    .max(99999, 'Display order cannot exceed 99999')
    .default(0),
  isActive: z.boolean().default(true),
  createdBy: z.number().optional(),
});

export const UpdateConfigCategorySchema = CreateConfigCategorySchema.extend({
  updatedBy: z.number().optional(),
}).omit({ createdBy: true });

/**
 * Config Key Schemas
 */
export const ConfigKeyBaseSchema = z.object({
  categoryId: z.number().int().positive('modals.addKey.form.validation.categoryRequired'),
  configCode: z.string()
    .trim()
    .min(1, 'modals.addKey.form.validation.codeRequired')
    .max(50, 'modals.addKey.form.validation.codeMaxLength')
    .regex(CODE_REGEX, 'modals.addKey.form.validation.codeAlphanumeric')
    .refine(val => !isAllZeros(val), 'modals.addKey.form.validation.codeInvalid'),
  configName: z.string()
    .trim()
    .min(1, 'modals.addKey.form.validation.nameRequired')
    .max(100, 'modals.addKey.form.validation.nameMaxLength')
    .regex(TEXT_ALLOWED, 'modals.addKey.form.validation.nameAlphanumeric'),
  description: z.string()
    .trim()
    .max(255, 'Description cannot exceed 255 characters')
    .refine(val => !/[<>]/.test(val), 'Description cannot contain HTML tags or angle brackets')
    .optional()
    .or(z.literal('')),
  dataType: z.enum(['string', 'int', 'decimal', 'boolean', 'datetime'], {
    message: 'modals.addKey.form.validation.dataTypeRequired'
  }),
  controlType: z.string().trim().min(1, 'Control type is required'),
  defaultValue: z.string().nullish().transform(val => val?.trim() || '').pipe(
    z.string()
      .max(100, 'Default value is too long')
      .refine(val => !/[<>]/.test(val), 'Default value cannot contain HTML tags or angle brackets')
  ),
  isActive: z.boolean().default(true),
});

const validateDefaultValueRefinement = (data: { dataType: string; defaultValue?: string | null }, ctx: z.RefinementCtx) => {
  const { dataType, defaultValue } = data;
  if (!defaultValue) return;

  const normDataType = (dataType || '').toLowerCase();

  if (normDataType === 'int' || normDataType === 'integer') {
    if (!/^\d+$/.test(defaultValue)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Default value must be a valid positive integer (no negative values or special characters)',
        path: ['defaultValue'],
      });
      return;
    }
    const parsed = parseInt(defaultValue, 10);
    if (parsed <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Default value must be greater than 0',
        path: ['defaultValue'],
      });
      return;
    }
    if (parsed > 2147483647) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Default value must not exceed 2147483647',
        path: ['defaultValue'],
      });
    }
  } else if (normDataType === 'decimal' || normDataType === 'float' || normDataType === 'number') {
    if (!/^\d+(\.\d+)?$/.test(defaultValue)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Default value must be a valid positive decimal number (no negative values or special characters)',
        path: ['defaultValue'],
      });
      return;
    }
    const parsed = parseFloat(defaultValue);
    if (parsed <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Default value must be greater than 0',
        path: ['defaultValue'],
      });
    }
  } else if (normDataType === 'boolean' || normDataType === 'bool') {
    if (defaultValue !== 'true' && defaultValue !== 'false') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Default value must be 'true' or 'false'",
        path: ['defaultValue'],
      });
    }
  } else if (normDataType === 'datetime' || normDataType === 'date' || normDataType === 'timestamp') {
    const isValidFormat = DateUtils.isValidDateTime(defaultValue);
      
    if (!isValidFormat) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Default value must be a valid date and time (year from current year onwards)',
        path: ['defaultValue'],
      });
    }
  }
};

export const CreateConfigKeySchema = ConfigKeyBaseSchema.extend({
  createdBy: z.number().optional(),
}).superRefine(validateDefaultValueRefinement);

export const UpdateConfigKeySchema = ConfigKeyBaseSchema.extend({
  updatedBy: z.number().optional(),
}).superRefine(validateDefaultValueRefinement);

/**
 * Config Value / Department Update Schemas
 */
export const CreateConfigValueSchema = z.object({
  configKeyId: z.coerce.number().int().positive('Configuration key is required'),
  // Use preprocess to handle empty strings and convert to null for optional fields
  departmentId: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? null : Number(val),
    z.number().int().positive().nullable()
  ),
  moduleId: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? null : Number(val),
    z.number().int().positive().nullable()
  ),
  value: z.string().trim().min(1, 'Value is required').max(5000, 'Value is too long'),
  // Use transform instead of coerce for boolean to handle 'false' string correctly
  isEnabled: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().default(true)
  ),
});

export const UpdateConfigValueSchema = CreateConfigValueSchema.extend({
  configValueId: z.number().int().positive(),
}).partial({
  configKeyId: true,
});

export const DepartmentUpdateItemSchema = z.object({
  departmentId: z.coerce.number().int().positive(),
  moduleId: z.coerce.number().int().nullable().optional(),
  isEnabled: z.coerce.boolean(),
  configValueId: z.coerce.number().int().nonnegative(),
  value: z.preprocess((v) => (v === null || v === undefined ? '' : String(v)), z.string()),
});

export const SaveDepartmentConfigurationSchema = z.object({
  configKeyId: z.coerce.number().int().positive(),
  updates: z.array(DepartmentUpdateItemSchema),
});

export * from './config-master-normalization.schema';

/**
 * Module (Submodule) Mutation Schemas
 */
export const CreateModuleMasterSchema = z.object({
  departmentId: z.number().int().positive(),
  moduleCode: z.string()
    .trim()
    .min(3, 'Module code must be at least 3 characters')
    .max(50, 'Module code is too long')
    .regex(CODE_REGEX, 'Module code can only contain alphanumeric characters and underscores')
    .refine(val => !isAllZeros(val), 'Module code cannot be all zeros'),
  moduleName: z.string()
    .trim()
    .min(3, 'Module name must be at least 3 characters')
    .max(100, 'Module name is too long')
    .regex(TEXT_ALLOWED, 'Module name contains invalid characters'),
  moduleNameLocal: z.string().trim().nullable().optional(),
  moduleIcon: z.string().trim().nullable().optional(),
  moduleLabel: z.string().trim().nullable().optional(),
  moduleDescription: z.string().nullish().transform(val => val?.trim() || '').pipe(
    z.string()
      .max(255, 'Description is too long')
      .refine(val => !/[<>]/.test(val), 'Description cannot contain HTML tags or angle brackets')
  ),
  isActive: z.boolean().default(true),
});

export const UpdateModuleMasterSchema = CreateModuleMasterSchema.extend({
  // Add update specific fields if any
});
