import { z } from 'zod';
import ptisEn from '@/i18n/locales/en/ptis.json';

/**
 * Validation schema for Property ID (used in actions)
 */
export const propertyIdActionSchema = z.object({
  propertyId: z
    .number({ message: 'Property ID is required' })
    .positive('Property ID must be a positive number')
    .finite('Property ID must be a finite number'),
});

const ptisValidationMessageMap = {
  'search.errors.wardNoRequired': ptisEn.search.errors.wardNoRequired,
  'search.errors.wardNoMax': ptisEn.search.errors.wardNoMax,
  'search.errors.wardNoPattern': ptisEn.search.errors.wardNoPattern,
  'search.errors.wardIdRequired': ptisEn.search.errors.wardIdRequired,
  'search.errors.propertyNoRequired': ptisEn.search.errors.propertyNoRequired,
  'search.errors.propertyNoMax': ptisEn.search.errors.propertyNoMax,
  'search.errors.propertyNoPattern': ptisEn.search.errors.propertyNoPattern,
  'search.errors.partitionNoMax': ptisEn.search.errors.partitionNoMax,
  'search.errors.partitionNoPattern': ptisEn.search.errors.partitionNoPattern,
} as const;

type PtisTranslate = (key: keyof typeof ptisValidationMessageMap) => string;

const defaultPtisTranslate: PtisTranslate = (key) => ptisValidationMessageMap[key];

export function createPtisSchemas(t: PtisTranslate = defaultPtisTranslate) {
  const wardNoSchema = z
    .string()
    .min(1, { message: t('search.errors.wardNoRequired') })
    .max(15, { message: t('search.errors.wardNoMax') })
    .regex(/^[a-zA-Z0-9]+$/, { message: t('search.errors.wardNoPattern') });

  const wardIdSchema = z.number({ message: t('search.errors.wardIdRequired') });

  const propertyNoSchema = z
    .string()
    .min(1, { message: t('search.errors.propertyNoRequired') })
    .max(10, { message: t('search.errors.propertyNoMax') })
    .regex(/^[a-zA-Z0-9-]+$/, { message: t('search.errors.propertyNoPattern') });

  const partitionNoSchema = z
    .string()
    .max(10, { message: t('search.errors.partitionNoMax') })
    .regex(/^[a-zA-Z0-9-]*$/, { message: t('search.errors.partitionNoPattern') })
    .optional();

  return {
    wardNoSchema,
    wardIdSchema,
    propertyNoSchema,
    partitionNoSchema,
    propertySearchSchema: z.object({
      wardNo: wardNoSchema,
      propertyNo: propertyNoSchema,
      partitionNo: partitionNoSchema,
      wardId: wardIdSchema.nullable().optional(),
      propertyId: z.string().nullable().optional(),
      societyDetailId: z.union([z.number(), z.string()]).nullable().optional(),
      wingDetailId: z.union([z.number(), z.string()]).nullable().optional(),
      societyId: z.union([z.number(), z.string()]).nullable().optional(),
      wingId: z.union([z.number(), z.string()]).nullable().optional(),
    }),
    propertyDetailsSchema: z
      .union([
        z.object({
          propertyId: z.number({ message: 'Property ID must be a number' }),
          wardNo: z.string().optional(),
          propertyNo: z.string().optional(),
          partitionNo: partitionNoSchema,
          wardId: wardIdSchema.optional(),
        }),
        z.object({
          wardNo: wardNoSchema,
          propertyNo: propertyNoSchema,
          partitionNo: partitionNoSchema,
          wardId: wardIdSchema.optional(),
          propertyId: z.number().optional(),
        }),
      ])
      .refine(
        (val) =>
          'propertyId' in val && val.propertyId !== undefined
            ? true
            : !!(val.wardNo && val.propertyNo),
        { message: 'Provide either a propertyId or both wardNo and propertyNo' }
      ),
    wardNoActionSchema: z.object({
      wardNo: wardNoSchema,
    }),
    wardIdActionSchema: z.object({
      wardId: wardIdSchema,
    }),
    searchSuggestionsSchema: z.object({
      wardNo: z.string().optional(),
      wardId: z.number().optional(),
      propertyNo: z.string().optional(),
      searchText: z.string().optional(),
    }),
  };
}

const defaultSchemas = createPtisSchemas();

/**
 * Validation schema for Property Search (used in URL syncing and search bar)
 */
export const propertySearchSchema = defaultSchemas.propertySearchSchema;

/**
 * Validation schema for Fetching Property Details.
 * Accepts EITHER a direct `propertyId` (bypass search) OR `wardNo + propertyNo`
 * (search-then-resolve path). This matches the service-layer branching logic.
 */
export const propertyDetailsSchema = defaultSchemas.propertyDetailsSchema;

/**
 * Validation schema for Ward actions
 */
export const wardNoActionSchema = defaultSchemas.wardNoActionSchema;

export const wardIdActionSchema = defaultSchemas.wardIdActionSchema;

/**
 * Validation schema for Search suggestions
 */
export const searchSuggestionsSchema = defaultSchemas.searchSuggestionsSchema;

export const workflowStageActionSchema = z.object({
  propertyId: z.union([z.number(), z.string()]).refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num > 0;
  }, { message: 'Property ID must be a positive number' }),
  workflowStageId: z.number().positive('Workflow stage ID must be a positive number'),
});

export type PropertySearchSchema = z.infer<typeof propertySearchSchema>;
