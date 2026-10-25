"use client";

import React from "react";
import { Input, SearchSelect, ValidationMessage } from "@/components/common";
import { cn } from "@/lib/utils/cn";
import { useTranslations } from "next-intl";
import { UpdateButton } from "@/components/common/ActionButtons";
import { EditableInputWithRefresh } from "@/components/modules/property-tax/ptis/appartmentQC/PropertyEditDrawerInputs";
import { usePropertyBasicForm } from "@/hooks/apartmentQc/usePropertyBasicForm";

import type { PropertyData, PropertyTypeOptionSource, OldPropertyFetchResult } from "@/hooks/apartmentQc/usePropertyBasicForm";

// ─── Compact Form Field Component ─────────────────────────────────────────────
interface CompactFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  showError?: boolean;
  onBlur?: () => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  readOnly?: boolean;
  autoFocus?: boolean;
}
// ─── Compact Select Field Component ───────────────────────────────────────────
interface CompactSelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
}

// ─── Read-only Field Component ────────────────────────────────────────────────
interface ReadOnlyFieldProps {
  label: string;
  value: string;
  type?: string;
}

interface PropertyBasicFormProps {
  propertyData?: PropertyData;
  propertyTypes?: PropertyTypeOptionSource[];
  oldPropertyFetchResult?: OldPropertyFetchResult | null;
}

const CompactField = ({
  label,
  value,
  onChange,
  error,
  showError = false,
  onBlur,
  required = false,
  placeholder,
  type = "text",
  maxLength,
  readOnly = false,
  autoFocus = false,
}: CompactFieldProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.slice(0, maxLength);
    }
    onChange(newValue);
  };

  return (
    <div className="flex flex-col">
      <Input
        naked={false}
        label={label}
        required={required}
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={readOnly}
        className={cn(
          readOnly && "bg-gray-100 cursor-not-allowed",
          error && showError && "border-red-500"
        )}
      />
      <ValidationMessage message={error} visible={showError && !!error} type="error" />
    </div>
  );
};
CompactField.displayName = "CompactField";

const CompactSelectField = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select",
  required = false,
}: CompactSelectFieldProps) => (
  <SearchSelect
    label={label}
    required={required}
    value={value}
    onChange={(_, val) => onChange(val)}
    options={options}
    placeholder={placeholder}
  />
);
CompactSelectField.displayName = "CompactSelectField";

const ReadOnlyField = ({ label, value, type = "text" }: ReadOnlyFieldProps) => (
  <Input
    label={label}
    naked={false}
    type={type}
    value={value}
    readOnly
    aria-label={label}
    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed outline-none"
  />
);
ReadOnlyField.displayName = "ReadOnlyField";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Propertybasicform({ propertyData, propertyTypes, oldPropertyFetchResult }: PropertyBasicFormProps) {
  const t = useTranslations("appartmentQC");
  const tQ = useTranslations("quickDataEntry");

  const {
    formData,
    propertyTypeOptions,
    oldPropertyFields,
    errors,
    isPending,
    hasChanges,
    handleFieldChange,
    handlePropertyTypeChange,
    handleOldPropertyRefresh,
    handleUpdate,
    handleKeyDown
  } = usePropertyBasicForm({
    propertyData,
    propertyTypes,
    oldPropertyFetchResult,
    t,
    tQ,
    tHas: t.has
  });

  return (
    <form noValidate onSubmit={handleUpdate} className="flex flex-col gap-4 p-4" onKeyDownCapture={handleKeyDown}>
      <div className="border border-blue-200 rounded-lg overflow-hidden shadow-sm bg-white">
        <div className="bg-blue-600 text-white px-4 py-2 flex items-center gap-2 text-sm font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          {t('basicInfo.title', { fallback: "Basic Information" })}
        </div>

        <div className="p-4 bg-white">
          <div className="grid grid-cols-4 gap-3 mb-3">
            <CompactField
              label={t('basicInfo.fields.ownerName.label', { fallback: "Owner Name *" })}
              value={formData.ownerName}
              onChange={(v) => handleFieldChange("ownerName", v)}
              required
              maxLength={1000}
              placeholder={t('basicInfo.fields.ownerName.placeholder', { fallback: "" })}
              error={errors.ownerName}
              showError={true}
              autoFocus={true}
            />
            <CompactField
              label={t('basicInfo.fields.occupierName.label', { fallback: "Occupier Name *" })}
              value={formData.occupierName}
              onChange={(v) => handleFieldChange("occupierName", v)}
              required
              maxLength={1000}
              placeholder={t('basicInfo.fields.occupierName.placeholder', { fallback: "" })}
              error={errors.occupierName}
              showError={true}
            />
            <CompactField
              label={t('basicInfo.fields.renterName.label', { fallback: "Renter Name" })}
              value={formData.renterName}
              onChange={(v) => handleFieldChange("renterName", v)}
              maxLength={1000}
              placeholder={t('basicInfo.fields.renterName.placeholder', { fallback: "" })}
            />
            <CompactSelectField
              label={t('basicInfo.fields.propertyDescription.label', { fallback: "Property Description" })}
              value={formData.propertyTypeId}
              onChange={handlePropertyTypeChange}
              options={propertyTypeOptions}
              placeholder={t('basicInfo.fields.propertyDescription.placeholder', { fallback: "Select" })}
            />

            <CompactField
              label={t('basicInfo.fields.bhk.label', { fallback: "BHK" })}
              value={formData.bhk}
              onChange={(v) => handleFieldChange("bhk", v)}
              maxLength={2}
              placeholder={t('basicInfo.fields.bhk.placeholder', { fallback: "" })}
            />
            <CompactField
              label={t('basicInfo.fields.mobileNo.label', { fallback: "Mobile" })}
              value={formData.mobileNo}
              onChange={(v) => handleFieldChange("mobileNo", v)}
              maxLength={10}
              placeholder={t('basicInfo.fields.mobileNo.placeholder', { fallback: "" })}
              error={errors.mobileNo}
              showError={true}
            />
            <CompactField
              label={t('basicInfo.fields.emailId.label', { fallback: "Email ID" })}
              value={formData.emailId}
              onChange={(v) => handleFieldChange("emailId", v)}
              type="email"
              maxLength={100}
              placeholder={t('basicInfo.fields.emailId.placeholder', { fallback: "" })}
              error={errors.emailId}
              showError={true}
            />
            <CompactField
              label={t('basicInfo.fields.flatOrShopName.label', { fallback: "Shop Name" })}
              value={formData.flatOrShopName}
              onChange={(v) => handleFieldChange("flatOrShopName", v)}
              placeholder={t('basicInfo.fields.flatOrShopName.placeholder', { fallback: "" })}
            />
            <CompactField
              label={t('basicInfo.fields.wingName.label', { fallback: "Wing" })}
              value={formData.wingName}
              onChange={(v) => handleFieldChange("wingName", v)}
              maxLength={20}
              placeholder={t('basicInfo.fields.wingName.placeholder', { fallback: "" })}
            />
            <CompactField
              label={t('basicInfo.fields.flatOrShopNo.label', { fallback: "Flat/Shop No. *" })}
              value={formData.flatOrShopNo}
              onChange={(v) => handleFieldChange("flatOrShopNo", v)}
              required
              maxLength={50}
              placeholder={t('basicInfo.fields.flatOrShopNo.placeholder', { fallback: "" })}
              error={errors.flatOrShopNo}
              showError={true}
            />
            <EditableInputWithRefresh
              label={t('basicInfo.fields.oldPropertyNo.label', { fallback: "Old Property No." })}
              value={formData.oldPropertyNo}
              onChange={(v) => handleFieldChange("oldPropertyNo", v)}
              onClick={handleOldPropertyRefresh}
              maxLength={50}
              placeholder={t('basicInfo.fields.oldPropertyNo.placeholder', { fallback: "" })}
            />

            <ReadOnlyField label={t('basicInfo.fields.remark.label', { fallback: "Remark" })} value={formData.remark} />
            <ReadOnlyField label={t('basicInfo.fields.oldRV.label', { fallback: "Old RV" })} value={oldPropertyFields.oldRV} type="number" />
            <ReadOnlyField label={t('basicInfo.fields.newRV.label', { fallback: "New RV" })} value={formData.newRV} type="number" />
            <ReadOnlyField label={t('basicInfo.fields.oldTax.label', { fallback: "Old Tax" })} value={oldPropertyFields.oldTax} type="number" />
            <ReadOnlyField label={t('basicInfo.fields.newTax.label', { fallback: "New Tax" })} value={formData.newTax} type="number" />
            <ReadOnlyField label={t('basicInfo.fields.oldArea.label', { fallback: "Old Area (sq.mtr)" })} value={oldPropertyFields.oldArea} type="number" />
            <ReadOnlyField label={t('basicInfo.fields.newArea.label', { fallback: "New Area (sq.mtr)" })} value={formData.newArea} type="number" />
            <ReadOnlyField label={t('basicInfo.fields.oldUseType.label', { fallback: "Old Use Type" })} value={oldPropertyFields.oldUseType} />
            <ReadOnlyField label={t('basicInfo.fields.oldConstructionType.label', { fallback: "Old Construction Type" })} value={oldPropertyFields.oldConstructionType} />
            <ReadOnlyField label={t('basicInfo.fields.oldCSN.label', { fallback: "Old CSN" })} value={oldPropertyFields.oldCSN} type="number" />
            <ReadOnlyField label={t('basicInfo.fields.oldConstructionYear.label', { fallback: "Old Construction Year" })} value={oldPropertyFields.oldConstructionYear} type="number" />
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <UpdateButton
              id="update-basic-info-btn"
              label={isPending ? tQ('footer.saving', { fallback: "Saving..." }) : tQ('commonbuttonmessages.UpdateChanges', { fallback: "Update Changes" })}
              type="submit"
              isLoading={isPending}
              disabled={isPending || !hasChanges}
              data-enter-navigable="true"
              className="focus:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
