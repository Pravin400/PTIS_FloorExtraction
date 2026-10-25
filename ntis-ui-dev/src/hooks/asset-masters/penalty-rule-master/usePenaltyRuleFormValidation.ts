"use client";

import { useCallback } from "react";
import type { PenaltyRuleFormModel } from "@/types/asset-masters/penalty-rule-master.types";
import { validateForm } from "@/lib/utils/validation";
import { isAllZeros, CODE_REGEX, ASSET_MASTER_NAME_REGEX } from "@/lib/utils/asset-validation-rules";

interface UsePenaltyRuleFormValidationProps {
  submittedOnce: boolean;
  touched: Record<string, boolean>;
  errors: Partial<Record<keyof PenaltyRuleFormModel, string>>;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export function usePenaltyRuleFormValidation({
  submittedOnce,
  touched,
  errors,
  t,
}: UsePenaltyRuleFormValidationProps) {
  const validate = useCallback(
    (data: PenaltyRuleFormModel): Partial<Record<keyof PenaltyRuleFormModel, string>> => {
      const schema = {
        penaltyCode: (value: unknown) => {
          const strVal = String(value ?? '').trim();
          if (!strVal) return t("form.validation.codeRequired");
          if (strVal.length > 20) return t("form.validation.codeMaxLength", { count: 20 });
          if (isAllZeros(strVal)) return t('form.validation.invalidFormat', { default: 'Invalid format' });
          if (!CODE_REGEX.test(strVal)) return t("form.validation.codeFormat");
          return undefined;
        },
        penaltyName: (value: unknown) => {
          const strVal = String(value ?? "").trim();
          if (!strVal) {
            return t("form.validation.nameRequired");
          }
          if (strVal.length > 100) {
            return t("form.validation.nameMaxLength", { count: 100 });
          }
          if (isAllZeros(strVal) || !ASSET_MASTER_NAME_REGEX.test(strVal)) {
            return t("form.validation.nameFormat");
          }
          return undefined;
        },
        calculationType: (value: unknown) => {
          const strVal = String(value ?? "").trim();
          if (!strVal) {
            return t("form.validation.calculationTypeRequired");
          }
          return undefined;
        },
        penaltyValue: (value: unknown) => {
          if (value === "" || value === null || value === undefined) {
            return t("form.validation.valueRequired");
          }
          const num = Number(value);
          if (!Number.isFinite(num) || num < 0) {
            return t("form.validation.valueInvalid");
          }
          if (data.calculationType === "Percentage" && num > 999) {
            return t("form.validation.valuePercentageInvalid");
          }
          if (data.calculationType !== "Percentage" && num > 9999999999999.99) {
            return t("form.validation.valueAmountInvalid");
          }
          return undefined;
        },
        gracePeriodDays: (value: unknown) => {
          if (value === "" || value === null || value === undefined) {
            return t("form.validation.gracePeriodRequired");
          }
          const num = Number(value);
          if (!Number.isFinite(num) || num < 0 || !Number.isInteger(num)) {
            return t("form.validation.gracePeriodInvalid");
          }
          if (num > 100) {
            return t("form.validation.gracePeriodLimitInvalid");
          }
          return undefined;
        },
      };

      return validateForm(data, schema) as Partial<Record<keyof PenaltyRuleFormModel, string>>;
    },
    [t]
  );

  const showError = useCallback(
    (field: keyof PenaltyRuleFormModel): boolean => {
      return (submittedOnce || touched[field]) && !!errors[field];
    },
    [submittedOnce, touched, errors]
  );

  return {
    validate,
    showError,
  };
}
