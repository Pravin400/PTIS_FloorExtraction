import React from "react";
import { Input, TextArea, ValidationMessage } from "@/components/common";
import { AssetGrievanceCategoryFormModel } from "@/types/asset-masters/asset-grievance-category.types";

interface AssetGrievanceCategoryFormFieldsProps {
  firstInputRef: React.RefObject<HTMLInputElement | null>;
  formData: AssetGrievanceCategoryFormModel;
  slaValue: string;
  displaySequenceValue: string;
  errors: Partial<Record<keyof AssetGrievanceCategoryFormModel, string>>;
  showError: (field: keyof AssetGrievanceCategoryFormModel) => boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

  t: (key: string, values?: Record<string, string | number | Date>) => string;
  tCommon?: (key: string) => string;
}

export function AssetGrievanceCategoryFormFields({
  firstInputRef,
  formData,
  slaValue,
  displaySequenceValue,
  errors,
  showError,
  handleChange,
  handleBlur,

  t,
}: AssetGrievanceCategoryFormFieldsProps) {
  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
      <Input
        ref={firstInputRef}
        name="grievanceTypeCode"
        label={t("form.fields.typeCode")}
        required
        placeholder={t("form.fields.typeCodePlaceholder")}
        value={formData.grievanceTypeCode}
        onChange={handleChange}
        onBlur={handleBlur}
        maxLength={20}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.grievanceTypeCode}
        visible={showError("grievanceTypeCode")}
      />

      <Input
        name="grievanceTypeName"
        label={t("form.fields.name")}
        required
        placeholder={t("form.fields.namePlaceholder")}
        value={formData.grievanceTypeName}
        onChange={handleChange}
        onBlur={handleBlur}
        maxLength={50}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.grievanceTypeName}
        visible={showError("grievanceTypeName")}
      />

      <Input
        name="grievanceTypeNameLocal"
        label={t("form.fields.nameLocal")}
        placeholder={t("form.fields.nameLocalPlaceholder")}
        value={formData.grievanceTypeNameLocal ?? ""}
        onChange={handleChange}
        onBlur={handleBlur}
        maxLength={50}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.grievanceTypeNameLocal}
        visible={showError("grievanceTypeNameLocal")}
      />

      <Input
        name="codeFormat"
        label={t("form.fields.codeFormat")}
        required
        placeholder={t("form.fields.codeFormatPlaceholder", {
          YYYY: "{YYYY}",
          MM: "{MM}",
          DD: "{DD}",
          SEQ: "{SEQ}",
        })}
        value={formData.codeFormat}
        onChange={handleChange}
        onBlur={handleBlur}
        maxLength={50}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.codeFormat}
        visible={showError("codeFormat")}
      />

      <Input
        name="slaDays"
        label={t("form.fields.sla")}
        type="number"
        required
        min={0}
        max={365}
        placeholder={t("form.fields.slaPlaceholder")}
        value={slaValue}
        onChange={handleChange}
        onBlur={handleBlur}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.slaDays}
        visible={showError("slaDays")}
      />

      <Input
        name="displaySequence"
        label={t("form.fields.displaySequence")}
        type="number"
        required
        min={0}
        placeholder={t("form.fields.displaySequencePlaceholder")}
        value={displaySequenceValue}
        onChange={handleChange}
        onBlur={handleBlur}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.displaySequence}
        visible={showError("displaySequence")}
      />

      <Input
        name="targetTableName"
        label={t("form.fields.targetTableName")}
        required
        placeholder={t("form.fields.targetTableNamePlaceholder")}
        value={formData.targetTableName ?? ""}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (/[0-9]/.test(e.key)) {
            e.preventDefault();
          }
        }}
        maxLength={100}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.targetTableName}
        visible={showError("targetTableName")}
      />



      <TextArea
        name="description"
        label={t("form.fields.description")}
        placeholder={t("form.fields.descPlaceholder")}
        value={formData.description ?? ""}
        onChange={handleChange}
        onBlur={handleBlur}
        maxLength={200}
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.description}
        visible={showError("description")}
      />
    </div>
  );
}
