/**
 * Validation logic for Floor form
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
import { FloorFormModel } from '@/types/floor.types';

/* ================= CONSTANTS ================= */
export const FLOOR_CODE_MAX = 5;
export const DESCRIPTION_MAX = 100;

export { DESCRIPTION_ENGLISH_REGEX, DESCRIPTION_ENGLISH_SANITIZE };

/* ================= TYPES ================= */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranslateFunction = (key: string, params?: Record<string, any>) => string;

/* ================= VALIDATION ================= */
export function validateFloorForm(
  data: FloorFormModel,
  t: TranslateFunction,
  isEdit: boolean
): Partial<Record<keyof FloorFormModel, string>> {
  const errors: Partial<Record<keyof FloorFormModel, string>> = {};

  const floorCode = data.floorCode.trim();
  const descriptionEnglish = data.descriptionEnglish?.trim() ?? '';
  const description = data.description.trim();

  // Floor Code validation
  if (!floorCode) {
    errors.floorCode = t('form.validation.codeRequired');
  } else if (floorCode.length > FLOOR_CODE_MAX) {
    errors.floorCode = t('form.validation.codeMaxLength', { count: FLOOR_CODE_MAX });
  } else if (!CODE_REGEX.test(floorCode)) {
    errors.floorCode = t('form.validation.codeFormat');
  }

  // Description (English) validation - Required, English characters, max length, no all-zeros
  const descEngError = commonValidations.masterDescriptionEnglish(t, DESCRIPTION_MAX, {
    required: 'form.validation.descriptionEnglishRequired',
    maxLength: 'form.validation.descriptionMaxLength',
    allZeros: 'form.validation.descriptionEnglishAllZeros',
    englishOnly: 'form.validation.englishOnly',
  })(descriptionEnglish);
  if (descEngError) {
    errors.descriptionEnglish = descEngError;
  }

  // Description validation (Regional Description - Mandatory)
  if (!description) {
    errors.description = t('form.validation.descriptionRequired');
  } else if (description.length > DESCRIPTION_MAX) {
    errors.description = t('form.validation.descriptionMaxLength', { count: DESCRIPTION_MAX });
  } else if (!DESCRIPTION_REGEX.test(description)) {
    errors.description = t('form.validation.descriptionFormat');
  }

  // Sequence number validation (0 is treated as "not provided" since empty input becomes 0)
  if (data.sequenceNo === 0) {
    errors.sequenceNo = t('form.validation.sequenceNoRequired');
  } else if (!Number.isFinite(data.sequenceNo) || data.sequenceNo < 1) {
    errors.sequenceNo = t('validation.mustBeNumber');
  } else if (!Number.isInteger(data.sequenceNo)) {
    errors.sequenceNo = t('validation.mustBeNumber');
  } else if (data.sequenceNo > 999) {
    errors.sequenceNo = t('form.validation.rangeMaxValue', { count: 999 });
  }

  // Flat Generation Group validation
  if (!data.fLatGenerationGroupId || data.fLatGenerationGroupId <= 0) {
    errors.fLatGenerationGroupId = t('form.validation.flatGenerationGroupRequired');
  }

  // Flat Generation Sequence validation
  if (!data.fLatGenerationSeq || data.fLatGenerationSeq <= 0) {
    errors.fLatGenerationSeq = t('form.validation.flatGenerationSeqRequired');
  } else if (!Number.isFinite(data.fLatGenerationSeq) || !Number.isInteger(data.fLatGenerationSeq)) {
    errors.fLatGenerationSeq = t('validation.mustBeNumber');
  }

  // isActive validation
  const isActiveError = commonValidations.masterActiveStatus(t, isEdit)(data.isActive);
  if (isActiveError) {
    errors.isActive = isActiveError;
  }

  return errors;
}

/* ================= SANITIZATION ================= */
export function sanitizeFloorCode(value: string): string {
  let sanitized = value.replace(CODE_SANITIZE, '');
  if (sanitized.length > FLOOR_CODE_MAX) {
    sanitized = sanitized.substring(0, FLOOR_CODE_MAX);
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
  if (sanitized.length > DESCRIPTION_MAX) {
    sanitized = sanitized.substring(0, DESCRIPTION_MAX);
  }
  return sanitized;
}
