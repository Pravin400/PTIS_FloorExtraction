import React from "react";
import { Input, ValidationMessage, SearchSelect } from "@/components/common";
import { DesignationFormModel } from "@/types/asset-masters/designation.types";

interface DesignationFormFieldsProps {
  designationCodeRef: React.RefObject<HTMLInputElement | null>;
  formData: DesignationFormModel;
  errors: Partial<Record<keyof DesignationFormModel, string>>;
  showError: (field: keyof DesignationFormModel) => boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  departmentOptions: { label: string; value: string }[];
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export function DesignationFormFields({
  designationCodeRef,
  formData,
  errors,
  showError,
  handleChange,
  handleBlur,
  handleSelectChange,
  departmentOptions,
  t,
}: DesignationFormFieldsProps) {
  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
      <Input
        ref={designationCodeRef}
        name="designationCode"
        label={t("form.fields.designationCode.label")}
        required
        placeholder={t("form.fields.designationCode.placeholder")}
        value={formData.designationCode}
        onChange={handleChange}
        onBlur={handleBlur}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.designationCode}
        visible={showError("designationCode")}
      />

      <Input
        name="designationName"
        label={t("form.fields.designationName.label")}
        required
        placeholder={t("form.fields.designationName.placeholder")}
        value={formData.designationName}
        onChange={handleChange}
        onBlur={handleBlur}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.designationName}
        visible={showError("designationName")}
      />

      <Input
        name="designationLocal"
        label={t("form.fields.designationLocal.label")}
        required
        placeholder={t("form.fields.designationLocal.placeholder")}
        value={formData.designationLocal}
        onChange={handleChange}
        onBlur={handleBlur}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.designationLocal}
        visible={showError("designationLocal")}
      />

      <Input
        name="designationDescription"
        label={t("form.fields.designationDescription.label")}
        placeholder={t("form.fields.designationDescription.placeholder")}
        value={formData.designationDescription}
        onChange={handleChange}
        onBlur={handleBlur}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.designationDescription}
        visible={showError("designationDescription")}
      />

      <SearchSelect
        name="owningDepartmentId"
        label={t("form.fields.owningDepartmentId.label")}
        required
        placeholder={t("form.fields.owningDepartmentId.placeholder")}
        options={departmentOptions}
        value={formData.owningDepartmentId ? String(formData.owningDepartmentId) : ""}
        onChange={handleSelectChange}
        error={showError("owningDepartmentId") ? errors.owningDepartmentId : undefined}
      />
    </div>
  );
}
