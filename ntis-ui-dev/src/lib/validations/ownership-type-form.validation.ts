import type { OwnershipTypeFormModel } from "@/types/asset-masters/ownership-type.types";
import { DESCRIPTION_REGEX, isAllZeros, NAME_ONLY_REGEX } from "../utils/asset-validation-rules";

export function validateOwnershipTypeForm(
  data: OwnershipTypeFormModel,
  t: (key: string) => string
): Record<string, string> {
  const errors: Record<string, string> = {};
  
  const nameStr = String(data.ownershipTypeName || "").trim();
  if (!nameStr) {
    errors.ownershipTypeName = t("configuration.masterData.form.errors.nameRequired");
  } else if (isAllZeros(nameStr)) {
    errors.ownershipTypeName = t("configuration.masterData.form.errors.nameInvalid");
  } else if (nameStr.length > 50) {
    errors.ownershipTypeName = t("configuration.masterData.form.errors.nameTooLong50");
  } else if (!NAME_ONLY_REGEX.test(nameStr)) {
    errors.ownershipTypeName = t("configuration.masterData.form.errors.nameInvalid");
  }
  
  const descStr = String(data.description || "").trim();
  if (descStr) {
    if (isAllZeros(descStr)) {
      errors.description = t("configuration.masterData.form.errors.descriptionInvalid");
    } else if (descStr.length > 100) {
      errors.description = t("configuration.masterData.form.errors.descriptionTooLong");
    } else if (!DESCRIPTION_REGEX.test(descStr)) {
      errors.description = t("configuration.masterData.form.errors.descriptionInvalid");
    }
  }
  
  return errors;
}
