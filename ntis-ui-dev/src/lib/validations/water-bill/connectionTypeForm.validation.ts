import type { ConnectionTypeFormModel } from "@/types/waterBill/connectionTypeMaster.types";
import { CODE_REGEX, DESCRIPTION_REGEX, NAME_ONLY_STRICT_REGEX } from "@/lib/utils/validation-rules";

export function validateConnectionTypeForm(
  data: ConnectionTypeFormModel,
  t: (key: string) => string
): Partial<Record<keyof ConnectionTypeFormModel, string>> {
  const errs: Partial<Record<keyof ConnectionTypeFormModel, string>> = {};
  
  if (!data.connectionTypeCode?.trim()) {
    errs.connectionTypeCode = t("validation.connectionTypeCodeRequired") || "Connection Type Code is required";
  } else if (data.connectionTypeCode.trim().length > 20) {
    errs.connectionTypeCode = t("validation.connectionTypeCodeLength") || "Code cannot exceed 20 characters";
  } else if (!CODE_REGEX.test(data.connectionTypeCode)) {
    errs.connectionTypeCode = t("validation.codeFormat") || "Use only English letters, numbers, and underscores (_). The code cannot start or end with an underscore.";
  }

  if (!data.connectionType?.trim()) {
    errs.connectionType = t("validation.connectionTypeRequired") || "Connection Type is required";
  } else if (data.connectionType.length > 50) {
    errs.connectionType = t("validation.connectionTypeLength") || "Connection Type cannot exceed 50 characters";
  } else if (!NAME_ONLY_STRICT_REGEX.test(data.connectionType)) {
    errs.connectionType = t("validation.connectionTypeFormat") || "Only letters and a single space between words are allowed.";
  }
  
  if (data.description?.trim()) {
    if (data.description.length > 300) {
      errs.description = t("validation.descriptionLength") || "Description cannot exceed 300 characters";
    } else if (!DESCRIPTION_REGEX.test(data.description)) {
      errs.description = t("validation.descriptionFormat") || "Only letters, numbers, spaces, and basic punctuation allowed (,./-()).";
    }
  }
  
  return errs;
}
