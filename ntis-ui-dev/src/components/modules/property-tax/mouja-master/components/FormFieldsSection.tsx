"use client";

import { Input, ValidationMessage } from "@/components/common";
import { MoujaFormModel } from "@/types/mouja.types";
import type React from "react";

interface FormFieldsSectionProps {
  formData: MoujaFormModel;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  errors: Partial<Record<keyof MoujaFormModel, string>>;
  showError: (field: keyof MoujaFormModel) => boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
  moujaLabel?: string;
}

export const FormFieldsSection = ({
  formData,
  handleChange,
  handleBlur,
  errors,
  showError,
  t,
  moujaLabel,
}: FormFieldsSectionProps) => {
  const values = moujaLabel ? { mouja: moujaLabel, entity: moujaLabel } : undefined;

  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
      <Input
        name="moujaNo"
        label={t("form.fields.moujaNo.label", values)}
        required
        placeholder={t("form.fields.moujaNo.placeholder", values)}
        value={formData.moujaNo}
        onChange={handleChange}
        onBlur={handleBlur}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.moujaNo}
        visible={showError("moujaNo")}
      />

      <Input
        name="moujaName"
        label={t("form.fields.moujaName.label", values)}
        required={true}
        placeholder={t("form.fields.moujaName.placeholder", values)}
        value={formData.moujaName}
        onChange={handleChange}
        onBlur={handleBlur}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.moujaName}
        visible={showError("moujaName")}
      />
    </div>
  );
};
