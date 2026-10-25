import {
  GrievanceCategoryFormModel,
  Priority,
  EscalationLevel,
  PRIORITIES,
  ESCALATION_LEVELS,
} from '@/types/grievance-category-master/grievanceCategory.types';
import { TEXT_ALLOWED, isAllZeros } from './validation-rules';
import { GrievanceCategoryValidationInput } from './grievance-category-validation-helpers';

// Re-export helper types and functions for backwards compatibility and clean imports
export {
  createGrievanceCategoryValidationTranslator,
  resolveGrievanceCategoryServerError,
  type GrievanceCategoryValidationInput,
  type ValidationTranslatorOptions,
  type ValidationTranslator,
} from './grievance-category-validation-helpers';

// Local overrides to avoid modifying shared global files
const GRIEVANCE_CODE_REGEX = /^[A-Za-z0-9]+([A-Za-z0-9-]*[A-Za-z0-9]+)*$/;

/**
 * Sanitizes field values for grievance category form before submission
 */
export const sanitizeGrievanceCategoryField = (field: string, value: unknown): unknown => {
  if (typeof value === 'string') {
    if (field === 'categoryCode') {
      return value
        .toUpperCase()
        .trim()
        .replace(/[^A-Z0-9-]/g, '');
    }
    if (field === 'description') {
      // Let validation handle max length - return full value for proper feedback
      return value.trim();
    }
    return value.trim();
  }
  return value;
};

/**
 * Alias for sanitizeGrievanceCategoryField used in tests
 */
export const normalizeGrievanceCategoryFieldValue = sanitizeGrievanceCategoryField;

/**
 * Validates a single field of the grievance category form
 */
export const validateGrievanceCategoryField = (
  _formData: Partial<GrievanceCategoryFormModel>,
  field: keyof GrievanceCategoryFormModel,
  value: unknown,
  translate: (key: string, replacements?: Record<string, unknown>) => string
): string | null => {
  switch (field) {
    case 'categoryCode':
      if (!value || String(value).trim() === '') return translate('errors.codeReq');
      if (String(value).trim().length < 2) return translate('errors.codeMinLength');
      if (!GRIEVANCE_CODE_REGEX.test(String(value))) return translate('errors.codeAlphanumeric');
      if (isAllZeros(String(value))) return translate('errors.codeInvalid');
      if (String(value).length > 20) return translate('errors.codeMaxLength');
      return null;
    case 'categoryName':
      if (!value || String(value).trim() === '') return translate('errors.nameReq');
      if (!TEXT_ALLOWED.test(String(value))) return translate('errors.invalidFormat');
      if (String(value).length < 3) return translate('errors.nameMinLength');
      if (String(value).length > 100) return translate('errors.nameMaxLength');
      return null;
    case 'departmentId': {
      if (value === null || value === undefined || value === '' || value === 0 || value === '0')
        return translate('errors.departmentReq');
      const deptNum = Number(value);
      if (isNaN(deptNum) || deptNum < 1 || !Number.isInteger(deptNum))
        return translate('errors.invalidDept');
      return null;
    }
    case 'priority':
      if (!value) return translate('errors.invalidPriority');
      if (!PRIORITIES.includes(value as Priority)) return translate('errors.invalidPriority');
      return null;
    case 'resolutionSla':
      if (!value || String(value).trim() === '') return translate('errors.slaReq');
      const slaNum = Number(value);
      if (isNaN(slaNum) || slaNum <= 0 || !Number.isInteger(slaNum))
        return translate('errors.slaPositiveInteger');
      if (String(value).length > 3) return translate('errors.slaMaxLength');
      if (slaNum > 365) return translate('errors.slaMaxDays');
      return null;
    case 'escalationLevel':
      if (!value) return translate('errors.invalidEscalation');
      if (!ESCALATION_LEVELS.includes(value as EscalationLevel))
        return translate('errors.invalidEscalation');
      return null;
    case 'description':
      if (value && String(value).length > 0 && String(value).length < 3)
        return translate('errors.descMinLength');
      if (value && String(value).length > 500) return translate('errors.descMaxLength');
      if (value && /[<>]/.test(String(value)))
        return translate('errors.descNoHtml');
      if (value) {
        const words = String(value).trim().split(/\s+/).filter(Boolean);
        if (words.length > 500) {
          return translate('errors.descMaxWords');
        }
      }
      return null;
    default:
      return null;
  }
};

/**
 * Validates the entire grievance category form
 * Accepts either GrievanceCategoryFormModel or raw validation input from server actions
 */
export const validateGrievanceCategory = (
  formData: GrievanceCategoryFormModel | GrievanceCategoryValidationInput,
  translate: (key: string, replacements?: Record<string, unknown>) => string
): Record<string, string> => {
  const errors: Record<string, string> = {};

  const fieldsToValidate: (keyof GrievanceCategoryFormModel)[] = [
    'categoryCode',
    'categoryName',
    'departmentId',
    'priority',
    'resolutionSla',
    'escalationLevel',
    'description',
  ];

  fieldsToValidate.forEach((field) => {
    const value = formData[field as keyof typeof formData];
    const error = validateGrievanceCategoryField(
      formData as Partial<GrievanceCategoryFormModel>,
      field,
      value,
      translate
    );
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
};
