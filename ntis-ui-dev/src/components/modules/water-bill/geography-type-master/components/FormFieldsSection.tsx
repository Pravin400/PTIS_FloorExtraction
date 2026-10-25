"use client";

import { Input, ValidationMessage } from "@/components/common";
import { GeographyTypeFormModel } from "@/types/water-bill/geographyType.types";
import type React from "react";

interface FormFieldsSectionProps {
  formData: GeographyTypeFormModel;
  levelNoValue: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  errors: Partial<Record<keyof GeographyTypeFormModel, string>>;
  showError: (field: keyof GeographyTypeFormModel) => boolean;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  isActive?: boolean;
  isEdit?: boolean;
}

export const FormFieldsSection = ({
  formData,
  levelNoValue,
  handleChange,
  handleBlur,
  errors,
  showError,
  t,
  isActive = true,
}: FormFieldsSectionProps) => {
  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
      <Input
        name="geographyTypeCode"
        label={t("form.fields.code.label")}
        required
        placeholder={t("form.fields.code.placeholder")}
        value={formData.geographyTypeCode}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={!isActive}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage message={errors.geographyTypeCode} visible={showError("geographyTypeCode")} />

      <Input
        name="geographyType"
        label={t("form.fields.geographyType.label")}
        required
        placeholder={t("form.fields.geographyType.placeholder")}
        value={formData.geographyType}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={!isActive}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage message={errors.geographyType} visible={showError("geographyType")} />

      <Input
        name="levelNo"
        label={t("form.fields.levelNo.label")}
        type="number"
        min={1}
        value={levelNoValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled
        fullWidth
        className="text-gray-900"
      />
      <ValidationMessage message={errors.levelNo} visible={showError("levelNo")} />
    </div>
  );
};
