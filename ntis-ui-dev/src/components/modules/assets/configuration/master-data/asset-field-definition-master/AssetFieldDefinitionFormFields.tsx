"use client";

import React from "react";
import { Input, ValidationMessage, SearchSelect, ToggleSwitch, TextArea } from "@/components/common";
import { AssetFieldDefinitionFormModel } from "@/types/asset-masters/asset-field-definition.types";

interface AssetFieldDefinitionFormFieldsProps {
  fieldCodeRef: React.RefObject<HTMLInputElement | null>;
  formData: AssetFieldDefinitionFormModel;
  displayOrderValue: string;
  errors: Partial<Record<keyof AssetFieldDefinitionFormModel, string>>;
  showError: (field: keyof AssetFieldDefinitionFormModel) => boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleToggleRequired: (checked: boolean) => void;
  categoryOptions: { label: string; value: string }[];
  typeOptions: { label: string; value: string }[];
  groupOptions: { label: string; value: string }[];
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export function AssetFieldDefinitionFormFields({
  fieldCodeRef,
  formData,
  displayOrderValue,
  errors,
  showError,
  handleChange,
  handleBlur,
  handleSelectChange,
  handleToggleRequired,
  categoryOptions,
  typeOptions,
  groupOptions,
  t,
}: AssetFieldDefinitionFormFieldsProps) {
  const fieldTypeOptions = [
    { label: t("form.fields.fieldTypeOptions.text"), value: "text" },
    { label: t("form.fields.fieldTypeOptions.textarea"), value: "textarea" },
    { label: t("form.fields.fieldTypeOptions.number"), value: "number" },
    { label: t("form.fields.fieldTypeOptions.date"), value: "date" },
    { label: t("form.fields.fieldTypeOptions.radio"), value: "radio" },
    { label: t("form.fields.fieldTypeOptions.checkbox"), value: "checkbox" },
    { label: t("form.fields.fieldTypeOptions.select"), value: "select" },
  ];

  return (
    <div className="space-y-4">
      {/* Card 1: General Config */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="text-slate-800 font-semibold text-base pb-3 border-b border-slate-200">
          {t("form.sections.generalConfig")}
        </div>

        {/* Row 1: Field Code */}
        <div>
          <Input
            ref={fieldCodeRef}
            id="fieldCode"
            name="fieldCode"
            label={t("form.fields.fieldCode.label")}
            required
            maxLength={50}
            placeholder={t("form.fields.fieldCode.placeholder")}
            value={formData.fieldCode}
            onChange={handleChange}
            onBlur={handleBlur}
            fullWidth
            className="text-gray-700 placeholder:text-gray-400"
          />
          <ValidationMessage message={errors.fieldCode} visible={showError("fieldCode")} />
        </div>

        {/* Row 2: Field Name */}
        <div>
          <Input
            id="fieldName"
            name="fieldName"
            label={t("form.fields.fieldName.label")}
            required
            maxLength={100}
            placeholder={t("form.fields.fieldName.placeholder")}
            value={formData.fieldName}
            onChange={handleChange}
            onBlur={handleBlur}
            fullWidth
            className="text-gray-700 placeholder:text-gray-400"
          />
          <ValidationMessage message={errors.fieldName} visible={showError("fieldName")} />
        </div>

        {/* Row 2b: Field Label */}
        <div>
          <Input
            id="fieldLabel"
            name="fieldLabel"
            label={t("form.fields.fieldLabel.label")}
            required
            maxLength={100}
            placeholder={t("form.fields.fieldLabel.placeholder")}
            value={formData.fieldLabel}
            onChange={handleChange}
            onBlur={handleBlur}
            fullWidth
            className="text-gray-700 placeholder:text-gray-400"
          />
          <ValidationMessage message={errors.fieldLabel} visible={showError("fieldLabel")} />
        </div>

        {/* Row 3: Field Type */}
        <div>
          <SearchSelect
            id="fieldType"
            name="fieldType"
            label={t("form.fields.fieldType.label")}
            required
            placeholder={t("form.fields.fieldType.placeholder")}
            options={fieldTypeOptions}
            value={formData.fieldType}
            onChange={handleSelectChange}
            error={showError("fieldType") ? errors.fieldType : undefined}
          />
        </div>

        {/* Row 3b: Options (for Checkbox, Radio, Select) */}
        {["checkbox", "radio", "select"].includes(formData.fieldType) && (
          <div>
            <TextArea
              id="optionsJson"
              name="optionsJson"
              label={t("form.fields.fieldOptions.label")}
              required
              rows={3}
              maxLength={500}
              showCharCount
              placeholder={t("form.fields.fieldOptions.placeholder")}
              value={formData.optionsJson ?? ""}
              onChange={handleChange}
              onBlur={handleBlur}
              className="text-gray-700 placeholder:text-gray-400"
            />
            <p className="mt-1 text-xs text-slate-500">
              {t("form.fields.fieldOptions.description")}
            </p>
            <ValidationMessage message={errors.optionsJson} visible={showError("optionsJson")} />
          </div>
        )}

        {/* Row 4: Field Group Name & Group Select */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              id="fieldGroup"
              name="fieldGroup"
              label={t("form.fields.fieldGroup.label")}
              required
              maxLength={100}
              placeholder={t("form.fields.fieldGroup.placeholder")}
              value={formData.fieldGroup}
              onChange={handleChange}
              onBlur={handleBlur}
              fullWidth
              className="text-gray-700 placeholder:text-gray-400"
            />
            <ValidationMessage message={errors.fieldGroup} visible={showError("fieldGroup")} />
          </div>
          <div>
            <SearchSelect
              name="fieldGroupSelect"
              label={t("form.fields.fieldGroupSelectLabel")}
              placeholder={t("form.fields.fieldGroupSelectPlaceholder")}
              options={groupOptions}
              value={formData.fieldGroup}
              onChange={(_name, val) => handleSelectChange("fieldGroup", val)}
            />
          </div>
        </div>

        {/* Row 5: Display Order */}
        <div>
          <Input
            id="displayOrder"
            name="displayOrder"
            label={t("form.fields.displayOrder.label")}
            required
            type="number"
            min={1}
            max={99999}
            value={displayOrderValue}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (["e", "E", "+", "-", "."].includes(e.key)) {
                e.preventDefault();
              }
            }}
            onBlur={handleBlur}
            fullWidth
            className="text-gray-700"
          />
          <ValidationMessage message={errors.displayOrder} visible={showError("displayOrder")} />
        </div>

        {/* Row 6: Is Required Switch Box (Separate Row) */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mt-2">
          <div>
            <div className="font-medium text-slate-800 text-sm">{t("form.fields.isRequired.label")}</div>
            <div className="text-xs text-slate-500">
              {t("form.fields.isRequired.description")}
            </div>
          </div>
          <ToggleSwitch
            checked={formData.isRequired}
            onChange={handleToggleRequired}
            showPopup={false}
          />
        </div>
      </div>

      {/* Card 2: Scope & Category */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="text-slate-800 font-semibold text-base pb-3 border-b border-slate-200">
          {t("form.sections.scopeAndCategory")}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <SearchSelect
              id="assetCategoryId"
              name="assetCategoryId"
              label={t("form.fields.assetCategoryId.label")}
              required
              menuPlacement="top"
              placeholder={t("form.fields.assetCategoryId.placeholder")}
              options={categoryOptions}
              value={formData.assetCategoryId ? String(formData.assetCategoryId) : ""}
              onChange={handleSelectChange}
              onSearchChange={(searchVal) => {
                if (!searchVal) handleSelectChange("assetCategoryId", "");
              }}
              error={showError("assetCategoryId") ? errors.assetCategoryId : undefined}
            />
          </div>
          <div>
            <SearchSelect
              id="assetTypeId"
              name="assetTypeId"
              label={t("form.fields.assetTypeId.label")}
              required
              menuPlacement="top"
              placeholder={t("form.fields.assetTypeId.placeholder")}
              options={typeOptions}
              value={formData.assetTypeId ? String(formData.assetTypeId) : ""}
              onChange={handleSelectChange}
              onSearchChange={(searchVal) => {
                if (!searchVal) handleSelectChange("assetTypeId", "");
              }}
              disabled={!formData.assetCategoryId || typeOptions.length === 0}
              error={showError("assetTypeId") ? errors.assetTypeId : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

