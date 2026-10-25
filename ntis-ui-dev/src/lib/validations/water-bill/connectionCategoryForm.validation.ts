import type { ConnectionCategoryFormModel } from "@/types/waterBill/connectionCategoryMaster.types";
import { CODE_REGEX, DESCRIPTION_REGEX, NAME_ONLY_STRICT_REGEX } from "@/lib/utils/validation-rules";
import { METERED_BILLING_METHODS, NON_METERED_BILLING_METHODS } from "@/types/waterBill/connectionCategoryMaster.types";

export function validateConnectionCategoryForm(
  data: ConnectionCategoryFormModel,
  t: (key: string) => string
): Partial<Record<keyof ConnectionCategoryFormModel, string>> {
  const errs: Partial<Record<keyof ConnectionCategoryFormModel, string>> = {};

  if (!data.connectionCategoryCode?.trim()) {
    errs.connectionCategoryCode = t("validation.connectionCategoryCodeRequired") || "Connection Category Code is required";
  } else if (data.connectionCategoryCode.trim().length > 20) {
    errs.connectionCategoryCode = t("validation.connectionCategoryCodeLength") || "Code cannot exceed 20 characters";
  } else if (!CODE_REGEX.test(data.connectionCategoryCode)) {
    errs.connectionCategoryCode = t("validation.codeFormat") || "Use only English letters, numbers, and underscores (_). The code cannot start or end with an underscore.";
  }

  if (!data.connectionCategory?.trim()) {
    errs.connectionCategory = t("validation.connectionCategoryRequired") || "Connection Category is required";
  } else if (data.connectionCategory.length > 50) {
    errs.connectionCategory = t("validation.connectionCategoryLength") || "Category name cannot exceed 50 characters";
  } else if (!NAME_ONLY_STRICT_REGEX.test(data.connectionCategory)) {
    errs.connectionCategory = t("validation.connectionCategoryFormat") || "Only letters and a single space between words are allowed.";
  }

  if (data.billingFrequencyId === null || data.billingFrequencyId === undefined) {
    errs.billingFrequencyId = t("validation.billingFrequencyRequired") || "Please select a billing frequency";
  }

  if (!data.billingMethod?.trim()) {
    errs.billingMethod = t("validation.billingMethodRequired") || "Billing Method is required";
  } else if (data.isMetered && (NON_METERED_BILLING_METHODS as readonly string[]).includes(data.billingMethod)) {
    errs.billingMethod = t("validation.billingMethodInvalid") || "Selected billing method is not valid for metered connections";
  } else if (!data.isMetered && (METERED_BILLING_METHODS as readonly string[]).includes(data.billingMethod)) {
    errs.billingMethod = t("validation.billingMethodInvalid") || "Selected billing method is not valid for non-metered connections";
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
