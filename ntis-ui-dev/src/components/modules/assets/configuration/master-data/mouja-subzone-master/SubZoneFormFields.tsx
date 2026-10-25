import React from "react";
import { Input, ValidationMessage, SearchSelect } from "@/components/common";
import { SubZoneFormModel } from "@/types/asset-masters/mouja-subzone.types";

interface SubZoneFormFieldsProps {
  codeRef: React.RefObject<HTMLInputElement | null>;
  formData: SubZoneFormModel;
  errors: Partial<Record<keyof SubZoneFormModel, string>>;
  showError: (field: keyof SubZoneFormModel) => boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  moujaOptions: { label: string; value: string }[];
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function SubZoneFormFields({
  codeRef,
  formData,
  errors,
  showError,
  handleChange,
  handleBlur,
  handleSelectChange,
  moujaOptions,
  t,
}: SubZoneFormFieldsProps) {
  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
      <SearchSelect
        name="moujaId"
        label={t("form.fields.moujaId.label")}
        required
        placeholder={t("form.fields.moujaId.placeholder")}
        options={moujaOptions}
        value={formData.moujaId ? String(formData.moujaId) : ""}
        onChange={handleSelectChange}
        error={showError("moujaId") ? errors.moujaId : undefined}
      />

      <Input
        ref={codeRef}
        name="subZoneNo"
        label={t("form.fields.subZoneNo.label")}
        required
        placeholder={t("form.fields.subZoneNo.placeholder")}
        value={formData.subZoneNo}
        onChange={handleChange}
        onBlur={handleBlur}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.subZoneNo}
        visible={showError("subZoneNo")}
      />

      <Input
        name="subZoneName"
        label={t("form.fields.subZoneName.label")}
        required
        placeholder={t("form.fields.subZoneName.placeholder")}
        value={formData.subZoneName}
        onChange={handleChange}
        onBlur={handleBlur}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.subZoneName}
        visible={showError("subZoneName")}
      />
    </div>
  );
}
