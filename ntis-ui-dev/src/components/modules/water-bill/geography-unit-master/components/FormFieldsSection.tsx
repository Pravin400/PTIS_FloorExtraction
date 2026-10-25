"use client";

import { Input, SearchSelect, ValidationMessage } from "@/components/common";
import { GeographyType } from "@/types/water-bill/geographyType.types";
import { GeographyUnitFormModel, ParentGeographyUnitCandidate } from "@/types/water-bill/geographyUnit.types";
import type React from "react";

interface FormFieldsSectionProps {
  formData: GeographyUnitFormModel;
  searchSequenceValue: string;
  geographyTypeOptions: GeographyType[];
  parentUnitOptions: ParentGeographyUnitCandidate[];
  optionsLoading: boolean;
  parentOptionsLoading?: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleGeographyTypeChange: (value: string) => void;
  handleParentUnitChange: (value: string) => void;
  errors: Partial<Record<keyof GeographyUnitFormModel, string>>;
  showError: (field: keyof GeographyUnitFormModel) => boolean;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  isActive?: boolean;
  isEdit?: boolean;
}

export const FormFieldsSection = ({
  formData,
  searchSequenceValue,
  geographyTypeOptions,
  parentUnitOptions,
  optionsLoading,
  parentOptionsLoading = false,
  handleChange,
  handleBlur,
  handleGeographyTypeChange,
  handleParentUnitChange,
  errors,
  showError,
  t,
  isActive = true,
}: FormFieldsSectionProps) => {
  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
      <SearchSelect
        name="geographyTypeId"
        label={t("form.fields.geographyType.label")}
        required
        placeholder={t("form.fields.geographyType.placeholder")}
        value={formData.geographyTypeId === "" ? "" : String(formData.geographyTypeId)}
        onChange={(_name, value) => handleGeographyTypeChange(value)}
        options={geographyTypeOptions.map((gt) => ({
          label: gt.geographyType,
          value: String(gt.id),
        }))}
        isLoading={optionsLoading}
        disabled={!isActive || optionsLoading}
      />
      <ValidationMessage message={errors.geographyTypeId} visible={showError("geographyTypeId")} />

      <SearchSelect
        name="parentGeographyUnitId"
        label={t("form.fields.parentUnit.label")}
        placeholder={t("form.fields.parentUnit.placeholder")}
        value={formData.parentGeographyUnitId === null ? "" : String(formData.parentGeographyUnitId)}
        onChange={(_name, value) => handleParentUnitChange(value)}
        options={parentUnitOptions.map((u) => ({
          label: `${u.geographyUnitName} (${u.geographyUnitCode})`,
          value: String(u.id),
        }))}
        isLoading={parentOptionsLoading}
        disabled={!isActive || !formData.geographyTypeId || parentOptionsLoading}
      />

      <Input
        name="geographyUnitCode"
        label={t("form.fields.unitCode.label")}
        required
        placeholder={t("form.fields.unitCode.placeholder")}
        value={formData.geographyUnitCode}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={!isActive}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage message={errors.geographyUnitCode} visible={showError("geographyUnitCode")} />

      <Input
        name="geographyUnitName"
        label={t("form.fields.unitName.label")}
        required
        placeholder={t("form.fields.unitName.placeholder")}
        value={formData.geographyUnitName}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={!isActive}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage message={errors.geographyUnitName} visible={showError("geographyUnitName")} />

      <Input
        name="searchSequence"
        label={t("form.fields.searchSequence.label")}
        type="number"
        min={1}
        value={searchSequenceValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage message={errors.searchSequence} visible={showError("searchSequence")} />
    </div>
  );
};
