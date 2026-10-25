import {
  validateForm
} from "@/lib/utils/validation";
import {
  CODE_REGEX,
  CODE_SANITIZE,
  ASSET_MASTER_NAME_REGEX,
  ASSET_MASTER_NAME_SANITIZE,
  DESCRIPTION_REGEX,
  DESCRIPTION_SANITIZE,
  isAllZeros,
  TEXT_SANITIZE
} from "@/lib/utils/asset-validation-rules";
import { AssetGrievanceCategoryFormModel } from "@/types/asset-masters/asset-grievance-category.types";
import {
  mapSharedApiError,
  parseReferenceBlockedMessage,
  translateReferenceBlockedMessage,
} from "@/lib/utils/asset-utils/shared-error-mapping";

export const CODE_MAX = 20;
export const NAME_MAX = 50;
export const LOCAL_NAME_MAX = 50;
export const TARGET_TABLE_MAX = 100;
export const CODE_FORMAT_MAX = 50;
export const DESCRIPTION_MAX = 200;

export const CODE_FORMAT_REGEX = /^[A-Za-z0-9\-/_.{}#]+$/;
export const TARGET_TABLE_REGEX = /^(?!.*[_\-.]{2,})[A-Za-z](?:[A-Za-z_\-.]*[A-Za-z])?$/;

export const sanitizeCategoryField = (name: string, value: string): string => {
  let sanitizedValue = value;
  if (name === "description") {
    sanitizedValue = value.replace(DESCRIPTION_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ");
    if (sanitizedValue.length > DESCRIPTION_MAX) {
      sanitizedValue = sanitizedValue.substring(0, DESCRIPTION_MAX);
    }
  } else if (name === "grievanceTypeCode") {
    sanitizedValue = value.replace(CODE_SANITIZE, "").toUpperCase();
    if (sanitizedValue.length > CODE_MAX) {
      sanitizedValue = sanitizedValue.substring(0, CODE_MAX);
    }
  } else if (name === "grievanceTypeName") {
    // Category Name is English-only; regional characters belong in Local Name.
    sanitizedValue = value.replace(/[^A-Za-z0-9 _-]/g, "").trimStart().replace(/\s{2,}/g, " ");
    if (sanitizedValue.length > NAME_MAX) {
      sanitizedValue = sanitizedValue.substring(0, NAME_MAX);
    }
  } else if (name === "grievanceTypeNameLocal") {
    sanitizedValue = value.replace(ASSET_MASTER_NAME_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ");
    if (sanitizedValue.length > LOCAL_NAME_MAX) {
      sanitizedValue = sanitizedValue.substring(0, LOCAL_NAME_MAX);
    }
  } else if (name === "codeFormat") {
    sanitizedValue = value.replace(/[^A-Za-z0-9\-/_.{}#]/g, "").trimStart().replace(/\s+/g, "");
    if (sanitizedValue.length > CODE_FORMAT_MAX) {
      sanitizedValue = sanitizedValue.substring(0, CODE_FORMAT_MAX);
    }
  } else if (name === "targetTableName") {
    sanitizedValue = value.replace(/[^A-Za-z_\-.]/g, "").replace(/^[_\-.]+/, "");
    if (sanitizedValue.length > TARGET_TABLE_MAX) {
      sanitizedValue = sanitizedValue.substring(0, TARGET_TABLE_MAX);
    }
  }
  return sanitizedValue;
};

export const validateGrievanceCategoryForm = (
  data: AssetGrievanceCategoryFormModel,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  isEdit: boolean
): Partial<Record<keyof AssetGrievanceCategoryFormModel, string>> => {
  const schema = {
    grievanceTypeCode: (val: unknown) => {
      const str = String(val ?? "").trim();
      if (!str) return t("form.errors.typeCodeReq");
      if (str.length > CODE_MAX) return t("form.errors.typeCodeMaxLength");
      if (isAllZeros(str) || !CODE_REGEX.test(str)) {
        return t("form.errors.typeCodeInvalidFormat");
      }
      return undefined;
    },
    grievanceTypeName: (val: unknown) => {
      const str = String(val ?? "").trim();
      if (!str) return t("form.errors.typeNameReq");
      if (str.length > NAME_MAX) return t("form.errors.typeNameMaxLength");
      if (isAllZeros(str) || !/^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/.test(str)) return t("form.errors.invalidFormat");
      return undefined;
    },
    grievanceTypeNameLocal: (val: unknown) => {
      const strVal = String(val ?? "").trim();
      if (!strVal) return undefined;
      if (strVal.length > LOCAL_NAME_MAX) return t("form.errors.typeNameLocalMaxLength");
      if (isAllZeros(strVal) || !ASSET_MASTER_NAME_REGEX.test(strVal)) return t("form.errors.invalidFormat");
      return undefined;
    },
    codeFormat: (val: unknown) => {
      const str = String(val ?? "").trim();
      if (!str) return t("form.errors.codeFormatReq");
      if (str.length > CODE_FORMAT_MAX) return t("form.errors.codeFormatMaxLength");
      if (isAllZeros(str) || !CODE_FORMAT_REGEX.test(str)) {
        return t("form.errors.codeFormatInvalidFormat");
      }
      return undefined;
    },
    targetTableName: (val: unknown) => {
      const strVal = String(val ?? "").trim();
      if (!strVal) return t("form.errors.targetTableNameReq");
      if (strVal.length > TARGET_TABLE_MAX) return t("form.errors.targetTableNameMaxLength");
      if (!TARGET_TABLE_REGEX.test(strVal)) {
        return t("form.errors.targetTableNameInvalidFormat");
      }
      return undefined;
    },

    slaDays: (val: unknown) => {
      if (val === null || val === undefined || val === "") {
        return t("form.errors.slaReq");
      }
      const numVal = Number(val);
      if (isNaN(numVal)) {
        return t("form.errors.slaPositiveInteger");
      }
      if (numVal < 0) {
        return t("form.errors.slaMustBeNonNegative");
      }
      if (numVal > 365) {
        return t("form.errors.slaMaxDays");
      }
      return undefined;
    },
    displaySequence: (val: unknown) => {
      if (val === null || val === undefined || val === "") {
        return t("form.errors.displaySequenceReq");
      }
      const numVal = Number(val);
      if (isNaN(numVal) || numVal < 0) {
        return t("form.errors.displaySequenceInvalid");
      }
      return undefined;
    },
    description: (val: unknown) => {
      const strVal = String(val ?? "").trim();
      if (!strVal) return undefined;
      if (strVal.length > DESCRIPTION_MAX) return t("form.errors.descMaxLength");
      if (isAllZeros(strVal) || !DESCRIPTION_REGEX.test(strVal)) return t("form.errors.invalidFormat");
      return undefined;
    },
    isActive: (val: unknown) => {
      if (!isEdit && val !== true) {
        return t("form.errors.mustBeActive");
      }
      return undefined;
    },
  };
  return validateForm(data, schema);
};

export const validateGrievanceCategoryServerAction = (
  data: AssetGrievanceCategoryFormModel,
  isEdit: boolean
): { isValid: boolean; errors: Partial<Record<keyof AssetGrievanceCategoryFormModel, string>> } => {
  const errors = validateGrievanceCategoryForm(data, (key) => key, isEdit);
  const filteredErrors: Partial<Record<keyof AssetGrievanceCategoryFormModel, string>> = {};
  for (const [k, v] of Object.entries(errors)) {
    if (v) filteredErrors[k as keyof AssetGrievanceCategoryFormModel] = v;
  }
  return {
    isValid: Object.keys(filteredErrors).length === 0,
    errors: filteredErrors,
  };
};

// Reference check (DELETE, or PUT with isActive: false):
//   "This Grievance Category cannot be deleted because it has Grievance Remarks. Please delete all Grievance Remarks for this Grievance Category first."
function translateGrievanceCategoryReferenceBlocked(
  message: string | undefined,
  t: (key: string, values?: Record<string, string | number | Date>) => string
): string | undefined {
  return translateReferenceBlockedMessage(message, t, {
    entities: { "Grievance Category": "apiErrors.referenceBlocked.grievanceCategory" },
    masters: { "Grievance Remarks": "apiErrors.referenceMasters.grievanceRemarks" },
    andKey: "apiErrors.referenceMasters.and",
  });
}

/** True when the backend refused to deactivate the record because other records still use it. */
export function isDeactivateBlockedMessage(message: string | undefined): boolean {
  return parseReferenceBlockedMessage(message)?.operation === "deactivate";
}

export const mapGrievanceCategoryApiError = (
  result: { statusCode?: number; message?: string },
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string
): string => {
  const referenceBlocked = translateGrievanceCategoryReferenceBlocked(result.message, t);
  if (referenceBlocked) return referenceBlocked;

  if (result.message === "AssetGrievanceCategory_GrievanceTypeCode_Duplicate") {
    try {
      const trans = t("apiErrors.AssetGrievanceCategory_GrievanceTypeCode_Duplicate");
      if (trans && trans !== "apiErrors.AssetGrievanceCategory_GrievanceTypeCode_Duplicate") return trans;
    } catch {}
  }
  if (result.message === "AssetGrievanceCategory_CategoryName_Duplicate") {
    try {
      const trans = t("apiErrors.AssetGrievanceCategory_CategoryName_Duplicate");
      if (trans && trans !== "apiErrors.AssetGrievanceCategory_CategoryName_Duplicate") return trans;
    } catch {}
  }

  // Prevent dynamic duplicate messages (like "Code 'DFGH' already exists") from hitting
  // mapSharedApiError, which tries to translate the exact string and throws warnings.
  const lowerMsg = (result.message || "").toLowerCase();
  if (result.statusCode === 409 || lowerMsg.includes("duplicate") || lowerMsg.includes("already exists")) {
    try {
      const dup = t("apiErrors.duplicateRecord") || t("form.errors.duplicateRecord") || t("form.errors.duplicateName");
      if (dup && !dup.includes("apiErrors") && !dup.includes("form.errors")) return dup;
    } catch {}
    return "Record already exists.";
  }

  return mapSharedApiError({
    message: result.message,
    statusCode: result.statusCode,
    t,
    tCommon,
    fallbackEntityName: t("master.title"),
    customStatusCodes: {
      409: t("form.errors.duplicateRecord") || t("form.errors.duplicateName"),
      404: t("form.errors.recordNotFound"),
      401: tCommon("errors.unauthorized"),
      403: tCommon("errors.unauthorized"),
    }
  });
};

export function getCategoryErrorMessage(
  message: string | undefined,
  statusCode: number | undefined,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string,
  fallbackEntityName: string
): string {
  const referenceBlocked = translateGrievanceCategoryReferenceBlocked(message, t);
  if (referenceBlocked) return referenceBlocked;

  return mapSharedApiError({
    message,
    statusCode,
    t,
    tCommon,
    fallbackEntityName,
  });
}

export const CATEGORY_VALIDATION_ERROR_KEYS = new Set([
  "form.errors.typeCodeReq",
  "form.errors.typeCodeMaxLength",
  "form.errors.typeCodeInvalidFormat",
  "form.errors.typeNameReq",
  "form.errors.typeNameMaxLength",
  "form.errors.typeNameLocalReq",
  "form.errors.typeNameLocalMaxLength",
  "form.errors.codeFormatReq",
  "form.errors.codeFormatMaxLength",
  "form.errors.codeFormatInvalidFormat",
  "form.errors.targetTableNameReq",
  "form.errors.targetTableNameMaxLength",
  "form.errors.targetTableNameInvalidFormat",

  "form.errors.slaReq",
  "form.errors.slaPositiveInteger",
  "form.errors.slaMustBeNonNegative",
  "form.errors.slaMaxDays",
  "form.errors.displaySequenceReq",
  "form.errors.displaySequenceInvalid",

  "form.errors.descMaxLength",
  "form.errors.invalidFormat",
  "form.errors.mustBeActive",
]);

export function translateCategoryValidationError(
  keyOrMessage: string,
  t: (key: string, values?: Record<string, string | number | Date>) => string
): string {
  if (CATEGORY_VALIDATION_ERROR_KEYS.has(keyOrMessage)) {
    try {
      return t(keyOrMessage) || keyOrMessage;
    } catch {
      return keyOrMessage;
    }
  }
  return keyOrMessage;
}

export function validateAndPrepareCategorySearchTerm(searchTerm?: string): string | undefined {
  if (typeof searchTerm !== "string") return undefined;
  const sanitized = searchTerm.replace(TEXT_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ").trim();
  if (sanitized.length === 0) return undefined;
  const MAX_SEARCH_TERM_LENGTH = 100;
  return sanitized.slice(0, MAX_SEARCH_TERM_LENGTH);
}

