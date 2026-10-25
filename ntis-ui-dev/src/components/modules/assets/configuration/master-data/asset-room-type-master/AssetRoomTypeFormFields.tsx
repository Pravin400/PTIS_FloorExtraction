import React from "react";
import { Input, ValidationMessage, SearchSelect } from "@/components/common";
import { AssetRoomTypeFormModel } from "@/types/asset-masters/asset-room-type.types";

interface AssetRoomTypeFormFieldsProps {
  roomTypeCodeRef: React.RefObject<HTMLInputElement | null>;
  formData: AssetRoomTypeFormModel;
  errors: Partial<Record<keyof AssetRoomTypeFormModel, string>>;
  showError: (field: keyof AssetRoomTypeFormModel) => boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  categoryOptions: { label: string; value: string }[];
  typeOptions: { label: string; value: string }[];
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export function AssetRoomTypeFormFields({
  roomTypeCodeRef,
  formData,
  errors,
  showError,
  handleChange,
  handleBlur,
  handleSelectChange,
  categoryOptions,
  typeOptions,
  t,
}: AssetRoomTypeFormFieldsProps) {
  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
      <Input
        ref={roomTypeCodeRef}
        name="roomTypeCode"
        label={t("form.fields.roomTypeCode.label")}
        required
        placeholder={t("form.fields.roomTypeCode.placeholder")}
        value={formData.roomTypeCode}
        onChange={handleChange}
        onBlur={handleBlur}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.roomTypeCode}
        visible={showError("roomTypeCode")}
      />

      <Input
        name="roomTypeName"
        label={t("form.fields.roomTypeName.label")}
        required
        placeholder={t("form.fields.roomTypeName.placeholder")}
        value={formData.roomTypeName}
        onChange={handleChange}
        onBlur={handleBlur}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.roomTypeName}
        visible={showError("roomTypeName")}
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
    </div>
  );
}
