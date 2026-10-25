import React from "react";
import { Input, ValidationMessage } from "@/components/common";
import { MoujaFormModel } from "@/types/asset-masters/mouja-subzone.types";

interface MoujaFormFieldsProps {
  codeRef: React.RefObject<HTMLInputElement | null>;
  formData: MoujaFormModel;
  errors: Partial<Record<keyof MoujaFormModel, string>>;
  showError: (field: keyof MoujaFormModel) => boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function MoujaFormFields({
  codeRef,
  formData,
  errors,
  showError,
  handleChange,
  handleBlur,
  t,
}: MoujaFormFieldsProps) {
  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
      <Input
        ref={codeRef}
        name="moujaNo"
        label={t("form.fields.moujaNo.label")}
        required
        placeholder={t("form.fields.moujaNo.placeholder")}
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
        label={t("form.fields.moujaName.label")}
        required
        placeholder={t("form.fields.moujaName.placeholder")}
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
}
