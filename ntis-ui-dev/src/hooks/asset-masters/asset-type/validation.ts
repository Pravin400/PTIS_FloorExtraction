import { validateForm } from "@/lib/utils/validation";
import { cleanErrorMessage } from "@/lib/utils/api-error-handler";
import {
  CODE_REGEX,
  CODE_SANITIZE,
  ASSET_MASTER_TEXT_SANITIZE,
  DESCRIPTION_REGEX,
  NAME_ONLY_SANITIZE,
  NAME_ONLY_REGEX,
} from "@/lib/utils/asset-validation-rules";
import { parseReferenceBlockedMessage, translateReferenceBlockedMessage } from "@/lib/utils/asset-utils/shared-error-mapping";
import { createSafeMasterTranslator } from "@/lib/utils/asset-utils/createSafeMasterTranslator";
import type { AssetTypeFormModel } from "@/types/asset-masters/asset-type.types";

export const CODE_MAX = 15;
export const NAME_MAX = 50;
export const TYPENAME_LOCAL_MAX = 200;
export const DESCRIPTION_MAX = 500;

export const sanitizeFieldValue = (name: string, value: string): string => {
  let sanitizedValue = value;
  if (name === "description") {
    sanitizedValue = value.replace(ASSET_MASTER_TEXT_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ");
    if (sanitizedValue.length > DESCRIPTION_MAX) {
      sanitizedValue = sanitizedValue.substring(0, DESCRIPTION_MAX);
    }
  } else if (name === "typeNameLocal") {
    sanitizedValue = value.replace(NAME_ONLY_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ");
    if (sanitizedValue.length > TYPENAME_LOCAL_MAX) {
      sanitizedValue = sanitizedValue.substring(0, TYPENAME_LOCAL_MAX);
    }
  } else if (name === "name") {
    // Asset Type Name is English-only; keep ASCII letters and spaces only.
    sanitizedValue = value.replace(/[^A-Za-z ]/g, "").trimStart().replace(/\s{2,}/g, " ");
    if (sanitizedValue.length > NAME_MAX) {
      sanitizedValue = sanitizedValue.substring(0, NAME_MAX);
    }
  } else if (name === "code") {
    sanitizedValue = value.replace(CODE_SANITIZE, "").toUpperCase();
    if (sanitizedValue.length > CODE_MAX) {
      sanitizedValue = sanitizedValue.substring(0, CODE_MAX);
    }
  }
  return sanitizedValue;
};

export const validateAssetTypeForm = (
  data: AssetTypeFormModel,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  isEdit: boolean
): Partial<Record<keyof AssetTypeFormModel | "registrationType", string>> => {
  const safeT = createSafeMasterTranslator(t);

  const schema = {
    group: (val: unknown) => {
      const num = Number(val);
      if (!val || isNaN(num) || num <= 0) return safeT('groupRequired');
      return undefined;
    },
    code: (val: unknown) => {
      const str = String(val ?? '').trim();
      if (!str) return safeT('codeRequired');
      if (str.length > CODE_MAX) return safeT('codeMaxLength', { count: CODE_MAX });
      if (/^0+$/.test(str)) return safeT('codeAllZeros');
      if (!CODE_REGEX.test(str)) return safeT('codeFormat');
      return undefined;
    },
    name: (val: unknown) => {
      const str = String(val ?? '').trim();
      if (!str) return safeT('nameRequired');
      if (str.length > NAME_MAX) return safeT('nameMaxLength', { count: NAME_MAX });
      if (/^0+$/.test(str)) return safeT('nameAllZeros');
      if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(str)) return safeT('nameFormat');
      return undefined;
    },
    typeNameLocal: (val: unknown) => {
      const str = String(val ?? '').trim();
      if (!str) return undefined;
      if (str.length > TYPENAME_LOCAL_MAX) return safeT('typeNameLocalMaxLength', { count: TYPENAME_LOCAL_MAX });
      if (/^0+$/.test(str)) return safeT('typeNameLocalAllZeros');
      if (!NAME_ONLY_REGEX.test(str)) return safeT('typeNameLocalFormat');
      return undefined;
    },
    registrationType: (val: unknown) => {
      if (val === "unit" || val === "room") return undefined;
      if (data.allowUnitRegistration || data.allowRoomRegistration) return undefined;
      return safeT('registrationTypeRequired');
    },
    description: (val: unknown) => {
      const str = String(val ?? '').trim();
      if (!str) return undefined;
      if (str.length > DESCRIPTION_MAX) return safeT('descriptionMaxLength', { count: DESCRIPTION_MAX });
      if (/^0+$/.test(str)) return safeT('descriptionAllZeros');
      if (!DESCRIPTION_REGEX.test(str)) return safeT('descriptionFormat');
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

// Reference check (DELETE, or PUT with isActive: false) from ReferenceValidationService (DisplayAs "Asset Type"), e.g.
//   "This Asset Type cannot be deleted because it has Asset Room Types. Please delete all Asset Room Types for this Asset Type first."
const REFERENCE_MASTERS: Record<string, string> = {
  "Asset Document Definitions": "apiErrors.referenceMasters.assetDocumentDefinitions",
  "Asset Field Definitions": "apiErrors.referenceMasters.assetFieldDefinitions",
  "Type Of Uses": "apiErrors.referenceMasters.typeOfUses",
  "Asset Photo Types": "apiErrors.referenceMasters.assetPhotoTypes",
  "Asset Room Types": "apiErrors.referenceMasters.assetRoomTypes",
};

function translateReferenceBlocked(
  message: string | undefined,
  t: (key: string, values?: Record<string, string | number | Date>) => string
): string | undefined {
  return translateReferenceBlockedMessage(message, t, {
    entities: { "Asset Type": "apiErrors.referenceBlocked.assetType" },
    masters: REFERENCE_MASTERS,
    andKey: "apiErrors.referenceMasters.and",
  });
}

/** True when the backend refused to deactivate the record because other records still use it. */
export function isDeactivateBlockedMessage(message: string | undefined): boolean {
  return parseReferenceBlockedMessage(message)?.operation === "deactivate";
}

export const mapAssetTypeApiError = (
  result: { statusCode?: number; message?: string; error?: string; duplicateFields?: { code?: string | boolean | null; name?: string | boolean | null } },
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string
): string => {
  const referenceBlocked = translateReferenceBlocked(result.message || result.error, t);
  if (referenceBlocked) return referenceBlocked;

  const rawMsg = (result.message || result.error || "").replace(/\.$/, "");

  if (result.error === "duplicate" || rawMsg.toLowerCase().includes("duplicate") || rawMsg.toLowerCase().includes("already exists")) {
    const hasCode = !!(result.duplicateFields?.code || rawMsg.includes("Asset Type Code") || rawMsg.includes("TypeCode"));
    const hasName = !!(result.duplicateFields?.name || rawMsg.includes("Asset Type Name") || rawMsg.includes("TypeName"));

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
    return t("validation.duplicateRecord") || t("validation.duplicateError") || "Record already exists.";
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
