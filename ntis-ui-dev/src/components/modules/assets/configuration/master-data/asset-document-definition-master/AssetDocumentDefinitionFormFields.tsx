"use client";

import React from "react";
import { Input, TextArea, ValidationMessage, SearchSelect, ToggleSwitch } from "@/components/common";
import { AssetDocumentDefinitionFormModel } from "@/types/asset-masters/asset-document-definition.types";

interface AssetDocumentDefinitionFormFieldsProps {
  documentCodeRef: React.RefObject<HTMLInputElement | null>;
  formData: AssetDocumentDefinitionFormModel;
  displayOrderValue: string;
  errors: Partial<Record<keyof AssetDocumentDefinitionFormModel, string>>;
  showError: (field: keyof AssetDocumentDefinitionFormModel) => boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleToggleRequired: (checked: boolean) => void;
  categoryOptions: { label: string; value: string }[];
  typeOptions: { label: string; value: string }[];
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}

export function AssetDocumentDefinitionFormFields({
  documentCodeRef,
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
  t,
}: AssetDocumentDefinitionFormFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Card 1: Document Identity */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="text-slate-800 font-semibold text-base pb-3 border-b border-slate-200">
          {t("form.sections.documentIdentity")}
        </div>

        {/* Document Code */}
        <div>
          <Input
            ref={documentCodeRef}
            name="documentCode"
            label={t("form.fields.documentCode.label")}
            required
            maxLength={50}
            placeholder={t("form.fields.documentCode.placeholder")}
            value={formData.documentCode}
            onChange={handleChange}
            onBlur={handleBlur}
            fullWidth
            className="text-gray-700 placeholder:text-gray-400"
          />
          <ValidationMessage message={errors.documentCode} visible={showError("documentCode")} />
        </div>

        {/* Document Name */}
        <div>
          <Input
            name="documentName"
            label={t("form.fields.documentName.label")}
            required
            maxLength={100}
            placeholder={t("form.fields.documentName.placeholder")}
            value={formData.documentName}
            onChange={handleChange}
            onBlur={handleBlur}
            fullWidth
            className="text-gray-700 placeholder:text-gray-400"
          />
          <ValidationMessage message={errors.documentName} visible={showError("documentName")} />
        </div>

        {/* Description */}
        <div>
          <TextArea
            name="description"
            label={t("form.fields.description.label")}
            required
            maxLength={200}
            showCharCount
            rows={3}
            placeholder={t("form.fields.description.placeholder")}
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          <ValidationMessage message={errors.description} visible={showError("description")} />
        </div>

        {/* Display Order */}
        <div>
          <Input
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

        {/* Is Required Box */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 mt-2">
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


