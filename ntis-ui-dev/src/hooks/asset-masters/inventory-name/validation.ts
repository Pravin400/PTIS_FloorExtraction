import { validateForm } from "@/lib/utils/validation";
import {
  CODE_REGEX,
  CODE_SANITIZE,
  NAME_ONLY_REGEX,
  NAME_ONLY_SANITIZE,
  ASSET_MASTER_TEXT_SANITIZE,
  DESCRIPTION_REGEX,
} from "@/lib/utils/asset-validation-rules";
import { createSafeMasterTranslator, getSafeMessage } from "@/lib/utils/asset-utils/createSafeMasterTranslator";
import type { InventoryNameFormModel } from "@/types/asset-masters/inventory-name.types";
import {
  parseReferenceBlockedMessage,
  translateReferenceBlockedMessage,
  type ReferenceBlockedTranslationOptions,
} from "@/lib/utils/asset-utils/shared-error-mapping";

export const CODE_MAX = 15;
export const NAME_MAX = 50;
export const DESCRIPTION_MAX = 200;

export const sanitizeFieldValue = (name: string, value: string): string => {
  let sanitizedValue = value;
  if (name === "description") {
    sanitizedValue = value.replace(ASSET_MASTER_TEXT_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ");
    if (sanitizedValue.length > DESCRIPTION_MAX) {
      sanitizedValue = sanitizedValue.substring(0, DESCRIPTION_MAX);
    }
  } else if (name === "subTypeName") {
    sanitizedValue = value.replace(NAME_ONLY_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ");
    if (sanitizedValue.length > NAME_MAX) {
      sanitizedValue = sanitizedValue.substring(0, NAME_MAX);
    }
  } else if (name === "subTypeCode") {
    sanitizedValue = value.replace(CODE_SANITIZE, "").toUpperCase();
    if (sanitizedValue.length > CODE_MAX) {
      sanitizedValue = sanitizedValue.substring(0, CODE_MAX);
    }
  }
  return sanitizedValue;
};

export const validateInventoryNameForm = (
  data: InventoryNameFormModel,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  isEdit: boolean
): Partial<Record<keyof InventoryNameFormModel, string>> => {
  const safeT = createSafeMasterTranslator(t);

  const schema = {
    inventoryItemCategoryId: (val: unknown) => {
      const num = Number(val);
      if (!val || isNaN(num) || num <= 0) {
        return safeT('categoryRequired');
      }
      return undefined;
    },
    subTypeCode: (val: unknown) => {
      const str = String(val ?? '').trim();
      if (!str) return safeT('codeRequired');
      if (str.length > CODE_MAX) return safeT('subTypeCodeMaxLength', { count: CODE_MAX });
      if (/^0+$/.test(str)) return safeT('subTypeCodeAllZeros');
      if (!CODE_REGEX.test(str)) return safeT('subTypeCodeFormat');
      return undefined;
    },
    subTypeName: (val: unknown) => {
      const str = String(val ?? '').trim();
      if (!str) return safeT('nameRequired');
      if (str.length > NAME_MAX) return safeT('subTypeNameMaxLength', { count: NAME_MAX });
      if (/^0+$/.test(str)) return safeT('subTypeNameAllZeros');
      if (!NAME_ONLY_REGEX.test(str)) return safeT('subTypeNameFormat');
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

// Reference check (DELETE, or PUT with isActive: false), e.g.
//   "This Inventory Name cannot be deleted because it has Inventory Models. Please delete all Inventory Models for this Inventory Name first."
const REFERENCE_BLOCKED_OPTIONS: ReferenceBlockedTranslationOptions = {
  entities: { "Inventory Name": "apiErrors.referenceBlocked.inventoryName" },
  masters: { "Inventory Models": "apiErrors.referenceMasters.inventoryModels" },
  andKey: "apiErrors.referenceMasters.and",
};

/** True when the backend refused to deactivate the record because other records still use it. */
export function isDeactivateBlocked(result: { message?: string; error?: string; success?: boolean }): boolean {
  return parseReferenceBlockedMessage(result.message || result.error)?.operation === "deactivate";
}

export const mapInventoryNameApiError = (
  result: { statusCode?: number; message?: string; error?: string; success?: boolean },
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string
): string => {
  const rawMsg = (result.message || result.error || "").replace(/\.$/, "");
  const referenceBlocked = translateReferenceBlockedMessage(result.message || result.error, t, REFERENCE_BLOCKED_OPTIONS);
  if (referenceBlocked) return referenceBlocked;

  if (result.error === "duplicate" || rawMsg.toLowerCase().includes("duplicate") || rawMsg.toLowerCase().includes("already exists")) {
    return (
      getSafeMessage(t, "configuration.masterData.form.validation.duplicateRecord") ||
      getSafeMessage(t, "validation.duplicateRecord") ||
      getSafeMessage(t, "errors.duplicateRecord") ||
      "Record already exists."
    );
  }

  const errorMap: Record<number, string> = {
    409:
      getSafeMessage(t, "configuration.masterData.form.validation.duplicateRecord") ||
      getSafeMessage(t, "validation.duplicateRecord") ||
      "Record already exists.",
    404: tCommon("errors.notFound") || "Record not found.",
    401: tCommon("errors.unauthorized"),
    403: tCommon("errors.unauthorized"),
  };

  const code = result.statusCode ?? 0;
  if (errorMap[code]) return errorMap[code];

  if (code >= 500) return tCommon("errors.serverError") || "Server error occurred.";
  return result.message || result.error || tCommon("errors.generic") || "Operation failed.";
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
    ? (getSafeMessage(t, "apiErrors.duplicateRecord") || "Record is in use.")
    : (tCommon("errors.generic") || tCommon("errors.deleteError"));
}
