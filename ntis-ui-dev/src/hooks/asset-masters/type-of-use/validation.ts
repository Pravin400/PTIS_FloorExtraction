import {
  validateForm
} from "@/lib/utils/validation";
import {
  CODE_REGEX,
  CODE_SANITIZE,
  ASSET_MASTER_NAME_REGEX,
  ASSET_MASTER_NAME_SANITIZE,
  NAME_ONLY_REGEX,
  NAME_ONLY_SANITIZE,
  TEXT_SANITIZE
} from "@/lib/utils/asset-validation-rules";
import {
  TypeOfUseGroupFormModel,
  AssetTypeOfUseFormModel,
  AssetSubTypeOfUseFormModel
} from "@/types/asset-masters/type-of-use.types";

// Backend Constraints mapping:
// TypeOfUseGroup:
export const GROUP_CODE_MAX = 10;
export const GROUP_NAME_MAX = 50;

// AssetTypeOfUse:
export const TYPE_CODE_MAX = 10;
export const TYPE_NAME_MAX = 100;

// AssetSubTypeOfUse:
export const SUBTYPE_NAME_MAX = 100;



export const sanitizeGroupFieldValue = (name: string, value: string): string => {
  let sanitizedValue = value;
  if (name === "typeOfUseGroupCode") {
    sanitizedValue = value.replace(CODE_SANITIZE, "").toUpperCase();
    if (sanitizedValue.length > GROUP_CODE_MAX) {
      sanitizedValue = sanitizedValue.substring(0, GROUP_CODE_MAX);
    }
  } else if (name === "groupName") {
    sanitizedValue = value.replace(NAME_ONLY_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ");
    if (sanitizedValue.length > GROUP_NAME_MAX) {
      sanitizedValue = sanitizedValue.substring(0, GROUP_NAME_MAX);
    }
  }
  return sanitizedValue;
};

export const sanitizeTypeOfUseFieldValue = (name: string, value: string): string => {
  let sanitizedValue = value;
  if (name === "typeOfUseCode") {
    sanitizedValue = value.replace(CODE_SANITIZE, "").toUpperCase();
    if (sanitizedValue.length > TYPE_CODE_MAX) {
      sanitizedValue = sanitizedValue.substring(0, TYPE_CODE_MAX);
    }
  } else if (name === "description") {
    sanitizedValue = value.replace(ASSET_MASTER_NAME_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ");
    if (sanitizedValue.length > TYPE_NAME_MAX) {
      sanitizedValue = sanitizedValue.substring(0, TYPE_NAME_MAX);
    }
  }
  return sanitizedValue;
};

export const sanitizeSubTypeOfUseFieldValue = (name: string, value: string): string => {
  let sanitizedValue = value;
  if (name === "description") {
    sanitizedValue = value.replace(ASSET_MASTER_NAME_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ");
    if (sanitizedValue.length > SUBTYPE_NAME_MAX) {
      sanitizedValue = sanitizedValue.substring(0, SUBTYPE_NAME_MAX);
    }
  }
  return sanitizedValue;
};

export const validateGroupForm = (
  data: TypeOfUseGroupFormModel,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  isEdit: boolean
): Partial<Record<keyof TypeOfUseGroupFormModel, string>> => {
  const schema = {
    typeOfUseGroupCode: (val: unknown) => {
      const strVal = String(val ?? "").trim();
      if (!strVal) return t("errors.groupCodeRequired", { default: "Group Code is required" });
      if (strVal.length > GROUP_CODE_MAX) return t("errors.groupCodeMaxLength", { default: `Max ${GROUP_CODE_MAX} characters allowed` });
      if (!CODE_REGEX.test(strVal)) return t("errors.groupCodeFormat", { default: "Invalid code format" });
      return undefined;
    },
    groupName: (val: unknown) => {
      const str = String(val ?? "").trim();
      if (!str) return t("errors.groupNameRequired", { default: "Group Name is required" });
      if (str.length > GROUP_NAME_MAX) return t("errors.groupNameMaxLength", { default: `Max ${GROUP_NAME_MAX} characters allowed` });
      if (!NAME_ONLY_REGEX.test(str)) return t("errors.groupNameFormat", { default: "Invalid name format" });
      return undefined;
    },
    groupIcon: (val: unknown) => {
      const str = String(val ?? "").trim();
      if (!str) return t("apiErrors.TypeOfUseGroup_GroupIcon_Required", { default: "Group Icon is required" });
      if (str.length > 50) return t("apiErrors.TypeOfUseGroup_GroupIcon_MaxLen_50", { default: "Group Icon maximum length is 50 characters" });
      return undefined;
    },
    isActive: (val: unknown) => {
      if (!isEdit && val !== true) {
        return t("errors.mustBeActive");
      }
      return undefined;
    },
  };
  return validateForm(data, schema);
};

export const validateTypeOfUseForm = (
  data: AssetTypeOfUseFormModel,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  isEdit: boolean
): Partial<Record<keyof AssetTypeOfUseFormModel, string>> => {
  const schema = {
    assetCategoryId: (val: unknown) => {
      const n = Number(val);
      if (!n || n <= 0) return t("messages.categoryRequired", { default: "Category is required" });
      return undefined;
    },
    assetTypeId: (val: unknown) => {
      const n = Number(val);
      if (!n || n <= 0) return t("messages.typeRequired", { default: "Type is required" });
      return undefined;
    },
    typeOfUseGroupId: (val: unknown) => {
      const n = Number(val);
      if (!n || n <= 0) return t("messages.groupRequired", { default: "Group is required" });
      return undefined;
    },
    typeOfUseCode: (val: unknown) => {
      const strVal = String(val ?? "").trim();
      if (!strVal) return t("errors.typeOfUseCodeRequired", { default: "Code is required" });
      if (strVal.length > TYPE_CODE_MAX) return t("errors.typeOfUseCodeMaxLength", { default: `Max ${TYPE_CODE_MAX} characters allowed` });
      if (!CODE_REGEX.test(strVal)) return t("errors.typeOfUseCodeFormat", { default: "Invalid code format" });
      return undefined;
    },
    description: (val: unknown) => {
      const str = String(val ?? "").trim();
      if (!str) return t("messages.descriptionRequired", { default: "Description is required" });
      if (str.length > TYPE_NAME_MAX) return t("messages.descriptionMaxLength", { default: `Max ${TYPE_NAME_MAX} characters allowed` });
      if (!ASSET_MASTER_NAME_REGEX.test(str)) return t("errors.descriptionFormat", { default: "Invalid description format" });
      return undefined;
    },
    searchSequence: (val: unknown) => {
      if (val === "" || val === undefined || val === null || String(val).trim() === "") {
        return t("messages.sequenceRequired", { default: "Sequence is required" });
      }
      const n = Number(val);
      if (isNaN(n) || n < 0) {
        return t("messages.sequenceNonNegative", { default: "Sequence must be 0 or greater" });
      }
      if (n > 999) {
        return t("messages.sequenceMaxLimit", { default: "Sequence must be 999 or less" });
      }
      return undefined;
    },
    type: (val: unknown) => {
      const strVal = String(val ?? "").trim();
      if (!strVal) return t("type.fields.selectType", { default: "Type is required" });
      return undefined;
    },
    isActive: (val: unknown) => {
      if (!isEdit && val !== true) {
        return t("errors.mustBeActive");
      }
      return undefined;
    },
  };
  return validateForm(data, schema);
};

export const validateSubTypeOfUseForm = (
  data: AssetSubTypeOfUseFormModel,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  isEdit: boolean
): Partial<Record<keyof AssetSubTypeOfUseFormModel, string>> => {
  const schema = {
    typeOfUseId: (val: unknown) => {
      const n = Number(val);
      if (!n || n <= 0) return t("type.fields.selectType", { default: "Type is required" });
      return undefined;
    },
    description: (val: unknown) => {
      const str = String(val ?? "").trim();
      if (!str) return t("messages.subTypeNameRequired", { default: "Sub-Type Name is required" });
      if (str.length > SUBTYPE_NAME_MAX) return t("messages.subTypeNameMaxLength", { default: `Max ${SUBTYPE_NAME_MAX} characters allowed` });
      if (!ASSET_MASTER_NAME_REGEX.test(str)) return t("errors.subTypeNameFormat", { default: "Invalid subtype name format" });
      return undefined;
    },
    searchSequence: (val: unknown) => {
      if (val === "" || val === undefined || val === null || String(val).trim() === "") {
        return t("messages.sequenceRequired", { default: "Sequence is required" });
      }
      const n = Number(val);
      if (isNaN(n) || n < 0) {
        return t("messages.sequenceNonNegative", { default: "Sequence must be 0 or greater" });
      }
      if (n > 999) {
        return t("messages.sequenceMaxLimit", { default: "Sequence must be 999 or less" });
      }
      return undefined;
    },
    isActive: (val: unknown) => {
      if (!isEdit && val !== true) {
        return t("errors.mustBeActive");
      }
      return undefined;
    },
  };
  return validateForm(data, schema);
};

export function validateAndPrepareSearchTerm(searchTerm?: string): string | undefined {
  if (typeof searchTerm !== "string") return undefined;
  const sanitized = searchTerm.replace(TEXT_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ").trim();
  if (sanitized.length === 0) return undefined;
  const MAX_SEARCH_TERM_LENGTH = 100;
  return sanitized.slice(0, MAX_SEARCH_TERM_LENGTH);
}


