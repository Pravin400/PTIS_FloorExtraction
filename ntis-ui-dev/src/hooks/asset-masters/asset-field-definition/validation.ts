import {
  CODE_SANITIZE,
  NAME_ONLY_SANITIZE,
  CODE_REGEX,
  NAME_ONLY_REGEX,
  OPTIONS_COMMA_SEPARATED_REGEX,
  OPTIONS_COMMA_SEPARATED_SANITIZE,
  isAllZeros,
} from "@/lib/utils/asset-validation-rules";
import { AssetFieldDefinitionFormModel } from "@/types/asset-masters/asset-field-definition.types";
import { getCleanErrorMessage, translateBackendMessage } from "@/lib/utils/backend-error-detection";
import { translateReferenceBlockedMessage } from "@/lib/utils/asset-utils/shared-error-mapping";

export const CODE_MAX = 50;
export const NAME_MAX = 100;
export const LABEL_MAX = 100;
export const GROUP_MAX = 100;
export const OPTIONS_MAX = 500;

export function formatOptionsJson(input: string | null | undefined): string | null {
  if (!input || !input.trim()) return null;
  const trimmed = input.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      const cleanArray = parsed.map((item) => String(item).trim()).filter(Boolean);
      return cleanArray.length > 0 ? JSON.stringify(cleanArray) : null;
    }
  } catch {
    // Not JSON string, fall through to comma separated logic
  }
  const items = trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length > 0 ? JSON.stringify(items) : null;
}

export function parseOptionsJsonToDisplay(optionsJson?: string | null): string {
  if (!optionsJson || !optionsJson.trim()) return "";
  try {
    const parsed = JSON.parse(optionsJson);
    if (Array.isArray(parsed)) {
      return parsed.join(", ");
    }
  } catch {
    // Return original string if not valid JSON array
  }
  return optionsJson;
}

export const sanitizeFieldDefinitionValue = (name: string, value: string): string => {
  let val = value;
  if (name === "fieldCode") {
    val = value.replace(CODE_SANITIZE, "").toUpperCase().substring(0, CODE_MAX);
  } else if (name === "fieldName" || name === "fieldLabel" || name === "fieldGroup") {
    val = value.replace(NAME_ONLY_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ").substring(0, NAME_MAX);
  } else if (name === "optionsJson") {
    val = value.replace(OPTIONS_COMMA_SEPARATED_SANITIZE, "").replace(/\s{2,}/g, " ").substring(0, OPTIONS_MAX);
  }
  return val;
};

export const validateAssetFieldDefinitionForm = (
  data: AssetFieldDefinitionFormModel,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  isEdit: boolean
): Partial<Record<keyof AssetFieldDefinitionFormModel, string>> => {
  const errs: Partial<Record<keyof AssetFieldDefinitionFormModel, string>> = {};

  const codeVal = data.fieldCode?.trim() || "";
  if (!codeVal) {
    errs.fieldCode = t("form.validation.fieldCodeRequired");
  } else if (codeVal.length > CODE_MAX) {
    errs.fieldCode = t("form.validation.fieldCodeMaxLength", { count: CODE_MAX });
  } else if (isAllZeros(codeVal)) {
    errs.fieldCode = t("form.validation.fieldCodeAllZeros");
  } else if (!CODE_REGEX.test(codeVal)) {
    errs.fieldCode = t("form.validation.fieldCodeFormat");
  }

  const nameVal = data.fieldName?.trim() || "";
  if (!nameVal) {
    errs.fieldName = t("form.validation.fieldNameRequired");
  } else if (nameVal.length > NAME_MAX) {
    errs.fieldName = t("form.validation.fieldNameMaxLength", { count: NAME_MAX });
  } else if (isAllZeros(nameVal)) {
    errs.fieldName = t("form.validation.fieldNameAllZeros");
  } else if (!NAME_ONLY_REGEX.test(nameVal)) {
    errs.fieldName = t("form.validation.fieldNameFormat", { default: "Field Name must contain letters and spaces only" });
  }

  const labelVal = data.fieldLabel?.trim() || "";
  if (!labelVal) {
    errs.fieldLabel = t("form.validation.fieldLabelRequired");
  } else if (labelVal.length > LABEL_MAX) {
    errs.fieldLabel = t("form.validation.fieldLabelMaxLength", { count: LABEL_MAX });
  } else if (isAllZeros(labelVal)) {
    errs.fieldLabel = t("form.validation.fieldLabelAllZeros");
  } else if (!NAME_ONLY_REGEX.test(labelVal)) {
    errs.fieldLabel = t("form.validation.fieldLabelFormat", { default: "Field Label must contain letters and spaces only" });
  }

  const groupVal = data.fieldGroup?.trim() || "";
  if (!groupVal) {
    errs.fieldGroup = t("form.validation.fieldGroupRequired", { default: "Field Group is required" });
  } else if (groupVal.length > GROUP_MAX) {
    errs.fieldGroup = t("form.validation.fieldGroupMaxLength", { count: GROUP_MAX });
  } else if (isAllZeros(groupVal)) {
    errs.fieldGroup = t("form.validation.fieldGroupAllZeros");
  } else if (!NAME_ONLY_REGEX.test(groupVal)) {
    errs.fieldGroup = t("form.validation.fieldGroupFormat", { default: "Field Group must contain letters and spaces only" });
  }

  const typeVal = data.fieldType?.trim() || "";
  if (!typeVal) {
    errs.fieldType = t("form.validation.fieldTypeRequired");
  } else if (["checkbox", "radio", "select"].includes(typeVal)) {
    const optionsVal = data.optionsJson?.trim() || "";
    if (!optionsVal) {
      errs.optionsJson = t("form.validation.optionsJsonRequired", { default: "Options are required for checkbox, radio, and select field types" });
    } else if (optionsVal.length > OPTIONS_MAX) {
      errs.optionsJson = t("form.validation.optionsJsonMaxLength", { count: OPTIONS_MAX, default: `Maximum length is ${OPTIONS_MAX} characters` });
    } else if (!OPTIONS_COMMA_SEPARATED_REGEX.test(optionsVal)) {
      errs.optionsJson = t("form.validation.optionsJsonFormat", { default: "Options must be comma-separated letters or numbers (e.g. Male, Female)" });
    }
  }

  if (!data.assetCategoryId || data.assetCategoryId <= 0) {
    errs.assetCategoryId = t("form.validation.assetCategoryRequired");
  }

  if (!data.assetTypeId || data.assetTypeId <= 0) {
    errs.assetTypeId = t("form.validation.assetTypeRequired");
  }

  const orderStr = String(data.displayOrder ?? "").trim();
  const orderNum = Number(data.displayOrder);
  if (
    data.displayOrder === null ||
    data.displayOrder === undefined ||
    orderStr === "" ||
    Number.isNaN(orderNum)
  ) {
    errs.displayOrder = t("form.validation.displayOrderRequired");
  } else if (orderNum < 1 || orderNum > 99999) {
    errs.displayOrder = t("form.validation.displayOrderInvalid");
  }

  if (!isEdit && data.isActive !== true) {
    errs.isActive = t("form.validation.mustBeActive");
  }

  return errs;
};

export function resolveFieldDefinitionBackendError(
  message: string | undefined | null,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string) => string
): { toastMessage: string; fieldError?: { field: keyof AssetFieldDefinitionFormModel; message: string } } {
  if (!message) return { toastMessage: tCommon("operationFailed") };

  // Reference check (DELETE, or PUT with isActive: false):
  //   "This Asset Field Definition cannot be deleted|deactivated because it is in use."
  const referenceBlocked = translateReferenceBlockedMessage(message, t, {
    entities: { "Asset Field Definition": "apiErrors.referenceBlocked.assetFieldDefinition" },
  });
  if (referenceBlocked) return { toastMessage: referenceBlocked };

  const clean = getCleanErrorMessage(message);
  const lower = clean.toLowerCase();

  const isFieldCodeDuplicate =
    clean === "AssetFieldDefinition_FieldCode_Duplicate" ||
    lower.includes("fieldcode_duplicate") ||
    lower.includes("field_code_duplicate") ||
    (lower.includes("code") && (lower.includes("duplicate") || lower.includes("already exists")));

  if (isFieldCodeDuplicate) {
    const msg = t("errors.duplicateFieldCode");
    return { toastMessage: msg, fieldError: { field: "fieldCode", message: msg } };
  }

  const isFieldNameDuplicate =
    clean === "AssetFieldDefinition_FieldName_Duplicate" ||
    lower.includes("fieldname_duplicate") ||
    lower.includes("field_name_duplicate") ||
    (lower.includes("name") && (lower.includes("duplicate") || lower.includes("already exists")));

  if (isFieldNameDuplicate) {
    const msg = t("errors.duplicateFieldName");
    return { toastMessage: msg, fieldError: { field: "fieldName", message: msg } };
  }

  if (
    clean === "AssetFieldDefinition_Duplicate" ||
    lower.includes("assetfielddefinition_duplicate") ||
    lower.includes("already exists") ||
    lower.includes("duplicate")
  ) {
    const toastMsg = t("errors.duplicate");
    const fieldMsg = t("errors.duplicateFieldName");
    return { toastMessage: toastMsg, fieldError: { field: "fieldName", message: fieldMsg } };
  }

  return { toastMessage: translateBackendMessage(clean, tCommon) };
}
