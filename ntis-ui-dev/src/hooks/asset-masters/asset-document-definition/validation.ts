import {
  CODE_SANITIZE,
  DESCRIPTION_SANITIZE,
  ASSET_MASTER_NAME_SANITIZE,
  CODE_REGEX,
  ASSET_MASTER_NAME_REGEX,
  DESCRIPTION_REGEX,
  isAllZeros,
} from "@/lib/utils/asset-validation-rules";
import { AssetDocumentDefinitionFormModel } from "@/types/asset-masters/asset-document-definition.types";
import { getCleanErrorMessage, translateBackendMessage } from "@/lib/utils/backend-error-detection";
import { translateReferenceBlockedMessage } from "@/lib/utils/asset-utils/shared-error-mapping";

export const CODE_MAX = 50;
export const NAME_MAX = 100;
export const DESCRIPTION_MAX = 200;

export const sanitizeFieldValue = (name: string, value: string): string => {
  let val = value;
  if (name === "documentCode") {
    val = value.replace(CODE_SANITIZE, "").toUpperCase().substring(0, CODE_MAX);
  } else if (name === "documentName") {
    val = value.replace(ASSET_MASTER_NAME_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ").substring(0, NAME_MAX);
  } else if (name === "description") {
    val = value.replace(DESCRIPTION_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ").substring(0, DESCRIPTION_MAX);
  }
  return val;
};

export const validateAssetDocumentDefinitionForm = (
  data: AssetDocumentDefinitionFormModel,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  isEdit: boolean
): Partial<Record<keyof AssetDocumentDefinitionFormModel, string>> => {
  const errs: Partial<Record<keyof AssetDocumentDefinitionFormModel, string>> = {};

  // documentCode validation (Required)
  const codeVal = data.documentCode?.trim() || "";
  if (!codeVal) {
    errs.documentCode = t("form.validation.documentCodeRequired");
  } else if (codeVal.length > CODE_MAX) {
    errs.documentCode = t("form.validation.documentCodeMaxLength", { count: CODE_MAX });
  } else if (isAllZeros(codeVal)) {
    errs.documentCode = t("form.validation.documentCodeAllZeros");
  } else if (!CODE_REGEX.test(codeVal)) {
    errs.documentCode = t("form.validation.documentCodeFormat");
  }

  // documentName validation (Required - Asset Master Name Standard)
  const nameVal = data.documentName?.trim() || "";
  if (!nameVal) {
    errs.documentName = t("form.validation.documentNameRequired");
  } else if (nameVal.length > NAME_MAX) {
    errs.documentName = t("form.validation.documentNameMaxLength", { count: NAME_MAX });
  } else if (isAllZeros(nameVal)) {
    errs.documentName = t("form.validation.documentNameAllZeros");
  } else if (!ASSET_MASTER_NAME_REGEX.test(nameVal)) {
    errs.documentName = t("form.validation.documentNameFormat");
  }

  // description validation (Required)
  const descVal = data.description?.trim() || "";
  if (!descVal) {
    errs.description = t("form.validation.descriptionRequired");
  } else if (descVal.length > DESCRIPTION_MAX) {
    errs.description = t("form.validation.descriptionMaxLength", { count: DESCRIPTION_MAX });
  } else if (isAllZeros(descVal)) {
    errs.description = t("form.validation.descriptionAllZeros");
  } else if (!DESCRIPTION_REGEX.test(descVal)) {
    errs.description = t("form.validation.descriptionFormat");
  }

  if (!data.assetCategoryId || data.assetCategoryId <= 0) {
    errs.assetCategoryId = t("form.validation.assetCategoryRequired");
  }

  if (!data.assetTypeId || data.assetTypeId <= 0) {
    errs.assetTypeId = t("form.validation.assetTypeRequired");
  }

  // displayOrder validation
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

  // active status on create
  if (!isEdit && data.isActive !== true) {
    errs.isActive = t("form.validation.mustBeActive");
  }

  return errs;
};

export function resolveDocumentDefinitionBackendError(
  message: string | undefined | null,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string) => string
): { toastMessage: string; fieldError?: { field: keyof AssetDocumentDefinitionFormModel; message: string } } {
  if (!message) return { toastMessage: tCommon("operationFailed") };

  // Reference check (DELETE, or PUT with isActive: false):
  //   "This Asset Document Definition cannot be deleted|deactivated because it is in use."
  const referenceBlocked = translateReferenceBlockedMessage(message, t, {
    entities: { "Asset Document Definition": "apiErrors.referenceBlocked.assetDocumentDefinition" },
  });
  if (referenceBlocked) return { toastMessage: referenceBlocked };

  const clean = getCleanErrorMessage(message);
  const lower = clean.toLowerCase();

  const isDocumentCodeDuplicate =
    clean === "AssetDocumentDefinition_DocumentCode_Duplicate" ||
    lower.includes("documentcode_duplicate") ||
    lower.includes("document_code_duplicate") ||
    (lower.includes("code") && (lower.includes("duplicate") || lower.includes("already exists")));

  if (isDocumentCodeDuplicate) {
    const msg = t("errors.duplicateDocumentCode");
    return { toastMessage: msg, fieldError: { field: "documentCode", message: msg } };
  }

  const isDocumentNameDuplicate =
    clean === "AssetDocumentDefinition_DocumentName_Duplicate" ||
    lower.includes("documentname_duplicate") ||
    lower.includes("document_name_duplicate") ||
    (lower.includes("name") && (lower.includes("duplicate") || lower.includes("already exists")));

  if (isDocumentNameDuplicate) {
    const msg = t("errors.duplicateDocumentName");
    return { toastMessage: msg, fieldError: { field: "documentName", message: msg } };
  }

  if (
    clean === "AssetDocumentDefinition_AssetCategoryId_Invalid" ||
    lower.includes("assetcategoryid_invalid")
  ) {
    const msg = t("errors.invalidAssetCategory");
    return { toastMessage: msg, fieldError: { field: "assetCategoryId", message: msg } };
  }

  if (
    clean === "AssetDocumentDefinition_AssetTypeId_Invalid" ||
    lower.includes("assettypeid_invalid")
  ) {
    const msg = t("errors.invalidAssetType");
    return { toastMessage: msg, fieldError: { field: "assetTypeId", message: msg } };
  }

  if (
    clean === "AssetDocumentDefinition_Duplicate" ||
    lower.includes("assetdocumentdefinition_duplicate") ||
    lower.includes("already exists") ||
    lower.includes("duplicate")
  ) {
    const toastMsg = t("errors.duplicate");
    const fieldMsg = t("errors.duplicateDocumentName");
    return { toastMessage: toastMsg, fieldError: { field: "documentName", message: fieldMsg } };
  }

  return { toastMessage: translateBackendMessage(clean, tCommon) };
}
