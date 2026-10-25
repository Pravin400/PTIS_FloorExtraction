"use client";

import { Input, ValidationMessage } from "@/components/common";
import { AssessmentYearRangeFormModel } from "@/types/assessment-year-range.types";
import type React from "react";

interface FormFieldsSectionProps {
  fromYearValue: string;
  toYearValue: string;
  handleYearChange: (field: "fromYear" | "toYear", value: string) => void;
  handleBlur: (field: "fromYear" | "toYear") => void;
  errors: Partial<Record<keyof AssessmentYearRangeFormModel, string>>;
  showError: (field: keyof AssessmentYearRangeFormModel) => boolean;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  disabled?: boolean;
  assessmentLabel?: string;
}

export const FormFieldsSection = ({
  fromYearValue,
  toYearValue,
  handleYearChange,
  handleBlur,
  errors,
  showError,
  t,
  disabled = false,
  assessmentLabel,
}: FormFieldsSectionProps) => {
  const values = { assessment: assessmentLabel ?? "", entity: assessmentLabel ?? "" };

  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
      <Input
        name="fromYear"
        label={t("form.fields.fromYear.label", values)}
        required
        placeholder={t("form.fields.fromYear.placeholder", values)}
        value={fromYearValue}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
          handleYearChange("fromYear", e.target.value)
        }
        onBlur={() => handleBlur("fromYear")}
        fullWidth
        className="text-gray-700"
        type="text"
        inputMode="numeric"
        maxLength={4}
        disabled={disabled}
      />
      <ValidationMessage
        message={errors.fromYear}
        visible={showError("fromYear")}
      />

      <Input
        name="toYear"
        label={t("form.fields.toYear.label", values)}
        required
        placeholder={t("form.fields.toYear.placeholder", values)}
        value={toYearValue}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
          handleYearChange("toYear", e.target.value)
        }
        onBlur={() => handleBlur("toYear")}
        fullWidth
        className="text-gray-700"
        type="text"
        inputMode="numeric"
        maxLength={4}
        disabled={disabled}
      />
      <ValidationMessage
        message={errors.toYear}
        visible={showError("toYear")}
      />
    </div>
  );
};
