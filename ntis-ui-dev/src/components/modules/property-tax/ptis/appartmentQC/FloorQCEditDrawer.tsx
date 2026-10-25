"use client";

import { useState, useEffect } from "react";
import { Drawer } from "@/components/common/Drawer";
import { SaveButton, CancelButton } from "@/components/common";
import { EditableSelect, EditableInput } from "./PropertyEditDrawerInputs";
import { DrawerFloorDataRow, DrawerDropdownOption } from "@/types/propertyEditScreenDrawer.types";
import { useTranslations } from "next-intl";

interface FloorQCEditDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (updatedRow: DrawerFloorDataRow) => void;
  row: DrawerFloorDataRow | null;

  // Dropdown states and loading
  floorOptions: DrawerDropdownOption[];
  conTypeOptions: DrawerDropdownOption[];
  useTypeOptions: DrawerDropdownOption[];
  getSubTypeOptions: (typeOfUseId: string) => DrawerDropdownOption[];

  isLoadingFloors: boolean;
  isLoadingConTypes: boolean;
  isLoadingUseTypes: boolean;

  // Handlers to trigger lazy loading
  handleFloorDropdownClick: () => void;
  handleConTypeDropdownClick: () => void;
  handleUseTypeDropdownClick: () => void;
}

export const FloorQCEditDrawer = ({
  open,
  onClose,
  onSave,
  row,
  floorOptions,
  conTypeOptions,
  useTypeOptions,
  getSubTypeOptions,
  isLoadingFloors,
  isLoadingConTypes,
  isLoadingUseTypes,
  handleFloorDropdownClick,
  handleConTypeDropdownClick,
  handleUseTypeDropdownClick,
}: FloorQCEditDrawerProps) => {
  const t = useTranslations("appartmentQC");
  const [formData, setFormData] = useState<DrawerFloorDataRow | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && row) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({ ...row });
      setErrors({});
    }
  }, [open, row]);

  if (!formData) return null;

  const updateField = (field: keyof DrawerFloorDataRow, value: string) => {
    setFormData((prev) => prev ? { ...prev, [field]: value } : null);
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSaveClick = () => {
    if (formData) {
      const newErrors: Record<string, string> = {};
      let hasError = false;

      if (!formData.floorId) {
        newErrors.floorId = t("floorQC.validation.floorRequired") || "Floor is required";
        hasError = true;
      }
      if (!formData.conYear) {
        newErrors.conYear = t("floorQC.validation.conYearRequired") || "Construction year is required";
        hasError = true;
      } else if (formData.conYear.length !== 4) {
        newErrors.conYear = t("floorQC.validation.conYearInvalid") || "Construction year must be 4 digits";
        hasError = true;
      }
      if (!formData.asstYear) {
        newErrors.asstYear = t("floorQC.validation.asstYearRequired") || "Assessment year is required";
        hasError = true;
      } else if (formData.asstYear.length !== 4) {
        newErrors.asstYear = t("floorQC.validation.asstYearInvalid") || "Assessment year must be 4 digits";
        hasError = true;
      }
      if (!formData.constructionTypeId) {
        newErrors.constructionTypeId = t("floorQC.validation.conTypeRequired") || "Construction type is required";
        hasError = true;
      }
      if (!formData.typeOfUseId) {
        newErrors.typeOfUseId = t("floorQC.validation.useRequired") || "Use type is required";
        hasError = true;
      }

      setErrors(newErrors);

      if (!hasError) {
        onSave(formData);
      }
    }
  };

  const getMatchedValue = (value: string | undefined, options: DrawerDropdownOption[]) => {
    if (!value) return "";
    const match = options.find(opt => opt.value === value || opt.label === value);
    return match ? match.value : value;
  };

  const getDisplayOptions = (value: string | undefined, options: DrawerDropdownOption[]) => {
    if (!value) return options;
    const exists = options.some(opt => opt.value === value || opt.label === value);
    if (exists) return options;
    return [{ value, label: value }, ...options];
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="md"
      title={<span className="text-gray-900 font-semibold">{t("floorQC.columns.editFloorQC") || "Edit Floor QC"}</span>}
      footer={
        <div className="flex justify-end gap-3 w-full">
          <CancelButton onClick={onClose} label={t("drawer.cancel") || "Cancel"} />
          <SaveButton
            onClick={handleSaveClick}
            label={t("drawer.update") || "Update"}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          />
        </div>
      }
    >
      <div className="p-6 space-y-4">
        <div onClick={handleFloorDropdownClick}>
          <EditableSelect
            label={t("floorQC.columns.floor")}
            value={getMatchedValue(formData.floorId, floorOptions)}
            onChange={(v) => updateField("floorId", v)}
            options={getDisplayOptions(formData.floorId, floorOptions)}
            isLoading={isLoadingFloors}
            required
            error={errors.floorId}
          />
        </div>

        <EditableInput
          label={t("floorQC.columns.conYear")}
          value={formData.conYear}
          onChange={(v) => {
            let newValue = v;
            newValue = newValue.replace(/\D/g, "");
            if (newValue.length > 4) newValue = newValue.slice(0, 4);
            updateField("conYear", newValue);
          }}
          required
          error={errors.conYear}
        />

        <EditableInput
          label={t("floorQC.columns.asstYear")}
          value={formData.asstYear}
          onChange={(v) => {
            let newValue = v;
            newValue = newValue.replace(/\D/g, "");
            if (newValue.length > 4) newValue = newValue.slice(0, 4);
            updateField("asstYear", newValue);
          }}
          required
          error={errors.asstYear}
        />

        <div onClick={handleConTypeDropdownClick}>
          <EditableSelect
            label={t("floorQC.columns.conType")}
            value={getMatchedValue(formData.constructionTypeId, conTypeOptions)}
            onChange={(v) => updateField("constructionTypeId", v)}
            options={getDisplayOptions(formData.constructionTypeId, conTypeOptions)}
            isLoading={isLoadingConTypes}
            required
            error={errors.constructionTypeId}
          />
        </div>

        <div onClick={handleUseTypeDropdownClick}>
          <EditableSelect
            label={t("floorQC.columns.use")}
            value={getMatchedValue(formData.typeOfUseId, useTypeOptions)}
            onChange={(v) => {
              updateField("typeOfUseId", v);
              // Reset sub-type when use type changes
              updateField("subTypeOfUseId", "");
            }}
            options={getDisplayOptions(formData.typeOfUseId, useTypeOptions)}
            isLoading={isLoadingUseTypes}
            required
            error={errors.typeOfUseId}
          />
        </div>

        <div onClick={handleUseTypeDropdownClick}>
          <EditableSelect
            label={t("floorQC.columns.subTypeOfUse")}
            value={getMatchedValue(formData.subTypeOfUseId, getSubTypeOptions(formData.typeOfUseId))}
            onChange={(v) => updateField("subTypeOfUseId", v)}
            options={getDisplayOptions(formData.subTypeOfUseId, getSubTypeOptions(formData.typeOfUseId))}
            isLoading={isLoadingUseTypes}
            error={errors.subTypeOfUseId}
          />
        </div>
      </div>
    </Drawer>
  );
};
