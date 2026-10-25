/**
 * Floor Form Zod Schema
 * 
 * Provides validation for the client-side floor submission form.
 * Uses human-readable error messages for immediate UI feedback.
 */

import { z } from 'zod';
import { checkIsUtilityCategory } from '@/lib/utils/floorSubmission/floor-utility-checks';

const currentFinancialStartYear = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;

/**
 * Validates that a dropdown value is not empty and is not a placeholder string
 * across English, Hindi, and Marathi locales.
 */
export const isValidDropdownValue = (val: unknown): boolean => {
  if (val === null || val === undefined) return false;
  const trimmed = String(val).trim();
  if (trimmed.length === 0) return false;

  const lower = trimmed.toLowerCase();

  // Reject strings containing common select/placeholder keywords in English
  if (
    lower.includes('select') ||
    lower.includes('choose') ||
    lower.includes('first')
  ) {
    return false;
  }

  // Reject Marathi placeholders (containing "निवडा")
  if (trimmed.includes('निवडा')) {
    return false;
  }

  // Reject Hindi placeholders (containing "चुनें")
  if (trimmed.includes('चुनें')) {
    return false;
  }

  return true;
};

export const floorFormSchema = z.object({
  // Identity fields
  id: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional(),
  isAddingNewFloor: z.boolean().optional(),

  // Basic info - required fields
  floor: z.union([z.string(), z.null(), z.undefined()])
    .transform(val => String(val ?? '').trim()),
  floorId: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional(),

  subFloor: z.union([z.string(), z.null(), z.undefined()])
    .transform(val => String(val ?? '').trim())
    .default(''),
  subFloorId: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional(),

  // Year validation with consistent rules
  conYr: z.union([z.string(), z.number(), z.null(), z.undefined()])
    .transform(val => String(val ?? '').trim())
    .refine(val => {
      if (val === '') return true;
      return /^\d*$/.test(val);
    }, 'Construction year must contain only numbers')
    .refine(val => {
      if (val === '') return true;
      return val.length === 4;
    }, 'Construction year must be exactly 4 digits')
    .refine(val => {
      if (val === '') return true;
      const year = parseInt(val, 10);
      return year >= 1700 && year <= currentFinancialStartYear;
    }, {
      message: `Construction year must be between 1700 and the current financial year (${currentFinancialStartYear})`
    }),

  asstYr: z.union([z.string(), z.number(), z.null(), z.undefined()])
    .transform(val => String(val ?? '').trim())
    .refine(val => val.length > 0, 'Assessment year is required')
    .refine(val => /^\d*$/.test(val), 'Assessment year must contain only numbers')
    .refine(val => val.length === 4, 'Assessment year must be exactly 4 digits')
    .refine((val) => {
      const year = parseInt(val, 10);
      return year >= 1700 && year <= currentFinancialStartYear;
    }, {
      message: `Assessment year must be between 1700 and the current financial year (${currentFinancialStartYear})`
    }),

  // Construction and usage - required
  conTyp: z.union([z.string(), z.null(), z.undefined()])
    .transform(val => String(val ?? '').trim()),
  constructionTypeId: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional(),

  use: z.union([z.string(), z.null(), z.undefined()])
    .transform(val => String(val ?? '').trim())
    .refine(val => val.length > 0 && isValidDropdownValue(val), 'Type of use is required'),
  typeOfUseId: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional(),
  typeOfUseCategoryId: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional(),

  subTyp: z.union([z.string(), z.null(), z.undefined()])
    .transform(val => String(val ?? '').trim())
    .default(''),
  subTypeOfUseId: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional(),

  // Descriptions (auto-populated from lookups)
  floorDescription: z.union([z.string(), z.null(), z.undefined()]).optional(),
  subFloorDescription: z.union([z.string(), z.null(), z.undefined()]).optional(),
  constructionTypeDescription: z.union([z.string(), z.null(), z.undefined()]).optional(),
  typeOfUseDescription: z.union([z.string(), z.null(), z.undefined()]).optional(),
  subTypeOfUseDescription: z.union([z.string(), z.null(), z.undefined()]).optional(),

  // Room and area validation
  rooms: z.union([z.string(), z.number(), z.null(), z.undefined()])
    .transform(val => String(val ?? '').trim()),

  areaSqFt: z.union([z.string(), z.number(), z.null(), z.undefined()])
    .transform(val => String(val ?? '').trim())
    .refine(val => val.length > 0, 'Carpet area is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'Carpet area must be a positive number'),

  areaSqM: z.union([z.string(), z.number(), z.null(), z.undefined()])
    .transform(val => String(val ?? '').trim())
    .default(''),
  builtupAreaSqFt: z.union([z.string(), z.number(), z.null(), z.undefined()])
    .transform(val => String(val ?? '').trim())
    .default(''),
  builtupAreaSqM: z.union([z.string(), z.number(), z.null(), z.undefined()])
    .transform(val => String(val ?? '').trim())
    .default(''),

  // Renter information
  renter: z.union([z.string(), z.boolean(), z.null(), z.undefined()])
    .transform(val => val === 'Yes' || val === true ? 'Yes' : 'No')
    .default('No'),

  renterName: z.union([z.string(), z.null(), z.undefined()])
    .transform(val => String(val ?? '').trim())
    .default(''),
  renterNameEnglish: z.union([z.string(), z.null(), z.undefined()])
    .transform(val => String(val ?? '').trim())
    .default(''),
  rentMonthly: z.union([z.string(), z.number(), z.null(), z.undefined()])
    .transform(val => String(val ?? '').trim())
    .default(''),
  rentYearly: z.union([z.string(), z.number(), z.null(), z.undefined()])
    .transform(val => String(val ?? '').trim())
    .default(''),

  // Dates
  agreementFromDate: z.union([z.string(), z.null(), z.undefined()]).optional().nullable(),
  agreementToDate: z.union([z.string(), z.null(), z.undefined()]).optional().nullable(),
  agreementDate: z.union([z.string(), z.null(), z.undefined()]).optional().nullable(),

  // Tax information
  isTaxable: z.union([z.string(), z.boolean(), z.null(), z.undefined()])
    .transform(val => val === 'Yes' || val === true ? 'Yes' : 'No')
    .default('Yes'),

  taxLiability: z.union([z.string(), z.number(), z.null(), z.undefined()])
    .transform(val => String(val ?? '').trim())
    .default(''),

  // Occupancy
  occupancyDate: z.union([z.string(), z.null(), z.undefined()]).optional().nullable(),
  occupancyApplyOrNot: z.union([z.string(), z.boolean(), z.null(), z.undefined()])
    .transform(val => val === 'Yes' || val === true ? 'Yes' : 'No')
    .default('No'),
  occupancyNumber: z.union([z.string(), z.number(), z.null(), z.undefined()])
    .transform(val => String(val ?? '').trim())
    .default(''),
  nonCalculateRentMonthly: z.union([z.string(), z.number(), z.null(), z.undefined()])
    .transform(val => Number(val ?? 0))
    .default(0),

  renterDetails: z.union([z.array(z.unknown()), z.null(), z.undefined()])
    .transform(val => val ?? [])
    .default([]),
  renterMast: z.union([z.array(z.unknown()), z.null(), z.undefined()])
    .transform(val => val ?? [])
    .default([]),
  roomData: z.union([z.array(z.unknown()), z.null(), z.undefined()])
    .transform(val => val ?? [])
    .default([]),
  selectedFloorType: z.enum(['Construction', 'OpenPlot']).optional(),
  length: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional(),
  width: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional(),
}).superRefine((data, ctx) => {
  if (data.selectedFloorType === 'OpenPlot') {
    if (!data.constructionTypeId || String(data.constructionTypeId).trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'floor.errors.openPlotConstructionTypeNotFound',
        path: ['constructionTypeId'],
      });
    }
  }

  if (data.selectedFloorType !== 'OpenPlot') {
    // Validate floor
    if (!data.floor || data.floor.length === 0 || !isValidDropdownValue(data.floor)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Floor is required',
        path: ['floor'],
      });
    }

    // Validate conYr
    if (!data.conYr || data.conYr.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Construction year is required',
        path: ['conYr'],
      });
    } else if (!/^\d*$/.test(data.conYr)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Construction year must contain only numbers',
        path: ['conYr'],
      });
    } else if (data.conYr.length !== 4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Construction year must be exactly 4 digits',
        path: ['conYr'],
      });
    } else {
      const year = parseInt(data.conYr, 10);
      if (year < 1700 || year > currentFinancialStartYear) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Construction year must be between 1700 and the current financial year (${currentFinancialStartYear})`,
          path: ['conYr'],
        });
      }
    }

    // Validate conTyp
    if (!data.conTyp || data.conTyp.length === 0 || !isValidDropdownValue(data.conTyp)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Construction type is required',
        path: ['conTyp'],
      });
    }

    // Validate rooms
    const isUtilityCategory = checkIsUtilityCategory(data.typeOfUseCategoryId);

    if (!isUtilityCategory) {
      if (!data.rooms || data.rooms.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Number of rooms is required',
          path: ['rooms'],
        });
      } else {
        const num = parseInt(data.rooms, 10);
        if (isNaN(num) || num <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Number of rooms must be a positive number',
            path: ['rooms'],
          });
        }
      }
    }
  }

  // If it's an update, skip validation to allow existing database values
  if (data.isAddingNewFloor === false) return;

  const hasValidId = data.id !== undefined && data.id !== null && data.id !== '' && data.id !== 'new' && Number(data.id) > 0;
  if (hasValidId) return;

  // Only validate conYr vs asstYr if we are in Construction mode and both are present
  if (data.selectedFloorType !== 'OpenPlot' && data.conYr && data.asstYr) {
    const conYear = parseInt(data.conYr, 10);
    const asstYear = parseInt(data.asstYr, 10);
    if (!isNaN(conYear) && !isNaN(asstYear) && asstYear < conYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Assessment year cannot be less than construction year',
        path: ['asstYr'],
      });
    }
  }
}).refine((data) => {
  if (!data.conYr || !data.asstYr) return true;
  const conYear = parseInt(data.conYr, 10);
  const asstYear = parseInt(data.asstYr, 10);
  if (isNaN(conYear) || isNaN(asstYear)) return true;
  return asstYear >= conYear;
}, {
  message: 'Assessment year cannot be less than construction year',
  path: ['asstYr'],
});

export type FloorFormData = z.infer<typeof floorFormSchema>;
