"use client";

import { useCallback } from "react";
import type { GstMasterFormModel } from "@/types/asset-masters/gst-master.types";
import { validateForm } from "@/lib/utils/validation";
import { isAllZeros, CODE_REGEX, ASSET_MASTER_NAME_REGEX } from "@/lib/utils/asset-validation-rules";

interface UseGstMasterFormValidationProps {
  submittedOnce: boolean;
  touched: Record<string, boolean>;
  errors: Partial<Record<keyof GstMasterFormModel, string>>;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export function useGstMasterFormValidation({
  submittedOnce,
  touched,
  errors,
  t,
}: UseGstMasterFormValidationProps) {
  const validate = useCallback(
    (data: GstMasterFormModel): Partial<Record<keyof GstMasterFormModel, string>> => {
      const schema = {
        taxCode: (value: unknown) => {
          const strVal = String(value ?? '').trim();
          if (!strVal) return t("form.validation.codeRequired");
          if (strVal.length > 20) return t("form.validation.codeMaxLength", { count: 20 });
          if (isAllZeros(strVal)) return t('form.validation.invalidFormat', { default: 'Invalid format' });
          if (!CODE_REGEX.test(strVal)) return t("form.validation.codeFormat");
          return undefined;
        },
        taxName: (value: unknown) => {
          const strVal = String(value ?? "").trim();
          if (!strVal) {
            return t("form.validation.descriptionRequired");
          }
          if (strVal.length > 100) {
            return t("form.validation.descriptionMaxLength", { count: 100 });
          }
          if (isAllZeros(strVal) || !ASSET_MASTER_NAME_REGEX.test(strVal)) {
            return t("form.validation.descriptionFormat");
          }
          return undefined;
        },
        taxPercentage: (value: unknown) => {
          if (value === "" || value === null || value === undefined) {
            return t("form.validation.percentRequired");
          }
          const num = Number(value);
          if (!Number.isFinite(num) || num < 0 || num > 100) {
            return t("form.validation.percentInvalid");
          }
          return undefined;
        },
        effectiveFromDate: (value: unknown) => {
          const strVal = String(value ?? "").trim();
          if (!strVal) {
            return t("form.validation.effectiveFromRequired");
          }
          const year = new Date(strVal).getFullYear();
          if (isNaN(year) || year < 1700 || year > 2100) {
            return t("form.validation.dateYearRange", { default: "Year must be between 1700 and 2100" });
          }
          return undefined;
        },
        effectiveToDate: (value: unknown) => {
          const strVal = String(value ?? "").trim();
          if (!strVal) {
            return t("form.validation.effectiveToRequired");
          }
          const year = new Date(strVal).getFullYear();
          if (isNaN(year) || year < 1700 || year > 2100) {
            return t("form.validation.dateYearRange", { default: "Year must be between 1700 and 2100" });
          }
          if (data.effectiveFromDate?.trim()) {
            const from = new Date(data.effectiveFromDate);
            const to = new Date(strVal);
            if (to < from) {
              return t("form.validation.effectiveToInvalid");
            }
          }
          return undefined;
        },
      };

      return validateForm(data, schema) as Partial<Record<keyof GstMasterFormModel, string>>;
    },
    [t]
  );

  const showError = useCallback(
    (field: keyof GstMasterFormModel): boolean => {
      return (submittedOnce || touched[field]) && !!errors[field];
    },
    [submittedOnce, touched, errors]
  );

  return {
    validate,
    showError,
  };
}
