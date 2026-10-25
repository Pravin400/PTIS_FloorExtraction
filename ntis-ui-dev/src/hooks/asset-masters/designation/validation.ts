import {
  validateForm
} from "@/lib/utils/validation";
import {
  CODE_SANITIZE,
  DESCRIPTION_SANITIZE,
  CODE_REGEX,
  DESCRIPTION_REGEX,
  NAME_ONLY_SANITIZE,
  NAME_ONLY_REGEX,
  isAllZeros
} from "@/lib/utils/asset-validation-rules";
import { DesignationFormModel } from "@/types/asset-masters/designation.types";
import {
  mapSharedApiError,
  parseReferenceBlockedMessage,
  translateReferenceBlockedMessage,
} from "@/lib/utils/asset-utils/shared-error-mapping";

export const CODE_MAX = 20;
export const NAME_MAX = 100;
export const DESCRIPTION_MAX = 100;

export const sanitizeFieldValue = (name: string, value: string): string => {
  let sanitizedValue = value;
  if (name === "designationDescription") {
    sanitizedValue = value.replace(DESCRIPTION_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ");
    if (sanitizedValue.length > DESCRIPTION_MAX) {
      sanitizedValue = sanitizedValue.substring(0, DESCRIPTION_MAX);
    }
  } else if (name === "designationName") {
    sanitizedValue = value.replace(NAME_ONLY_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ");
    if (sanitizedValue.length > NAME_MAX) {
      sanitizedValue = sanitizedValue.substring(0, NAME_MAX);
    }
  } else if (name === "designationLocal") {
    sanitizedValue = value.replace(NAME_ONLY_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ");
    if (sanitizedValue.length > NAME_MAX) {
      sanitizedValue = sanitizedValue.substring(0, NAME_MAX);
    }
  } else if (name === "designationCode") {
    sanitizedValue = value.replace(CODE_SANITIZE, "").toUpperCase();
    if (sanitizedValue.length > CODE_MAX) {
      sanitizedValue = sanitizedValue.substring(0, CODE_MAX);
    }
  }
  return sanitizedValue;
};

export const validateDesignationForm = (
  data: DesignationFormModel,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  isEdit: boolean
): Partial<Record<keyof DesignationFormModel, string>> => {
  const schema = {
    designationCode: (value: unknown) => {
      const strVal = String(value ?? '').trim();
      if (!strVal) return t('form.validation.designationCodeRequired');
      if (strVal.length > CODE_MAX) return t('form.validation.designationCodeMaxLength', { count: CODE_MAX });
      if (isAllZeros(strVal)) return t('form.validation.invalidFormat', { default: 'Invalid format' });
      if (!CODE_REGEX.test(strVal)) return t('form.validation.designationCodeFormat');
      return undefined;
    },
    designationName: (val: unknown) => {
      const str = String(val ?? '').trim();
      if (!str) return t('form.validation.designationNameRequired');
      if (str.length > NAME_MAX) return t('form.validation.designationNameMaxLength', { count: NAME_MAX });
      if (isAllZeros(str)) return t('form.validation.designationNameFormat');
      if (!NAME_ONLY_REGEX.test(str)) return t('form.validation.designationNameFormat');
      return undefined;
    },
    designationLocal: (val: unknown) => {
      const str = String(val ?? '').trim();
      if (!str) return t('form.validation.designationLocalRequired');
      if (str.length > NAME_MAX) return t('form.validation.designationLocalMaxLength', { count: NAME_MAX });
      if (isAllZeros(str)) return t('form.validation.designationLocalRequired');
      if (!NAME_ONLY_REGEX.test(str)) return t('form.validation.designationLocalFormat');
      return undefined;
    },
    designationDescription: (val: unknown) => {
      const strVal = String(val ?? '').trim();
      if (!strVal) return undefined;
      if (strVal.length > DESCRIPTION_MAX) return t('form.validation.descriptionMaxLength', { count: DESCRIPTION_MAX });
      if (isAllZeros(strVal)) return t('form.validation.invalidFormat', { default: 'Invalid format' });
      if (!DESCRIPTION_REGEX.test(strVal)) return t('form.validation.descriptionFormat');
      return undefined;
    },
    isActive: (val: unknown) => {
      if (!isEdit && val !== true) {
        return t('form.validation.mustBeActive');
      }
      return undefined;
    },
    owningDepartmentId: (val: unknown) => {
      const parsed = Number(val);
      if (!val || isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
        return t('form.validation.owningDepartmentRequired');
      }
      return undefined;
    },
  };
  return validateForm(data, schema);
};

// Reference check (DELETE, or PUT with isActive: false):
//   "This Designation cannot be deleted/deactivated because it is in use."
function translateDesignationReferenceBlocked(
  message: string | undefined,
  t: (key: string, values?: Record<string, string | number | Date>) => string
): string | undefined {
  return translateReferenceBlockedMessage(message, t, {
    entities: { Designation: "apiErrors.referenceBlocked.designation" },
  });
}

/** True when the backend refused to deactivate the record because other records still use it. */
export function isDeactivateBlockedMessage(message: string | undefined): boolean {
  return parseReferenceBlockedMessage(message)?.operation === "deactivate";
}

export const mapDesignationApiError = (
  result: { statusCode?: number; message?: string },
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string
): string => {
  const referenceBlocked = translateDesignationReferenceBlocked(result.message, t);
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
  const referenceBlocked = translateDesignationReferenceBlocked(message, t);
  if (referenceBlocked) return referenceBlocked;

  return mapSharedApiError({
    message,
    statusCode,
    t,
    tCommon,
    fallbackEntityName,
  });
}
