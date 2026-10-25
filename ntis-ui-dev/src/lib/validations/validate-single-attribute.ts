import {
  FlatSocialAttributeState,
  isAttributeEnabled,
  getLocalizedName,
} from '@/lib/utils/social-details';
import { getMinMaxValues } from './social-validation-rules';

/**
 * Validates a single flat social attribute.
 */
export function validateSingleSocialAttribute(
  attr: FlatSocialAttributeState,
  data: Record<number, FlatSocialAttributeState>,
  t?: {
    (key: string, values?: Record<string, string | number | Date>): string;
    has?: (key: string) => boolean;
  },
  ignorePhotoRequirement: boolean = false
): string | null {
  const getErr = (
    key: string,
    defaultMsg: string,
    values?: Record<string, string | number | Date>
  ) => {
    const fullKey = `discount.socialValidation.${key}`;
    if (t && typeof t.has === 'function' && t.has(fullKey)) {
      return t(fullKey, values);
    }
    if (values) {
      let msg = defaultMsg;
      Object.entries(values).forEach(([k, v]) => {
        msg = msg.replace(`{${k}}`, String(v));
      });
      return msg;
    }
    return defaultMsg;
  };

  const isEnabled = isAttributeEnabled(attr, data);
  if (!isEnabled) return null;
  if (attr.isInherited && !attr.isOverridden) return null;

  const isSpecialToggle =
    attr.socialAttributeCode.toUpperCase() === 'ROAD_WIDTH' ||
    attr.socialAttributeCode.toUpperCase().includes('WATER_CONN') ||
    attr.socialAttributeCode.toUpperCase().includes('TREE');

  const isRequired =
    (attr.isRequiredWhenParentTrue && !(attr.dataType === 'BIT' && !attr.parentAttributeId)) ||
    (isSpecialToggle && attr.bitValue === true);

  if (isRequired) {
    let isEmpty = false;
    if (
      attr.dataType === 'INT' &&
      (attr.intValue === null || attr.intValue === undefined || String(attr.intValue) === '')
    ) {
      isEmpty = true;
    } else if (
      attr.dataType === 'DECIMAL' &&
      (attr.decimalValue === null ||
        attr.decimalValue === undefined ||
        String(attr.decimalValue) === '')
    ) {
      isEmpty = true;
    } else if (attr.dataType === 'DATE' && (!attr.dateValue || attr.dateValue.trim() === '')) {
      isEmpty = true;
    } else if (attr.dataType === 'TEXT' && (!attr.textValue || attr.textValue.trim() === '')) {
      isEmpty = true;
    } else if (attr.dataType === 'BIT' && (attr.bitValue === null || attr.bitValue === undefined)) {
      isEmpty = true;
    }

    if (isEmpty) {
      const fieldName = getLocalizedName(attr.socialAttributeCode, attr.socialAttributeName, t);
      return getErr('required', '{fieldName} is required.', { fieldName });
    }
  }

  const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";
  const isValidGuid = (guid?: string | null): boolean => {
    if (!guid || typeof guid !== "string") return false;
    const trimmed = guid.trim();
    return trimmed !== "" && trimmed !== EMPTY_GUID && trimmed !== "pending" && trimmed !== "null" && trimmed !== "undefined";
  };

  const hasValidPhotoBinding = attr.photoBindingId != null && Number(attr.photoBindingId) > 0;
  const hasValidDocumentBinding = attr.documentBindingId != null && Number(attr.documentBindingId) > 0;
  const hasFileName = Boolean(attr.fileName && attr.fileName.trim() !== '');

  const hasPhotoAttachment = Boolean(
    (attr.pendingFile && !attr.isUploading) ||
    isValidGuid(attr.uploadedGuid) ||
    isValidGuid(attr.photoGuid) ||
    hasValidPhotoBinding ||
    (hasValidDocumentBinding && hasFileName) ||
    isValidGuid(attr.documentGuid) ||
    Boolean(attr.documentUrl && attr.documentUrl.trim() !== '')
  );

  const hasDocumentAttachment = Boolean(
    (attr.pendingFile && !attr.isUploading) ||
    isValidGuid(attr.uploadedGuid) ||
    isValidGuid(attr.documentGuid) ||
    hasValidDocumentBinding ||
    (hasValidPhotoBinding && hasFileName) ||
    isValidGuid(attr.photoGuid) ||
    Boolean(attr.documentUrl && attr.documentUrl.trim() !== '')
  );

  if (attr.isPhotoRequired && !ignorePhotoRequirement) {
    if (!hasPhotoAttachment) {
      return getErr('photoRequired', 'Photo is required.');
    }
  }

  if (attr.isDocumentRequired) {
    if (!hasDocumentAttachment) {
      return getErr('documentRequired', 'Document is required.');
    }
  }

  if (
    attr.dataType === 'INT' &&
    attr.intValue !== null &&
    attr.intValue !== undefined &&
    String(attr.intValue) !== ''
  ) {
    const val = Number(attr.intValue);
    const code = attr.socialAttributeCode.toUpperCase();
    const strVal = String(attr.intValue).replace(/\D/g, '');
    const isYear = code === 'WATER_CONN_YEAR';
    const isTree = code.includes('TREE');
    const isSolar = code.includes('SOLAR');
    const digitsLimit = isYear ? 4 : isTree ? 6 : isSolar ? 4 : 3;

    if (isNaN(val) || !Number.isInteger(val)) {
      return getErr('invalidInteger', 'Value must be a valid integer.');
    } else if (val < 0) {
      return getErr('negativeNotAllowed', 'Value cannot be negative.');
    } else if (val === 0) {
      if (code === 'WATER_CONN_YEAR') {
        const { max } = getMinMaxValues(code);
        return getErr('yearRange', `Year must be between 1900 and ${max}.`, {
          max: max ?? new Date().getFullYear(),
        });
      }
      if (
        code === 'GREEN_PROPERTY_STAR' ||
        code === 'GREEN_PROPERTY_STAR_RATING' ||
        code.includes('STAR_RATING') ||
        code.includes('STAR_RAT')
      ) {
        return getErr('ratingRange', 'Rating must be between 1 and 5.');
      }
      return getErr('countMin', 'Count must be at least 1.');
    } else if (strVal.length > digitsLimit) {
      return code === 'WATER_CONN_YEAR'
        ? getErr('yearMaxDigits', 'Year cannot exceed 4 digits.')
        : getErr('maxDigits', `Value cannot exceed ${digitsLimit} digits.`, {
            digits: digitsLimit,
          });
    } else if (attr.isRequiredWhenParentTrue && val < 1) {
      return getErr('countMin', 'Count must be at least 1.');
    } else {
      const { min, max } = getMinMaxValues(code);
      if (val < min) {
        if (
          code === 'GREEN_PROPERTY_STAR' ||
          code === 'GREEN_PROPERTY_STAR_RATING' ||
          code.includes('STAR_RATING') ||
          code.includes('STAR_RAT')
        ) {
          return getErr('ratingRange', 'Rating must be between 1 and 5.');
        } else if (code === 'WATER_CONN_YEAR') {
          return getErr('yearRange', `Year must be between 1900 and ${max}.`, {
            max: max ?? new Date().getFullYear(),
          });
        } else {
          return getErr('minVal', `Value cannot be less than ${min}.`, { min });
        }
      } else if (max !== undefined && val > max) {
        if (code.includes('BOREWELL')) {
          return getErr('maxBorewell', 'Number of borewells cannot exceed 50.');
        } else if (code.includes('WELL') && !code.includes('BOREWELL')) {
          return getErr('maxWell', 'Number of wells cannot exceed 50.');
        } else if (code.includes('LIFT')) {
          return getErr('maxLift', 'Number of lifts cannot exceed 100.');
        } else if (code.includes('SOLAR')) {
          return getErr('maxSolar', 'Number of solar units cannot exceed 5000.');
        } else if (code.includes('SWIMMING')) {
          return getErr('maxSwimming', 'Number of swimming pools cannot exceed 20.');
        } else if (code.includes('TREE')) {
          return getErr('maxTree', 'Number of trees cannot exceed 100,000.');
        } else if (
          code === 'GREEN_PROPERTY_STAR' ||
          code === 'GREEN_PROPERTY_STAR_RATING' ||
          code.includes('STAR_RATING') ||
          code.includes('STAR_RAT')
        ) {
          return getErr('ratingRange', 'Rating must be between 1 and 5.');
        } else if (code === 'WATER_CONN_YEAR') {
          return getErr('yearRange', `Year must be between 1900 and ${max}.`, {
            max: max ?? new Date().getFullYear(),
          });
        } else {
          return getErr('maxVal', `Value cannot exceed ${max.toLocaleString()}.`, {
            max: max.toLocaleString(),
          });
        }
      }
    }
  }

  if (
    attr.dataType === 'DECIMAL' &&
    attr.decimalValue !== null &&
    attr.decimalValue !== undefined &&
    String(attr.decimalValue) !== ''
  ) {
    const val = Number(attr.decimalValue);
    const code = attr.socialAttributeCode.toUpperCase();
    const strVal = String(attr.decimalValue);
    const hasMoreThanTwoDecimals = strVal.includes('.') && strVal.split('.')[1].length > 2;

    if (isNaN(val)) {
      return getErr('invalidDecimal', 'Value must be a valid number.');
    } else if (val < 0) {
      return getErr('negativeNotAllowed', 'Value cannot be negative.');
    } else if (hasMoreThanTwoDecimals) {
      return getErr('maxTwoDecimals', 'Maximum 2 decimal places allowed.');
    } else if (attr.isRequiredWhenParentTrue && val <= 0) {
      return getErr('countMin', 'Value must be greater than 0.');
    } else {
      const { min, max } = getMinMaxValues(code);
      if (val < min) {
        if (
          code.includes('STAR_RATING') ||
          code.includes('STAR_RAT') ||
          code === 'GREEN_PROPERTY_STAR'
        ) {
          return getErr('ratingRange', 'Rating must be between 1 and 5.');
        } else {
          return getErr('minVal', `Value cannot be less than ${min}.`, { min });
        }
      } else if (max !== undefined && val > max) {
        if (
          code.includes('STAR_RATING') ||
          code.includes('STAR_RAT') ||
          code === 'GREEN_PROPERTY_STAR'
        ) {
          return getErr('ratingRange', 'Rating must be between 1 and 5.');
        } else if (code === 'ROAD_WIDTH') {
          return getErr('maxRoad', 'Road width cannot exceed 500.');
        } else if (code.includes('CAPACITY')) {
          return getErr('maxCapacity', 'Capacity cannot exceed 100,000.');
        } else {
          return getErr('maxVal', `Value cannot exceed ${max.toLocaleString()}.`, {
            max: max.toLocaleString(),
          });
        }
      }
    }
  }

  if (
    attr.dataType === 'TEXT' &&
    attr.textValue !== null &&
    attr.textValue !== undefined &&
    String(attr.textValue) !== ''
  ) {
    const val = attr.textValue.trim();
    const code = attr.socialAttributeCode.toUpperCase();
    if (code.includes('WATER_CONN') || code.includes('STATUS')) {
      if (val.length < 3) {
        return getErr(
          'minWaterConnStatus',
          'Water Connection Status must be at least 3 characters long.'
        );
      } else if (val.length > 30) {
        return getErr('maxWaterConnStatus', 'Water Connection Status cannot exceed 30 characters.');
      }
    } else {
      if (val.length < 2) {
        return getErr('minTextLength', 'Value must be at least 2 characters long.');
      } else if (val.length > 100) {
        return getErr('maxTextLength', 'Value cannot exceed 100 characters.');
      }
    }
  }

  return null;
}
