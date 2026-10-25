import { CODE_REGEX, DESCRIPTION_REGEX, ASSET_INVENTORY_NAME_REGEX, ASSET_MASTER_NAME_REGEX, isAllZeros } from "../utils/asset-validation-rules";

const CODE_MAX = 15;
const NAME_MAX = 50;
const INV_NAME_MAX = 40;

type Translator = (key: string) => string;

export interface ValidationModel {
  code?: string;
  name: string;
  description?: string;
  group?: string; 
  depreciationRate?: string;
}

export const validateAssetMasterForm = (data: ValidationModel, t: Translator, options: { requiresGroup?: boolean; isInventory?: boolean; hasDepreciation?: boolean; hasCode?: boolean } = { hasCode: true }) => {
  const e: Record<string, string> = {};

  if (options.requiresGroup && !data.group) {
    e.group = t(options.isInventory ? "errors.group" : "validation.groupRequired");
  }

  if (options.hasCode !== false) {
    const codeVal = data.code || "";
    const codeRequired = options.isInventory ? "errors.codeRequired" : "validation.codeRequired";
    const codeAllZeros = options.isInventory ? "errors.codeAllZeros" : "validation.codeAllZeros";
    const codeMax = options.isInventory ? "errors.codeMax" : "validation.codeMax";
    const codeFormat = options.isInventory ? "errors.codeFormat" : "validation.codeFormat";

    if (!codeVal.trim()) {
      e.code = t(codeRequired);
    } else if (isAllZeros(codeVal)) {
      e.code = t(codeAllZeros);
    } else if (codeVal.length > CODE_MAX) {
      e.code = t(codeMax);
    } else if (!CODE_REGEX.test(codeVal)) {
      e.code = t(codeFormat);
    }
  }

  const nameRequired = options.isInventory ? "errors.nameRequired" : "validation.nameRequired";
  const nameAllZeros = options.isInventory ? "errors.nameAllZeros" : "validation.nameAllZeros";
  const nameMax = options.isInventory ? "errors.nameMax" : "validation.nameMax";
  const nameFormat = options.isInventory ? "errors.nameFormat" : "validation.nameFormat";
  const maxNameLen = options.isInventory ? INV_NAME_MAX : NAME_MAX;
  const nameRegex = options.isInventory ? ASSET_INVENTORY_NAME_REGEX : ASSET_MASTER_NAME_REGEX;

  if (!data.name.trim()) {
    e.name = t(nameRequired);
  } else if (isAllZeros(data.name)) {
    e.name = t(nameAllZeros);
  } else if (data.name.length > maxNameLen) {
    e.name = t(nameMax);
  } else if (!nameRegex.test(data.name.trim())) {
    e.name = t(nameFormat);
  }

  if (options.hasDepreciation) {
    if (data.depreciationRate === undefined || data.depreciationRate === null || data.depreciationRate === "") {
      e.depreciationRate = t("errors.depreciationRateRequired");
    } else {
      const num = parseFloat(data.depreciationRate);
      if (isNaN(num) || num < 0) {
        e.depreciationRate = t("errors.depreciationRateInvalid");
      } else if (num > 1) {
        e.depreciationRate = t("errors.depreciationRateRange");
      }
    }
  }

  const descAllZeros = options.isInventory ? "errors.descriptionAllZeros" : "validation.descriptionAllZeros";
  const descFormat = options.isInventory ? "errors.descriptionFormat" : "validation.descriptionFormat";

  if (data.description && data.description.trim()) {
    if (isAllZeros(data.description)) {
      e.description = t(descAllZeros);
    } else if (!DESCRIPTION_REGEX.test(data.description)) {
      e.description = t(descFormat);
    }
  }

  return e;
};
