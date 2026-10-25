/**
 * Validation logic for SubFloor form
 */

import {
  CODE_REGEX,
  CODE_SANITIZE,
  DESCRIPTION_REGEX,
  DESCRIPTION_SANITIZE,
  DESCRIPTION_ENGLISH_REGEX,
  DESCRIPTION_ENGLISH_SANITIZE,
  commonValidations,
} from '@/lib/utils/validation';
import { SubFloorFormModel } from '@/types/floor.types';

/* ================= CONSTANTS ================= */
export const SUBFLOOR_CODE_MAX = 10;
export const DESCRIPTION_MAX = 200;
export const DESCRIPTION_ENGLISH_MAX = 100;

export { DESCRIPTION_ENGLISH_REGEX, DESCRIPTION_ENGLISH_SANITIZE };

/* ================= TYPES ================= */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranslateFunction = (key: string, params?: Record<string, any>) => string;

/* ================= VALIDATION ================= */
export function validateSubFloorForm(
  data: SubFloorFormModel,
  t: TranslateFunction,
  isEdit: boolean
): Partial<Record<keyof SubFloorFormModel, string>> {
  const errors: Partial<Record<keyof SubFloorFormModel, string>> = {};

  const code = data.subFloorCode.trim();
  const descriptionEnglish = data.descriptionEnglish?.trim() ?? '';
  const description = data.description.trim();

  // SubFloor Code validation
  if (!code) {
    errors.subFloorCode = t('form.validation.codeRequired');
  } else if (code.length > SUBFLOOR_CODE_MAX) {
    errors.subFloorCode = t('form.validation.codeMaxLength', { count: SUBFLOOR_CODE_MAX });
  } else if (!CODE_REGEX.test(code)) {
    errors.subFloorCode = t('form.validation.codeFormat');
  }

  // Description (English) validation - Required, English characters, max length, no all-zeros
  const descEngError = commonValidations.masterDescriptionEnglish(t, DESCRIPTION_ENGLISH_MAX, {
    required: 'form.validation.descriptionEnglishRequired',
    maxLength: 'form.validation.descriptionMaxLength',
    allZeros: 'form.validation.descriptionEnglishAllZeros',
    englishOnly: 'form.validation.englishOnly',
  })(descriptionEnglish);
  if (descEngError) {
    errors.descriptionEnglish = descEngError;
  }

  // Description validation
  if (!description) {
    errors.description = t('form.validation.descriptionRequired');
  } else if (description.length > DESCRIPTION_MAX) {
    errors.description = t('form.validation.descriptionMaxLength', { count: DESCRIPTION_MAX });
  } else if (!DESCRIPTION_REGEX.test(description)) {
    errors.description = t('form.validation.descriptionFormat');
  }

  // SequenceNo validation
  if (data.sequenceNo === null || data.sequenceNo === undefined || data.sequenceNo === '') {
    errors.sequenceNo = t('form.validation.sequenceNoRequired');
  }

  // isActive validation
  const isActiveError = commonValidations.masterActiveStatus(t, isEdit)(data.isActive);
  if (isActiveError) {
    errors.isActive = isActiveError;
  }

  return errors;
}

/* ================= SANITIZATION ================= */
export function sanitizeSubFloorCode(value: string): string {
  let sanitized = value.replace(CODE_SANITIZE, '');
  if (sanitized.length > SUBFLOOR_CODE_MAX) {
    sanitized = sanitized.substring(0, SUBFLOOR_CODE_MAX);
  }
  return sanitized;
}

export function sanitizeDescription(value: string): string {
  let sanitized = value.replace(DESCRIPTION_SANITIZE, '');
  if (sanitized.length > DESCRIPTION_MAX) {
    sanitized = sanitized.substring(0, DESCRIPTION_MAX);
  }
  return sanitized;
}

export function sanitizeDescriptionEnglish(value: string): string {
  let sanitized = value.replace(DESCRIPTION_ENGLISH_SANITIZE, '');
  if (sanitized.length > DESCRIPTION_ENGLISH_MAX) {
    sanitized = sanitized.substring(0, DESCRIPTION_ENGLISH_MAX);
  }
  return sanitized;
}
