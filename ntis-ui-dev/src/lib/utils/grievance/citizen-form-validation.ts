/**
 * Citizen Grievance Registration Form Validation Rules & Engine
 * Enforces strict bilingual validation for Department, Location, Description, and Contact info.
 */

import { normalizeDevanagariDigits } from './devanagari';
import type { GrievanceTypeItem } from '@/types/grievance/department-master.types';

/**
 * Robust grievance defect type resolver.
 * Handles exact matches, case-insensitive trimmed strings, numeric IDs, and substring matches.
 */
export function resolveGrievanceTypeItem(
  defectType: string | undefined | null,
  defectTypes: GrievanceTypeItem[]
): GrievanceTypeItem | undefined {
  if (!defectType || !Array.isArray(defectTypes) || defectTypes.length === 0) {
    return undefined;
  }

  const clean = defectType.trim();
  if (!clean) return undefined;
  const lower = clean.toLowerCase();

  // 1. Exact match
  const exact = defectTypes.find((t) => t.grievanceType === clean);
  if (exact) return exact;

  // 2. Case-insensitive trimmed match
  const caseInsensitive = defectTypes.find(
    (t) => (t.grievanceType || '').trim().toLowerCase() === lower
  );
  if (caseInsensitive) return caseInsensitive;

  // 3. Numeric ID match (e.g. from existing ticket ID or string numeric value)
  const idMatch = defectTypes.find((t) => String(t.id) === clean);
  if (idMatch) return idMatch;

  // 4. Substring / contains match
  const partial = defectTypes.find((t) => {
    const tLower = (t.grievanceType || '').trim().toLowerCase();
    return (tLower.length >= 3 && lower.includes(tLower)) || (lower.length >= 3 && tLower.includes(lower));
  });
  if (partial) return partial;

  return undefined;
}

/**
 * Resolves a verified numeric grievance type ID. Returns undefined if unresolvable.
 */
export function resolveGrievanceTypeId(
  defectType: string | undefined | null,
  defectTypes: GrievanceTypeItem[]
): number | undefined {
  const item = resolveGrievanceTypeItem(defectType, defectTypes);
  const rawId = Number(item?.id);
  return !isNaN(rawId) && rawId > 0 ? rawId : undefined;
}

export interface GrievanceFormErrors {
  department?: string;
  defectType?: string;
  roadLandmark?: string;
  description?: string;
  fullName?: string;
  mobile?: string;
}

export interface ValidationValues {
  selectedDept: unknown;
  defectType?: string;
  grievanceTypeId?: number | null;
  hasLiveTypesConfigured?: boolean;
  roadLandmark: string;
  description: string;
  fullName?: string;
  mobile?: string;
  validateContact?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: GrievanceFormErrors;
  firstError?: string;
}

export interface RoadLandmarkValidationOptions {
  isRequired?: boolean;
}

/**
 * Validates Road Name / Landmark across Citizen Raise Grievance and On-The-Go forms.
 * Enforces:
 * - Required (when isRequired: true)
 * - Minimum length (at least 5 characters after trimming)
 * - Maximum length (at most 250 characters)
 * - Meaningful content (must contain letters or digits)
 * - Allowed characters (letters, numbers, spaces, commas, periods, /, -, #, (), ')
 * - Multi-script support (English, Marathi, Hindi and Unicode scripts)
 */
export function validateRoadLandmark(
  value: string | undefined | null,
  options: RoadLandmarkValidationOptions = { isRequired: true },
  translate?: (key: string) => string
): string | undefined {
  const t = translate || ((key: string) => key);
  const trimmed = (value || '').normalize('NFC').trim();

  // 1. Whitespace / Required Check
  if (!trimmed) {
    if (options.isRequired) {
      return t('roadLandmarkRequiredError') || 'Address or landmark cannot be empty';
    }
    return undefined;
  }

  // 2. Minimum Length (At least 5 characters)
  if (trimmed.length < 5) {
    return t('roadLandmarkMinLengthError') || 'Landmark must be at least 5 characters';
  }

  // 3. Maximum Length (At most 250 characters)
  if (trimmed.length > 250) {
    return t('roadLandmarkMaxLengthError') || 'Landmark cannot exceed 250 characters';
  }

  // 4. Meaningful Content (Must contain letters or digits)
  const hasAlphanumeric = /[\p{L}\p{N}]/u.test(trimmed);
  if (!hasAlphanumeric) {
    return t('roadLandmarkMeaningfulError') || 'Landmark must contain letters or numbers';
  }

  // 5. Allowed Characters (Letters, combining marks/matras, numbers, spaces, commas, periods, /, -, #, (), ')
  const allowedCharsRegex = /^[\p{L}\p{M}\p{N}\s,./#\-_()']+$/u;
  if (!allowedCharsRegex.test(trimmed)) {
    return (
      t('roadLandmarkAllowedCharsError') ||
      'Only letters, numbers, spaces, commas, periods, /, -, and # are allowed'
    );
  }

  return undefined;
}

export interface CitizenFullNameValidationOptions {
  isRequired?: boolean;
  minLength?: number;
  maxLength?: number;
}

/**
 * Sanitizes citizen name input on keystroke or paste:
 * - Allows Unicode letters (\p{L}), combining marks/matras (\p{M}), spaces (\s), dots, and apostrophes.
 * - Strips hyphens (-), numbers (\p{N}), and special characters (+, @, #, $, etc.).
 * - Prevents multiple consecutive spaces or leading dots/apostrophes.
 */
export function sanitizeCitizenName(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .replace(/[^\p{L}\p{M}\s.']/gu, '')
    .replace(/^['.\s]+/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/'{2,}/g, "'")
    .replace(/\s{2,}/g, ' ');
}

/**
 * Validates Citizen Full Name across Citizen Form Wizard and On-The-Go intake form.
 */
export function validateCitizenFullName(
  value: string | undefined | null,
  options: CitizenFullNameValidationOptions = { isRequired: true, minLength: 2, maxLength: 100 },
  translate?: (key: string) => string
): string | undefined {
  const t = translate || ((key: string) => key);
  const trimmed = (value || '').normalize('NFC').trim();
  const minLength = options.minLength ?? 2;
  const maxLength = options.maxLength ?? 100;

  if (!trimmed) {
    return options.isRequired ? t('fullNameRequiredError') : undefined;
  }
  if (trimmed.length < minLength) return t('fullNameMinLengthError');
  if (trimmed.length > maxLength) return t('fullNameMaxLengthError');
  if (/[\d\p{N}]/u.test(trimmed)) return t('fullNameNoNumbersError');

  const allowedNameRegex = /^[\p{L}\p{M}\s.']+$/u;
  if (!allowedNameRegex.test(trimmed)) return t('fullNameInvalidCharsError');

  const letterCount = (trimmed.match(/[\p{L}]/gu) || []).length;
  if (letterCount < 2) return t('fullNameMinLengthError');
  if (/['.’]{2,}/.test(trimmed) || /^[']|[']$/.test(trimmed)) {
    return t('fullNameInvalidCharsError');
  }

  return undefined;
}

export function validateGrievanceForm(
  values: ValidationValues,
  translate?: (key: string) => string
): ValidationResult {
  const t = translate || ((key: string) => key);
  const errors: GrievanceFormErrors = {};

  // 1. Department Selection (Mandatory)
  if (!values.selectedDept) {
    errors.department = t('deptRequiredError');
  }

  // 2. Grievance Type / Category (Mandatory for backend integer FK)
  if (values.selectedDept) {
    if (values.hasLiveTypesConfigured === false) {
      errors.defectType =
        t('noDefectTypesForDeptError') ||
        'This department has no grievance categories configured yet. Please select another department.';
    } else if (!values.defectType || !values.grievanceTypeId || values.grievanceTypeId <= 0) {
      errors.defectType = t('defectTypeRequiredError') || 'Please select a grievance type.';
    }
  }

  // 3. Road / Landmark (Mandatory)
  const landmarkError = validateRoadLandmark(values.roadLandmark, { isRequired: true }, t);
  if (landmarkError) {
    errors.roadLandmark = landmarkError;
  }

  // 3. Grievance Description (Mandatory: min 10 chars, max 1000 chars)
  const trimmedDesc = (values.description || '').normalize('NFC').trim();
  const lowerDesc = trimmedDesc.toLowerCase();
  const keyboardPatterns = ['qwerty', 'asdfgh', 'zxcvbn', 'sdfghj', 'dfghjk', 'fghjkl'];
  const isGibberishDesc =
    keyboardPatterns.some((p) => lowerDesc.includes(p)) ||
    /([a-z0-9])\1{4,}/i.test(lowerDesc);

  if (!trimmedDesc) {
    errors.description = t('descriptionRequired') || 'Description is required';
  } else if (isGibberishDesc) {
    errors.description =
      t('aiNonCivicDescription') ||
      'The provided text contains random characters and gibberish, which does not describe any valid municipal or civic issue.';
  } else if (trimmedDesc.length < 10) {
    errors.description = t('descriptionMinLengthError') || 'Please provide at least 10 characters description';
  } else if (trimmedDesc.length > 1000) {
    errors.description = t('descriptionMaxLengthError') || 'Description cannot exceed 1000 characters';
  }

  // 4 & 5. Citizen Full Name and Mobile (Validated unless validateContact is false)
  if (values.validateContact !== false) {
    const fullNameError = validateCitizenFullName(values.fullName, { isRequired: true }, t);
    if (fullNameError) {
      errors.fullName = fullNameError;
    }

    const rawMobile = normalizeDevanagariDigits(values.mobile || '').trim();
    const cleanMobile = rawMobile.replace(/\D/g, '');
    if (!cleanMobile) {
      errors.mobile = t('mobileRequiredError');
    } else if (cleanMobile.length !== 10) {
      errors.mobile = t('mobileLengthError');
    } else if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      errors.mobile = t('mobileFormatError');
    }
  }

  const errorKeys = Object.keys(errors) as (keyof GrievanceFormErrors)[];
  return {
    isValid: errorKeys.length === 0,
    errors,
    firstError: errorKeys.length > 0 ? errors[errorKeys[0]] : undefined,
  };
}
