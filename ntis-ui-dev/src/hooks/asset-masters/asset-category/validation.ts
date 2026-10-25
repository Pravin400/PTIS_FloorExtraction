import { validateForm } from "@/lib/utils/validation";
import { cleanErrorMessage } from "@/lib/utils/api-error-handler";
import {
  CODE_REGEX,
  CODE_SANITIZE,
  NAME_ONLY_REGEX,
  NAME_ONLY_SANITIZE,
  ASSET_MASTER_TEXT_SANITIZE,
  DESCRIPTION_REGEX,
  isAllZeros,
} from "@/lib/utils/asset-validation-rules";
import { parseReferenceBlockedMessage, translateReferenceBlockedMessage } from "@/lib/utils/asset-utils/shared-error-mapping";
import { createSafeMasterTranslator } from "@/lib/utils/asset-utils/createSafeMasterTranslator";
import type { AssetCategoryFormModel } from "@/types/asset-masters/asset-category.types";

export const CODE_MAX = 20;
export const NAME_MAX = 100;
export const DESCRIPTION_MAX = 500;
export const VALUATION_TYPE_MAX = 20;

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
  } else if (name === "code") {
    sanitizedValue = value.replace(CODE_SANITIZE, "").toUpperCase();
    if (sanitizedValue.length > CODE_MAX) {
      sanitizedValue = sanitizedValue.substring(0, CODE_MAX);
    }
  } else if (name === "valuationType") {
    sanitizedValue = value.toUpperCase().replace(/[^A-Z0-9 \-_]/g, "");
    if (sanitizedValue.length > VALUATION_TYPE_MAX) {
      sanitizedValue = sanitizedValue.substring(0, VALUATION_TYPE_MAX);
    }
  }
  return sanitizedValue;
};

export const validateAssetCategoryForm = (
  data: AssetCategoryFormModel,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  isEdit: boolean
): Partial<Record<keyof AssetCategoryFormModel, string>> => {
  const safeT = createSafeMasterTranslator(t);

  const schema = {
    code: (val: unknown) => {
      const str = String(val ?? '').trim();
      if (!str) return safeT('codeRequired');
      if (str.length > CODE_MAX) return safeT('codeMaxLength', { count: CODE_MAX });
      if (isAllZeros(str)) return safeT('codeAllZeros');
      if (!CODE_REGEX.test(str)) return safeT('codeFormat');
      return undefined;
    },
    name: (val: unknown) => {
      const str = String(val ?? '').trim();
      if (!str) return safeT('nameRequired');
      if (str.length > NAME_MAX) return safeT('nameMaxLength', { count: NAME_MAX });
      if (isAllZeros(str)) return safeT('nameAllZeros');
      if (!NAME_ONLY_REGEX.test(str)) return safeT('nameFormat');
      return undefined;
    },
    description: (val: unknown) => {
      const str = String(val ?? '').trim();
      if (!str) return undefined;
      if (str.length > DESCRIPTION_MAX) return safeT('descriptionMaxLength', { count: DESCRIPTION_MAX });
      if (isAllZeros(str)) return safeT('descriptionAllZeros');
      if (!DESCRIPTION_REGEX.test(str)) return safeT('descriptionFormat');
      return undefined;
    },
    valuationType: (val: unknown) => {
      const str = String(val ?? '').trim();
      if (!str) return safeT('valuationTypeRequired');
      if (str.length > VALUATION_TYPE_MAX) return safeT('valuationTypeMaxLength', { count: VALUATION_TYPE_MAX });
      if (!/^[A-Z0-9 \-_]+$/i.test(str)) return safeT('valuationTypeInvalidChars');
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

// Reference check (DELETE, or PUT with isActive: false) from ReferenceValidationService (DisplayAs "Asset Category"), e.g.
//   "This Asset Category cannot be deleted because it has Asset Room Types. Please delete all Asset Room Types for this Asset Category first."
const REFERENCE_MASTERS: Record<string, string> = {
  "Asset Types": "apiErrors.referenceMasters.assetTypes",
  "Asset Document Definitions": "apiErrors.referenceMasters.assetDocumentDefinitions",
  "Asset Field Definitions": "apiErrors.referenceMasters.assetFieldDefinitions",
  "Type Of Uses": "apiErrors.referenceMasters.typeOfUses",
  "Asset Photo Types": "apiErrors.referenceMasters.assetPhotoTypes",
  "Asset Room Types": "apiErrors.referenceMasters.assetRoomTypes",
  "Inventory Categories": "apiErrors.referenceMasters.inventoryCategories",
  "Asset Conditions": "apiErrors.referenceMasters.assetConditions",
};

function translateReferenceBlocked(
  message: string | undefined,
  t: (key: string, values?: Record<string, string | number | Date>) => string
): string | undefined {
  return translateReferenceBlockedMessage(message, t, {
    entities: { "Asset Category": "apiErrors.referenceBlocked.assetCategory" },
    masters: REFERENCE_MASTERS,
    andKey: "apiErrors.referenceMasters.and",
  });
}

/** True when the backend refused to deactivate the record because other records still use it. */
export function isDeactivateBlockedMessage(message: string | undefined): boolean {
  return parseReferenceBlockedMessage(message)?.operation === "deactivate";
}

export const mapAssetCategoryApiError = (
  result: { statusCode?: number; message?: string; error?: string; duplicateFields?: { code?: string | boolean | null; name?: string | boolean | null }; field?: string },
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string
): string => {
  const referenceBlocked = translateReferenceBlocked(result.message || result.error, t);
  if (referenceBlocked) return referenceBlocked;

  const rawMsg = (result.message || result.error || "").replace(/\.$/, "");

  if (result.error === "duplicate" || rawMsg.toLowerCase().includes("duplicate") || rawMsg.toLowerCase().includes("already exists")) {
    const hasCode = !!(result.duplicateFields?.code || result.field === "code" || rawMsg.includes("Category Code") || rawMsg.includes("CategoryCode"));
    const hasName = !!(result.duplicateFields?.name || result.field === "name" || rawMsg.includes("Category Name") || rawMsg.includes("CategoryName"));

    if (hasCode && hasName) {
      return (
        t("validation.codeAndNameDuplicate") ||
        t("validation.duplicateRecord") ||
        "Code and Name already exist."
      );
    }
    if (hasCode) {
      return (
        t("validation.codeDuplicate") ||
        t("errors.codeDuplicate") ||
        "Code already exists."
      );
    }
    if (hasName) {
      return (
        t("validation.nameDuplicate") ||
        t("errors.nameDuplicate") ||
        "Name already exists."
      );
    }
    return t("validation.duplicateError") || t("validation.duplicateRecord") || "Record already exists.";
  }

  const errorMap: Record<number, string> = {
    409: t("validation.duplicateRecord") || "Record already exists.",
    404: t("errors.notFound") || "Record not found.",
    401: tCommon("errors.unauthorized"),
    403: tCommon("errors.unauthorized"),
  };

  const code = result.statusCode ?? 0;
  if (errorMap[code]) return errorMap[code];

  if (code >= 500) return tCommon("errors.serverError") || "Server error occurred.";
  
  const cleaned = cleanErrorMessage(rawMsg, "");
  return cleaned || result.message || result.error || "Operation failed.";
};

export function getErrorMessage(
  message: string | undefined,
  statusCode: number | undefined,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string) => string
): string {
  const referenceBlocked = translateReferenceBlocked(message, t);
  if (referenceBlocked) return referenceBlocked;

  return statusCode === 409
    ? (t("validation.duplicateRecord") || "Record is in use.")
    : (t("messages.error") || tCommon("errors.generic") || tCommon("errors.deleteError"));
}
