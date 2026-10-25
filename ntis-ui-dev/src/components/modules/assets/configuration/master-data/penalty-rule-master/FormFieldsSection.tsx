"use client";

import React from "react";
import { Input, ValidationMessage, Select } from "@/components/common";
import type { PenaltyRuleFormModel } from "@/types/asset-masters/penalty-rule-master.types";

interface FormFieldsSectionProps {
  formData: PenaltyRuleFormModel;
  errors: Partial<Record<keyof PenaltyRuleFormModel, string>>;
  showError: (field: keyof PenaltyRuleFormModel) => boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<PenaltyRuleFormModel>>;
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof PenaltyRuleFormModel, string>>>>;
  t: (key: string) => string;
}

export interface FormFieldsSectionRef {
  penaltyCodeRef: React.RefObject<HTMLInputElement | null>;
}

export const FormFieldsSection = React.forwardRef<FormFieldsSectionRef, FormFieldsSectionProps>(
  ({
    formData,
    errors,
    showError,
    onChange,
    onBlur,
    setFormData,
    setErrors,
    t,
  }, ref) => {
    const penaltyCodeRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => ({
      penaltyCodeRef,
    }));

    return (
      <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
        <Input
          ref={penaltyCodeRef}
          name="penaltyCode"
          label={t("form.fields.code.label")}
          required
          value={formData.penaltyCode}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={t("form.fields.code.placeholder")}
          fullWidth
        />
        <ValidationMessage message={errors.penaltyCode} visible={showError("penaltyCode")} />

        <Input
          name="penaltyName"
          label={t("form.fields.description.label")}
          required
          value={formData.penaltyName}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={t("form.fields.description.placeholder")}
          fullWidth
        />
        <ValidationMessage message={errors.penaltyName} visible={showError("penaltyName")} />

        <Select
          name="calculationType"
          label={t("form.fields.calculationType.label")}
          required
          value={formData.calculationType}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            setFormData((prev) => ({ ...prev, calculationType: e.target.value }));
            setErrors((prev) => ({ ...prev, calculationType: "" }));
          }}
          onBlur={onBlur}
          placeholder={t("form.fields.calculationType.placeholder")}
          options={[
            { label: t("form.fields.calculationType.options.percentage"), value: "Percentage" },
            { label: t("form.fields.calculationType.options.flatAmount"), value: "FlatAmount" },
            { label: t("form.fields.calculationType.options.perDay"), value: "PerDay" },
          ]}
        />
        <ValidationMessage message={errors.calculationType} visible={showError("calculationType")} />

        <Input
          name="penaltyValue"
          type="number"
          min={0}
          step="any"
          label={t("form.fields.value.label")}
          required
          value={String(formData.penaltyValue)}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === "-" || e.key === "+" || e.key === "e" || e.key === "E") {
              e.preventDefault();
            }
          }}
          placeholder={t("form.fields.value.placeholder")}
          fullWidth
        />
        <ValidationMessage message={errors.penaltyValue} visible={showError("penaltyValue")} />

        <Input
          name="gracePeriodDays"
          type="number"
          min={0}
          max={100}
          label={t("form.fields.gracePeriod.label")}
          required
          value={String(formData.gracePeriodDays)}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === "-" || e.key === "+" || e.key === "e" || e.key === "E") {
              e.preventDefault();
            }
          }}
          placeholder={t("form.fields.gracePeriod.placeholder")}
          fullWidth
        />
        <ValidationMessage message={errors.gracePeriodDays} visible={showError("gracePeriodDays")} />
      </div>
    );
  }
);

FormFieldsSection.displayName = "FormFieldsSection";
