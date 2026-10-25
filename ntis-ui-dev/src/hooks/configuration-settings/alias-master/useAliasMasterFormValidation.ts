"use client";

import { useCallback } from "react";
import type { AliasMasterFormModel } from "@/types/alias-master.types";
import { validateForm } from "@/lib/utils/validation";
import { isAllZeros, ASSET_MASTER_NAME_REGEX } from "@/lib/utils/asset-validation-rules";

interface UseAliasMasterFormValidationProps {
  submittedOnce: boolean;
  touched: Record<string, boolean>;
  errors: Partial<Record<keyof AliasMasterFormModel, string>>;
  isEdit: boolean;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export function useAliasMasterFormValidation({
  submittedOnce,
  touched,
  errors,
  isEdit,
  t,
}: UseAliasMasterFormValidationProps) {
  const validate = useCallback(
    (data: AliasMasterFormModel): Partial<Record<keyof AliasMasterFormModel, string>> => {
      const schema = {
        keyName: (value: unknown) => {
          if (isEdit) return undefined;
          const strVal = String(value ?? "").trim();
          if (!strVal) return t("form.validation.keyNameRequired");
          if (strVal.length > 50) return t("form.validation.keyNameMaxLength", { count: 50 });
          if (isAllZeros(strVal) || !ASSET_MASTER_NAME_REGEX.test(strVal)) return t("form.validation.keyNameFormat");
          return undefined;
        },
        labelName: (value: unknown) => {
          const strVal = String(value ?? "").trim();
          if (!strVal) return t("form.validation.labelNameRequired");
          if (strVal.length > 100) return t("form.validation.labelNameMaxLength", { count: 100 });
          if (isAllZeros(strVal) || !ASSET_MASTER_NAME_REGEX.test(strVal)) return t("form.validation.labelNameFormat");
          return undefined;
        },
        englishName: (value: unknown) => {
          const strVal = String(value ?? "").trim();
          if (strVal && strVal.length > 100) return t("form.validation.englishNameMaxLength", { count: 100 });
          return undefined;
        },
        regionalName: (value: unknown) => {
          const strVal = String(value ?? "").trim();
          if (strVal && strVal.length > 100) return t("form.validation.regionalNameMaxLength", { count: 100 });
          return undefined;
        },
        hindiName: (value: unknown) => {
          const strVal = String(value ?? "").trim();
          if (strVal && strVal.length > 100) return t("form.validation.hindiNameMaxLength", { count: 100 });
          return undefined;
        },
      };

      return validateForm(data, schema) as Partial<Record<keyof AliasMasterFormModel, string>>;
    },
    [t, isEdit]
  );

  const showError = useCallback(
    (field: keyof AliasMasterFormModel): boolean => {
      return (submittedOnce || touched[field]) && !!errors[field];
    },
    [submittedOnce, touched, errors]
  );

  return {
    validate,
    showError,
  };
}
