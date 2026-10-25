import React from "react";
import { Input, TextArea, ValidationMessage, SearchSelect } from "@/components/common";
import { AssetGrievanceRemarkFormModel } from "@/types/asset-masters/asset-grievance-remark.types";

interface AssetGrievanceRemarkFormFieldsProps {
  remarkRef: React.RefObject<HTMLInputElement | null>;
  formData: AssetGrievanceRemarkFormModel;
  errors: Partial<Record<keyof AssetGrievanceRemarkFormModel, string>>;
  showError: (field: keyof AssetGrievanceRemarkFormModel) => boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  categoryOptions: { label: string; value: string }[];
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  isEdit: boolean;
}

export function AssetGrievanceRemarkFormFields({
  remarkRef,
  formData,
  errors,
  showError,
  handleChange,
  handleBlur,
  handleSelectChange,
  categoryOptions,
  t,
  isEdit,
}: AssetGrievanceRemarkFormFieldsProps) {
  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
      <SearchSelect
        name="grievanceCategoryId"
        label={t("form.remarkType")}
        required
        placeholder={t("form.remarkTypePlaceholder")}
        options={categoryOptions}
        value={formData.grievanceCategoryId ? String(formData.grievanceCategoryId) : ""}
        onChange={handleSelectChange}
        error={showError("grievanceCategoryId") ? errors.grievanceCategoryId : undefined}
        autoFocus={!isEdit}
      />

      <Input
        ref={remarkRef}
        name="remark"
        label={t("form.remark")}
        required
        placeholder={t("form.remarkPlaceholder")}
        value={formData.remark}
        onChange={handleChange}
        onBlur={handleBlur}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.remark}
        visible={showError("remark")}
      />

      <TextArea
        name="description"
        label={t("form.description") || "Description"}
        placeholder={t("form.descriptionPlaceholder")} // fallback placeholder
        value={formData.description}
        onChange={handleChange}
        onBlur={handleBlur}
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.description}
        visible={showError("description")}
      />
    </div>
  );
}
