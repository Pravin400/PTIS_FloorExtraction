import {
  validateForm
} from "@/lib/utils/validation";
import {
  CODE_SANITIZE,
  DESCRIPTION_SANITIZE,
  CODE_REGEX,
  DESCRIPTION_REGEX,
  isAllZeros
} from "@/lib/utils/asset-validation-rules";
import { AssetPhotoTypeFormModel } from "@/types/asset-masters/asset-photo-type.types";
import { mapSharedApiError, translateReferenceBlockedMessage } from "@/lib/utils/asset-utils/shared-error-mapping";

export const CODE_MAX = 20;
export const NAME_MAX = 100;
export const DESCRIPTION_MAX = 100;

export const sanitizeFieldValue = (name: string, value: string): string => {
  let sanitizedValue = value;
  if (name === "description") {
    sanitizedValue = value.replace(DESCRIPTION_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ");
    if (sanitizedValue.length > DESCRIPTION_MAX) {
      sanitizedValue = sanitizedValue.substring(0, DESCRIPTION_MAX);
    }
  } else if (name === "photoTypeName") {
    sanitizedValue = value.replace(/[^\p{L}\p{M}\p{N}\s\-()\/&,.]/gu, "").trimStart().replace(/\s{2,}/g, " ");
    if (sanitizedValue.length > NAME_MAX) {
      sanitizedValue = sanitizedValue.substring(0, NAME_MAX);
    }
  } else if (name === "photoTypeCode") {
    sanitizedValue = value.replace(CODE_SANITIZE, "").toUpperCase();
    if (sanitizedValue.length > CODE_MAX) {
      sanitizedValue = sanitizedValue.substring(0, CODE_MAX);
    }
  }
  return sanitizedValue;
};

export const validateAssetPhotoForm = (
  data: AssetPhotoTypeFormModel,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  isEdit: boolean
): Partial<Record<keyof AssetPhotoTypeFormModel, string>> => {
  const schema = {
    photoTypeCode: (value: unknown) => {
      const strVal = String(value ?? '').trim();
      if (!strVal) return t('form.validation.photoTypeCodeRequired');
      if (strVal.length > CODE_MAX) return t('form.validation.photoTypeCodeMaxLength', { count: CODE_MAX });
      if (isAllZeros(strVal)) return t('form.validation.invalidFormat', { default: 'Invalid format' });
      if (!CODE_REGEX.test(strVal)) return t('form.validation.photoTypeCodeFormat');
      return undefined;
    },
    photoTypeName: (val: unknown) => {
      const str = String(val ?? '').trim();
      if (!str) return t('form.validation.photoTypeNameRequired');
      if (str.length > NAME_MAX) return t('form.validation.photoTypeNameMaxLength', { count: NAME_MAX });
      if (/^0+$/.test(str)) return t('form.validation.photoTypeNameFormat');
      if (!/^[\p{L}\p{M}\p{N}()](?:[\p{L}\p{M}\p{N}\s\-()\/&,.]*[\p{L}\p{M}\p{N}()])?$/u.test(str)) return t('form.validation.photoTypeNameFormat');
      return undefined;
    },
    description: (val: unknown) => {
      const strVal = String(val ?? '').trim();
      if (!strVal) return undefined;
      if (strVal.length > DESCRIPTION_MAX) return t('form.validation.descriptionMaxLength', { count: DESCRIPTION_MAX });
      if (isAllZeros(strVal)) return t('form.validation.invalidFormat', { default: 'Invalid format' });
      if (!DESCRIPTION_REGEX.test(strVal)) return t('form.validation.descriptionFormat');
      return undefined;
    },
    displayOrder: (val: unknown) => {
      if (val === null || val === undefined || val === "") {
        return t('form.validation.displayOrderRequired');
      }
      const numVal = Number(val);
      if (isNaN(numVal)) {
        return t('form.validation.displayOrderRequired');
      }
      if (numVal <= 0) {
        return t('form.validation.displayOrderInvalid');
      }
      if (numVal > 99999) {
        return t('form.validation.displayOrderMaxLimit', { default: 'Display order cannot exceed 99999' });
      }
      return undefined;
    },
    isActive: (val: unknown) => {
      if (!isEdit && val !== true) {
        return t('form.validation.mustBeActive');
      }
      return undefined;
    },
    assetCategoryId: (val: unknown) => {
      const parsed = Number(val);
      if (!val || isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
        return t('form.validation.assetCategoryRequired');
      }
      return undefined;
    },
    assetTypeId: (val: unknown) => {
      const parsed = Number(val);
      if (!val || isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
        return t('form.validation.assetTypeRequired');
      }
      return undefined;
    },
  };
  return validateForm(data, schema);
};

// Reference check (DELETE, or PUT with isActive: false):
//   "This Asset Photo Type cannot be deleted|deactivated because it is in use."
const translateReferenceBlocked = (
  message: string | undefined,
  t: (key: string, values?: Record<string, string | number | Date>) => string
): string | undefined =>
  translateReferenceBlockedMessage(message, t, {
    entities: { "Asset Photo Type": "apiErrors.referenceBlocked.assetPhotoType" },
  });

export const mapAssetPhotoApiError = (
  result: { statusCode?: number; message?: string },
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string
): string => {
  const referenceBlocked = translateReferenceBlocked(result.message, t);
  if (referenceBlocked) return referenceBlocked;

  return mapSharedApiError({
    message: result.message,
    statusCode: result.statusCode,
    t,
    tCommon,
    fallbackEntityName: t("list.title"),
    customStatusCodes: {
      409: t("apiErrors.duplicateRecord"),
      404: t("apiErrors.notFound"),
      401: tCommon("errors.unauthorized"),
      403: tCommon("errors.unauthorized"),
    }
  });
};


export function getErrorMessage(
  message: string | undefined,
  statusCode: number | undefined,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string,
  fallbackEntityName: string
): string {
  const referenceBlocked = translateReferenceBlocked(message, t);
  if (referenceBlocked) return referenceBlocked;

  return mapSharedApiError({
    message,
    statusCode,
    t,
    tCommon,
    fallbackEntityName,
  });
}
