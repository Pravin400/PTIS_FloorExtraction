import { validateForm } from "@/lib/utils/validation";
import {
  NAME_ONLY_REGEX,
  NAME_ONLY_SANITIZE,
  ASSET_MASTER_TEXT_SANITIZE,
  DESCRIPTION_REGEX,
} from "@/lib/utils/asset-validation-rules";
import { createSafeMasterTranslator } from "@/lib/utils/asset-utils/createSafeMasterTranslator";
import type { InventoryModelFormModel } from "@/types/asset-masters/inventory-model.types";
import {
  parseReferenceBlockedMessage,
  translateReferenceBlockedMessage,
  type ReferenceBlockedTranslationOptions,
} from "@/lib/utils/asset-utils/shared-error-mapping";

export const NAME_MAX = 50;
export const DESCRIPTION_MAX = 500;

export const sanitizeFieldValue = (name: string, value: string): string => {
  let sanitizedValue = value;
  if (name === "description") {
    sanitizedValue = value.replace(ASSET_MASTER_TEXT_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ");
    if (sanitizedValue.length > DESCRIPTION_MAX) {
      sanitizedValue = sanitizedValue.substring(0, DESCRIPTION_MAX);
    }
  } else if (name === "name") {
    sanitizedValue = value.replace(NAME_ONLY_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ");
    if (sanitizedValue.length > NAME_MAX) {
      sanitizedValue = sanitizedValue.substring(0, NAME_MAX);
    }
  }
  return sanitizedValue;
};
export const validateInventoryModelForm = (
  data: InventoryModelFormModel,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  isEdit: boolean
): Partial<Record<keyof InventoryModelFormModel, string>> => {
  const safeT = createSafeMasterTranslator(t);

  const schema = {
    group: (val: unknown) => {
      const num = Number(val);
      if (!val || isNaN(num) || num <= 0) return safeT('groupRequired');
      return undefined;
    },
    name: (val: unknown) => {
      const str = String(val ?? '').trim();
      if (!str) return safeT('nameRequired');
      if (str.length > NAME_MAX) return safeT('nameMaxLength', { count: NAME_MAX });
      if (/^0+$/.test(str)) return safeT('nameAllZeros');
      if (!NAME_ONLY_REGEX.test(str)) return safeT('nameFormat');
      return undefined;
    },
    description: (val: unknown) => {
      const str = String(val ?? '').trim();
      if (!str) return undefined;
      if (str.length > DESCRIPTION_MAX) return safeT('descriptionMaxLength', { count: DESCRIPTION_MAX });
      if (/^0+$/.test(str)) return safeT('descriptionAllZeros');
      if (!DESCRIPTION_REGEX.test(str)) return safeT('descriptionFormat');
      return undefined;
    },
    displayOrder: (val: unknown) => {
      if (val === null || val === undefined || val === "" || String(val).trim() === "") {
        return safeT('displayOrderRequired');
      }
      const numVal = Number(val);
      if (isNaN(numVal) || !Number.isInteger(numVal) || numVal <= 0) {
        return safeT('displayOrderRequired');
      }
      if (numVal > 99999) {
        return safeT('displayOrderMaxLimit') || "Display order cannot exceed 99999";
      }
      return undefined;
    },
    isActive: (val: unknown) => {
      if (!isEdit && val !== true) {
        return safeT('mustBeActive');
      }
      return undefined;
    },
  };
  return validateForm(data, schema);
};

// Reference check (DELETE, or PUT with isActive: false): "This Inventory Model cannot be deleted because it is in use."
const REFERENCE_BLOCKED_OPTIONS: ReferenceBlockedTranslationOptions = {
  entities: { "Inventory Model": "apiErrors.referenceBlocked.inventoryModel" },
};

/** True when the backend refused to deactivate the record because other records still use it. */
export function isDeactivateBlocked(result: { message?: string; error?: string; success?: boolean }): boolean {
  return parseReferenceBlockedMessage(result.message || result.error)?.operation === "deactivate";
}

export const mapInventoryModelApiError = (
  result: { statusCode?: number; message?: string; error?: string },
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string
): string => {
  const rawMsg = (result.message || result.error || "").replace(/\.$/, "");
  const referenceBlocked = translateReferenceBlockedMessage(result.message || result.error, t, REFERENCE_BLOCKED_OPTIONS);
  if (referenceBlocked) return referenceBlocked;

  if (result.error === "duplicate" || rawMsg.toLowerCase().includes("duplicate") || rawMsg.toLowerCase().includes("already exists")) {
    return t("validation.duplicateRecord") || t("validation.duplicateError") || t("errors.duplicateRecord") || "Record already exists.";
  }

  const errorMap: Record<number, string> = {
    409: t("validation.duplicateRecord") || t("validation.duplicateError") || t("errors.duplicateRecord") || "Record already exists.",
    404: tCommon("errors.notFound") || "Record not found.",
    401: tCommon("errors.unauthorized"),
    403: tCommon("errors.unauthorized"),
  };

  const code = result.statusCode ?? 0;
  if (errorMap[code]) return errorMap[code];

  if (code >= 500) return tCommon("errors.serverError") || "Server error occurred.";
  return result.message || result.error || t("messages.error") || "Operation failed.";
};

export function getErrorMessage(
  message: string | undefined,
  statusCode: number | undefined,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string) => string
): string {
  const referenceBlocked = translateReferenceBlockedMessage(message, t, REFERENCE_BLOCKED_OPTIONS);
  if (referenceBlocked) return referenceBlocked;

  return statusCode === 409
    ? (t("validation.duplicateRecord") || t("errors.duplicateRecord") || "Record is in use.")
    : (t("messages.error") || tCommon("errors.generic") || tCommon("errors.deleteError"));
}
