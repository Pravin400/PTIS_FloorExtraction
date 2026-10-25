import {
  validateForm
} from "@/lib/utils/validation";
import {
  DESCRIPTION_SANITIZE,
  isAllZeros,
  DESCRIPTION_REGEX
} from "@/lib/utils/asset-validation-rules";
import { AssetGrievanceRemarkFormModel } from "@/types/asset-masters/asset-grievance-remark.types";
import { mapSharedApiError } from "@/lib/utils/asset-utils/shared-error-mapping";

export const REMARK_MAX = 150;
export const DESCRIPTION_MAX = 500;

export const sanitizeRemarkField = (name: string, value: string): string => {
  let sanitizedValue = value;
  if (name === "remark") {
    // Both remark and description use DESCRIPTION_SANITIZE per asset validation rules
    sanitizedValue = value.replace(DESCRIPTION_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ");
    if (sanitizedValue.length > REMARK_MAX) {
      sanitizedValue = sanitizedValue.substring(0, REMARK_MAX);
    }
  } else if (name === "description") {
    sanitizedValue = value.replace(DESCRIPTION_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ");
    if (sanitizedValue.length > DESCRIPTION_MAX) {
      sanitizedValue = sanitizedValue.substring(0, DESCRIPTION_MAX);
    }
  }
  return sanitizedValue;
};

export const validateGrievanceRemarkForm = (
  data: AssetGrievanceRemarkFormModel,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  isEdit: boolean
): Partial<Record<keyof AssetGrievanceRemarkFormModel, string>> => {
  const schema = {
    remark: (val: unknown) => {
      const str = String(val ?? "").trim();
      if (!str) return t("form.validation.remarkRequired");
      if (str.length < 3) return t("form.validation.remarkMinLength");
      if (str.length > REMARK_MAX) return t("form.validation.remarkMaxLength");
      if (isAllZeros(str) || !DESCRIPTION_REGEX.test(str)) return t("form.validation.remarkFormat");
      return undefined;
    },
    description: (val: unknown) => {
      const strVal = String(val ?? "").trim();
      if (!strVal) return undefined;
      if (strVal.length > DESCRIPTION_MAX) return t("form.validation.descriptionMaxLength");
      if (isAllZeros(strVal) || !DESCRIPTION_REGEX.test(strVal)) return t("form.validation.remarkFormat");
      return undefined;
    },
    grievanceCategoryId: (val: unknown) => {
      const parsed = Number(val);
      if (!val || isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
        return t("form.validation.remarkTypeRequired");
      }
      return undefined;
    },
    isActive: (val: unknown) => {
      if (!isEdit && val !== true) {
        return t("form.validation.mustBeActive");
      }
      return undefined;
    },
  };
  return validateForm(data, schema);
};

export const validateGrievanceRemarkServerAction = (
  data: AssetGrievanceRemarkFormModel,
  isEdit: boolean
): { isValid: boolean; errors: Partial<Record<keyof AssetGrievanceRemarkFormModel, string>> } => {
  const errors = validateGrievanceRemarkForm(data, (key) => key, isEdit);
  const filteredErrors: Partial<Record<keyof AssetGrievanceRemarkFormModel, string>> = {};
  for (const [k, v] of Object.entries(errors)) {
    if (v) filteredErrors[k as keyof AssetGrievanceRemarkFormModel] = v;
  }
  return {
    isValid: Object.keys(filteredErrors).length === 0,
    errors: filteredErrors,
  };
};

export const mapGrievanceRemarkApiError = (
  result: { statusCode?: number; message?: string },
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string
): string => {
  const lowerMsg = (result.message || "").toLowerCase();
  if (result.statusCode === 409 || lowerMsg.includes("duplicate") || lowerMsg.includes("already exists")) {
    try {
      const dup = t("apiErrors.duplicateRecord");
      if (dup && !dup.includes("apiErrors")) return dup;
    } catch {}
    return "This remark already exists for the selected Grievance Category.";
  }

  return mapSharedApiError({
    message: result.message,
    statusCode: result.statusCode,
    t,
    tCommon,
    fallbackEntityName: t("title"),
    entityMatchers: [{ test: /remark/i, labelKey: "title" }],
    customStatusCodes: {
      409: t("apiErrors.duplicateRecord"),
      404: t("apiErrors.notFound"),
      401: tCommon("errors.unauthorized"),
      403: tCommon("errors.unauthorized"),
    }
  });
};

export function getRemarkErrorMessage(
  message: string | undefined,
  statusCode: number | undefined,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string,
  fallbackEntityName: string
): string {
  return mapSharedApiError({
    message,
    statusCode,
    t,
    tCommon,
    fallbackEntityName,
    entityMatchers: [{ test: /remark/i, labelKey: "title" }]
  });
}

export const REMARK_VALIDATION_ERROR_KEYS = new Set([
  "form.validation.remarkRequired",
  "form.validation.remarkMinLength",
  "form.validation.remarkMaxLength",
  "form.validation.remarkFormat",

  "form.validation.descriptionMaxLength",
  "form.validation.remarkTypeRequired",
  "form.validation.mustBeActive",
]);

export function translateRemarkValidationError(
  keyOrMessage: string,
  t: (key: string, values?: Record<string, string | number | Date>) => string
): string {
  if (REMARK_VALIDATION_ERROR_KEYS.has(keyOrMessage)) {
    try {
      return t(keyOrMessage) || keyOrMessage;
    } catch {
      return keyOrMessage;
    }
  }
  return keyOrMessage;
}

