"use client";

import React from "react";
import { Input, ValidationMessage } from "@/components/common";
import type { GstMasterFormModel } from "@/types/asset-masters/gst-master.types";

interface FormFieldsSectionProps {
  formData: GstMasterFormModel;
  errors: Partial<Record<keyof GstMasterFormModel, string>>;
  showError: (field: keyof GstMasterFormModel) => boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  t: (key: string) => string;
}

export interface FormFieldsSectionRef {
  taxCodeRef: React.RefObject<HTMLInputElement | null>;
}

export const FormFieldsSection = React.forwardRef<FormFieldsSectionRef, FormFieldsSectionProps>(
  ({
    formData,
    errors,
    showError,
    onChange,
    onBlur,
    t,
  }, ref) => {
    const taxCodeRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => ({
      taxCodeRef,
    }));

    return (
      <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
        <Input
          ref={taxCodeRef}
          name="taxCode"
          label={t("form.fields.code.label")}
          required
          value={formData.taxCode}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={t("form.fields.code.placeholder")}
          fullWidth
        />
        <ValidationMessage message={errors.taxCode} visible={showError("taxCode")} />

        <Input
          name="taxName"
          label={t("form.fields.description.label")}
          required
          value={formData.taxName}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={t("form.fields.description.placeholder")}
          fullWidth
        />
        <ValidationMessage message={errors.taxName} visible={showError("taxName")} />

        <Input
          name="taxPercentage"
          type="number"
          min={0}
          max={100}
          step="any"
          label={t("form.fields.percent.label")}
          required
          value={String(formData.taxPercentage)}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === "-" || e.key === "+" || e.key === "e" || e.key === "E") {
              e.preventDefault();
            }
          }}
          placeholder={t("form.fields.percent.placeholder")}
          fullWidth
        />
        <ValidationMessage message={errors.taxPercentage} visible={showError("taxPercentage")} />

        <Input
          name="effectiveFromDate"
          type="date"
          label={t("form.fields.effectiveFrom.label")}
          required
          value={formData.effectiveFromDate || ""}
          min="1700-01-01"
          max="2100-12-31"
          onChange={onChange}
          onBlur={onBlur}
          fullWidth
        />
        <ValidationMessage message={errors.effectiveFromDate} visible={showError("effectiveFromDate")} />

        <Input
          name="effectiveToDate"
          type="date"
          label={t("form.fields.effectiveTo.label")}
          required
          value={formData.effectiveToDate || ""}
          min={formData.effectiveFromDate || "1700-01-01"}
          max="2100-12-31"
          onChange={onChange}
          onBlur={onBlur}
          fullWidth
        />
        <ValidationMessage message={errors.effectiveToDate} visible={showError("effectiveToDate")} />
      </div>
    );
  }
);

FormFieldsSection.displayName = "FormFieldsSection";
