import { validateForm } from "@/lib/utils/validation";
import {
  NAME_ONLY_REGEX,
  NAME_ONLY_SANITIZE,
  ASSET_MASTER_TEXT_SANITIZE,
  DESCRIPTION_REGEX,
} from "@/lib/utils/asset-validation-rules";
import { createSafeMasterTranslator } from "@/lib/utils/asset-utils/createSafeMasterTranslator";
import type { InventoryConditionFormModel } from "@/types/asset-masters/inventory-condition.types";
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
  } else if (name === "conditionName") {
    sanitizedValue = value.replace(NAME_ONLY_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ");
    if (sanitizedValue.length > NAME_MAX) {
      sanitizedValue = sanitizedValue.substring(0, NAME_MAX);
    }
  } else if (name === "conditionFactor") {
    sanitizedValue = value.replace(/[^0-9.]/g, "");
    const parts = sanitizedValue.split(".");
    if (parts.length > 2) {
      sanitizedValue = parts[0] + "." + parts.slice(1).join("");
    }
  } else if (name === "displayOrder") {
    sanitizedValue = value.replace(/[^0-9]/g, "");
  }
  return sanitizedValue;
};

export const validateInventoryConditionForm = (
  data: InventoryConditionFormModel,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  isEdit: boolean
): Partial<Record<keyof InventoryConditionFormModel, string>> => {
  const safeT = createSafeMasterTranslator(t);

  const schema = {
    conditionCategory: (val: unknown) => {
      const categoryType = val || data.conditionType;
      if (!categoryType || String(categoryType).trim() === "") {
        return safeT('conditionTypeRequired');
      }
      return undefined;
    },
    conditionType: (val: unknown) => {
      const categoryType = val || data.conditionCategory;
      if (!categoryType || String(categoryType).trim() === "") {
        return safeT('conditionTypeRequired');
      }
      return undefined;
    },
    categoryId: (val: unknown) => {
      const num = Number(val || data.inventoryItemCategoryId);
      if (!num || isNaN(num) || num <= 0) {
        return safeT('categoryRequired');
      }
      return undefined;
    },
    inventoryItemCategoryId: (val: unknown) => {
      const num = Number(val || data.categoryId);
      if (!num || isNaN(num) || num <= 0) {
        return safeT('categoryRequired');
      }
      return undefined;
    },
    conditionName: (val: unknown) => {
      const str = String(val ?? '').trim();
      if (!str) return safeT('nameRequired');
      if (str.length > NAME_MAX) return safeT('nameMaxLength', { count: NAME_MAX });
      if (/^0+$/.test(str)) return safeT('nameAllZeros');
      if (!NAME_ONLY_REGEX.test(str)) return safeT('nameFormat');
      return undefined;
    },
    conditionFactor: (val: unknown) => {
      if (val === null || val === undefined || val === "" || String(val).trim() === "") {
        return safeT('conditionFactorRequired');
      }
      const num = Number(val);
      if (isNaN(num) || num < 0 || num > 1) {
        return safeT('conditionFactorRange');
      }
      return undefined;
    },
    displayOrder: (val: unknown) => {
      if (val === null || val === undefined || val === "") return safeT('displayOrderRequired');
      const num = Number(val);
      if (isNaN(num) || num < 1 || !Number.isInteger(num)) {
        return safeT('displayOrderInvalid');
      }
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
    isActive: (val: unknown) => {
      if (!isEdit && val !== true) {
        return safeT('mustBeActive');
      }
      return undefined;
    },
  };
  return validateForm(data, schema);
};

export interface ServerValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedDto?: {
    conditionCategory: "Asset" | "Inventory";
    categoryId: number;
    conditionName: string;
    description: string | null;
    conditionFactor: number;
    displayOrder: number;
    isActive: boolean;
  };
}

export function validateInventoryConditionServerInput(
  formData: InventoryConditionFormModel,
  isEdit = false
): ServerValidationResult {
  const errors: Record<string, string> = {};

  const categoryType = (formData.conditionCategory || formData.conditionType) as string | undefined;
  if (!categoryType || (categoryType !== "Asset" && categoryType !== "Inventory")) {
    errors.conditionCategory = "Condition category must be either 'Asset' or 'Inventory'.";
  }

  const rawCatId = formData.categoryId ?? formData.inventoryItemCategoryId;
  const numCatId = typeof rawCatId === "number" ? rawCatId : Number(String(rawCatId ?? "").trim());
  if (!Number.isInteger(numCatId) || numCatId <= 0) {
    errors.categoryId = "Valid category is required.";
  }

  const conditionName = String(formData.conditionName ?? "").trim();
  if (!conditionName) {
    errors.conditionName = "Condition name is required.";
  } else if (conditionName.length > NAME_MAX) {
    errors.conditionName = `Condition name cannot exceed ${NAME_MAX} characters.`;
  } else if (/^0+$/.test(conditionName)) {
    errors.conditionName = "Condition name cannot be all zeros.";
  } else if (!NAME_ONLY_REGEX.test(conditionName)) {
    errors.conditionName = "Condition name contains invalid characters.";
  }

  const rawFactor = formData.conditionFactor;
  let conditionFactor = 0;
  if (rawFactor === null || rawFactor === undefined || rawFactor === "" || String(rawFactor).trim() === "") {
    errors.conditionFactor = "Condition factor is required.";
  } else {
    const numFactor = typeof rawFactor === "number" ? rawFactor : Number(rawFactor);
    if (!Number.isFinite(numFactor) || numFactor < 0 || numFactor > 1) {
      errors.conditionFactor = "Condition factor must be a number between 0 and 1.";
    } else {
      conditionFactor = numFactor;
    }
  }

  let displayOrder = 0;
  const rawOrder = formData.displayOrder;
  if (rawOrder !== null && rawOrder !== undefined && rawOrder !== "" && String(rawOrder).trim() !== "") {
    const numOrder = typeof rawOrder === "number" ? rawOrder : Number(rawOrder);
    if (!Number.isFinite(numOrder) || numOrder < 1 || !Number.isInteger(numOrder)) {
      errors.displayOrder = "Display order must be an integer greater than or equal to 1.";
    } else {
      displayOrder = numOrder;
    }
  } else {
    errors.displayOrder = "Display order is required.";
  }

  const rawDesc = String(formData.description ?? "").trim();
  let description: string | null = null;
  if (rawDesc) {
    if (rawDesc.length > DESCRIPTION_MAX) {
      errors.description = `Description cannot exceed ${DESCRIPTION_MAX} characters.`;
    } else if (/^0+$/.test(rawDesc)) {
      errors.description = "Description cannot be all zeros.";
    } else if (!DESCRIPTION_REGEX.test(rawDesc)) {
      errors.description = "Description contains invalid characters.";
    } else {
      description = rawDesc;
    }
  }

  const isActive = Boolean(formData.isActive);
  if (!isEdit && !isActive) {
    errors.isActive = "New records must be active.";
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: {},
    sanitizedDto: {
      conditionCategory: categoryType as "Asset" | "Inventory",
      categoryId: numCatId,
      conditionName,
      description,
      conditionFactor,
      displayOrder,
      isActive,
    },
  };
}

// Reference check (DELETE, or PUT with isActive: false): "This Condition cannot be deleted because it is in use."
const REFERENCE_BLOCKED_OPTIONS: ReferenceBlockedTranslationOptions = {
  entities: { "Condition": "apiErrors.referenceBlocked.condition" },
};

/** True when the backend refused to deactivate the record because other records still use it. */
export function isDeactivateBlocked(result: { message?: string; error?: string; success?: boolean }): boolean {
  return parseReferenceBlockedMessage(result.message || result.error)?.operation === "deactivate";
}

export const mapInventoryConditionApiError = (
  result: { statusCode?: number; message?: string; error?: string; success?: boolean },
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string
): string => {
  const rawMsg = (result.message || result.error || "").replace(/\.$/, "");
  const referenceBlocked = translateReferenceBlockedMessage(result.message || result.error, t, REFERENCE_BLOCKED_OPTIONS);
  if (referenceBlocked) return referenceBlocked;

  if (result.error === "duplicate" || rawMsg.toLowerCase().includes("duplicate") || rawMsg.toLowerCase().includes("already exists")) {
    return t("configuration.masterData.form.validation.duplicateRecord") || "Record already exists.";
  }

  const errorMap: Record<number, string> = {
    409: t("configuration.masterData.form.validation.duplicateRecord") || "Record already exists.",
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
    ? (t("apiErrors.duplicateRecord") || "Record is in use.")
    : (tCommon("errors.generic") || tCommon("errors.deleteError"));
}
