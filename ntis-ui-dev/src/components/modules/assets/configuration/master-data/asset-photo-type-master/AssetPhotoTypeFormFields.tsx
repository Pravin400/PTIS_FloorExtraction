import React from "react";
import { Input, ValidationMessage, SearchSelect, ToggleSwitch } from "@/components/common";
import { AssetPhotoTypeFormModel } from "@/types/asset-masters/asset-photo-type.types";

interface AssetPhotoTypeFormFieldsProps {
  photoTypeCodeRef: React.RefObject<HTMLInputElement | null>;
  formData: AssetPhotoTypeFormModel;
  displayOrderValue: string;
  errors: Partial<Record<keyof AssetPhotoTypeFormModel, string>>;
  showError: (field: keyof AssetPhotoTypeFormModel) => boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleToggleRequired: (checked: boolean) => void;
  handleToggleSubUnit: (checked: boolean) => void;
  categoryOptions: { label: string; value: string }[];
  typeOptions: { label: string; value: string }[];
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export function AssetPhotoTypeFormFields({
  photoTypeCodeRef,
  formData,
  displayOrderValue,
  errors,
  showError,
  handleChange,
  handleBlur,
  handleSelectChange,
  handleToggleRequired,
  handleToggleSubUnit,
  categoryOptions,
  typeOptions,
  t,
}: AssetPhotoTypeFormFieldsProps) {
  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
      <Input
        ref={photoTypeCodeRef}
        name="photoTypeCode"
        label={t("form.fields.photoTypeCode.label")}
        required
        placeholder={t("form.fields.photoTypeCode.placeholder")}
        value={formData.photoTypeCode}
        onChange={handleChange}
        onBlur={handleBlur}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.photoTypeCode}
        visible={showError("photoTypeCode")}
      />

      <Input
        name="photoTypeName"
        label={t("form.fields.photoTypeName.label")}
        required
        placeholder={t("form.fields.photoTypeName.placeholder")}
        value={formData.photoTypeName}
        onChange={handleChange}
        onBlur={handleBlur}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.photoTypeName}
        visible={showError("photoTypeName")}
      />

      <Input
        name="description"
        label={t("form.fields.description.label")}
        placeholder={t("form.fields.description.placeholder")}
        value={formData.description}
        onChange={handleChange}
        onBlur={handleBlur}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.description}
        visible={showError("description")}
      />

      <Input
        name="displayOrder"
        label={t("form.fields.displayOrder.label")}
        type="number"
        required
        min={1}
        max={99999}
        value={displayOrderValue}
        onChange={handleChange}
        onBlur={handleBlur}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.displayOrder}
        visible={showError("displayOrder")}
      />

      <SearchSelect
        name="assetCategoryId"
        label={t("form.fields.assetCategoryId.label")}
        required
        placeholder={t("form.fields.assetCategoryId.placeholder")}
        options={categoryOptions}
        value={formData.assetCategoryId ? String(formData.assetCategoryId) : ""}
        onChange={handleSelectChange}
        error={showError("assetCategoryId") ? errors.assetCategoryId : undefined}
      />

      <SearchSelect
        name="assetTypeId"
        label={t("form.fields.assetTypeId.label")}
        required
        placeholder={t("form.fields.assetTypeId.placeholder")}
        options={typeOptions}
        value={formData.assetTypeId ? String(formData.assetTypeId) : ""}
        onChange={handleSelectChange}
        disabled={!formData.assetCategoryId || typeOptions.length === 0}
        error={showError("assetTypeId") ? errors.assetTypeId : undefined}
      />

      <div className="flex items-center justify-between p-3 border border-[#DCEAFF] bg-white rounded-xl">
        <div>
          <div className="font-medium text-slate-800 text-sm">{t("form.fields.isRequired.label")}</div>
          <div className="text-xs text-slate-500">{t("form.fields.isRequired.description")}</div>
        </div>
        <ToggleSwitch
          checked={formData.isRequired}
          onChange={handleToggleRequired}
          showPopup={false}
          activeLabel={`${t("form.fields.isRequired.label")}: ${t("yes")}`}
          inactiveLabel={`${t("form.fields.isRequired.label")}: ${t("no")}`}
        />
      </div>

      <div className="flex items-center justify-between p-3 border border-[#DCEAFF] bg-white rounded-xl">
        <div>
          <div className="font-medium text-slate-800 text-sm">{t("form.fields.isSubUnit.label")}</div>
          <div className="text-xs text-slate-500">{t("form.fields.isSubUnit.description")}</div>
        </div>
        <ToggleSwitch
          checked={formData.isSubUnit}
          onChange={handleToggleSubUnit}
          showPopup={false}
          activeLabel={`${t("form.fields.isSubUnit.label")}: ${t("yes")}`}
          inactiveLabel={`${t("form.fields.isSubUnit.label")}: ${t("no")}`}
        />
      </div>
    </div>
  );
}


