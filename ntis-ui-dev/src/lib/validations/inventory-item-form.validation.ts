import type { InventoryConditionFormModel } from "@/types/asset-masters/inventory-condition.types";
import type { InventoryNameFormModel } from "@/types/asset-masters/inventory-name.types";
import { isAllZeros, CODE_REGEX, DESCRIPTION_REGEX, ASSET_MASTER_NAME_REGEX } from "@/lib/utils/asset-validation-rules";

export function validateInventoryConditionForm(
  data: InventoryConditionFormModel,
  t: (key: string) => string
): Record<string, string> {
    const e: Record<string, string> = {};
    if (!data.conditionType) {
      e.conditionType = t("configuration.masterData.form.errors.conditionTypeRequired");
    }
    if (!data.inventoryItemCategoryId || data.inventoryItemCategoryId === 0) {
      e.inventoryItemCategoryId = t("configuration.masterData.form.errors.categoryRequired");
    }
    const nameStr = String(data.conditionName || "").trim();
    if (!nameStr) {
      e.conditionName = t("configuration.masterData.form.errors.nameRequired");
    } else if (nameStr.length > 50) {
      e.conditionName = t("configuration.masterData.form.errors.nameTooLong50");
    } else if (!ASSET_MASTER_NAME_REGEX.test(nameStr)) {
      e.conditionName = t("configuration.masterData.form.errors.nameFormat");
    }
    const factorNum = Number(data.conditionFactor);
    if (data.conditionFactor === undefined || data.conditionFactor === null || data.conditionFactor === "") {
      e.conditionFactor = t("configuration.masterData.form.errors.conditionFactorRequired");
    } else if (isNaN(factorNum) || factorNum < 0) {
      e.conditionFactor = t("configuration.masterData.form.errors.conditionFactorInvalid");
    } else if (factorNum > 1) {
      e.conditionFactor = t("configuration.masterData.form.errors.conditionFactorRange");
    }
    const descStr = String(data.description || "").trim();
    if (descStr.length > 500) {
      e.description = t("configuration.masterData.form.errors.descriptionTooLong");
    }
    return e;
}

export function validateInventoryNameForm(
  data: InventoryNameFormModel,
  t: (key: string) => string,
  tCommon: (key: string) => string
): Record<string, string> {
    const e: Record<string, string> = {};
    if (!data.inventoryItemCategoryId || data.inventoryItemCategoryId === 0) {
      e.inventoryItemCategoryId = t("configuration.masterData.form.errors.categoryRequired");
    }
    const codeStr = String(data.subTypeCode || "").trim();
    if (!codeStr) {
      e.subTypeCode = t("configuration.masterData.form.errors.codeRequired");
    } else if (isAllZeros(codeStr)) {
      e.subTypeCode = tCommon("validation.codeAllZeros");
    } else if (codeStr.length > 15) {
      e.subTypeCode = t("configuration.masterData.form.errors.codeTooLong15");
    } else if (!CODE_REGEX.test(codeStr)) {
      e.subTypeCode = tCommon("validation.codeFormat");
    }

    const nameStr = String(data.subTypeName || "").trim();
    if (!nameStr) {
      e.subTypeName = t("configuration.masterData.form.errors.nameRequired");
    } else if (isAllZeros(nameStr)) {
      e.subTypeName = tCommon("validation.nameAllZeros");
    } else if (nameStr.length > 50) {
      e.subTypeName = t("configuration.masterData.form.errors.nameTooLong50");
    } else if (!ASSET_MASTER_NAME_REGEX.test(nameStr)) {
      e.subTypeName = tCommon("validation.nameFormat");
    }

    const descStr = String(data.description || "").trim();
    if (descStr.length > 500) {
      e.description = t("configuration.masterData.form.errors.descriptionTooLong");
    } else if (descStr.length > 0) {
      if (isAllZeros(descStr)) {
        e.description = tCommon("validation.descriptionAllZeros");
      } else if (!DESCRIPTION_REGEX.test(descStr)) {
        e.description = tCommon("validation.descriptionFormat");
      }
    }
    return e;
}
