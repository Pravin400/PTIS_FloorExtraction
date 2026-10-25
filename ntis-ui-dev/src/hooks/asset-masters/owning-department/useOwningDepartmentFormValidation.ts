"use client";

import { useCallback } from "react";
import type { OwningDepartmentFormModel } from "@/types/asset-masters/owning-department.types";
import { validateForm } from "@/lib/utils/validation";
import { isAllZeros, ALPHANUMERIC_WITH_SPACES_REGEX, DESCRIPTION_REGEX } from "@/lib/utils/asset-validation-rules";

interface UseOwningDepartmentFormValidationProps {
  isEdit: boolean;
  submittedOnce: boolean;
  touched: Record<string, boolean>;
  errors: Partial<Record<keyof OwningDepartmentFormModel, string>>;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export function useOwningDepartmentFormValidation({
  submittedOnce,
  touched,
  errors,
  t,
}: UseOwningDepartmentFormValidationProps) {
  const validate = useCallback(
    (data: OwningDepartmentFormModel): Partial<Record<keyof OwningDepartmentFormModel, string>> => {
      const schema = {
        owningDepartmentName: (value: unknown) => {
          const strVal = String(value ?? "").trim();
          if (!strVal) {
            return t("form.validation.nameRequired");
          }
          if (strVal.length > 100) {
            return t("form.validation.nameMaxLength", { count: 100 });
          }
          if (isAllZeros(strVal) || !ALPHANUMERIC_WITH_SPACES_REGEX.test(strVal)) {
            return t("form.validation.nameFormat");
          }
          return undefined;
        },
        description: (value: unknown) => {
          const strVal = String(value ?? "").trim();
          if (!strVal) {
            return t("form.validation.descriptionRequired");
          }
          if (strVal.length > 100) {
            return t("form.validation.descriptionMaxLength", { count: 100 });
          }
          if (isAllZeros(strVal) || !DESCRIPTION_REGEX.test(strVal)) {
            return t("form.validation.descriptionFormat");
          }
          return undefined;
        },
      };

      return validateForm(data, schema);
    },
    [t]
  );

  const showError = useCallback(
    (fieldName: keyof OwningDepartmentFormModel) => {
      return submittedOnce || touched[fieldName] ? !!errors[fieldName] : false;
    },
    [submittedOnce, touched, errors]
  );

  return {
    validate,
    showError,
  };
}
