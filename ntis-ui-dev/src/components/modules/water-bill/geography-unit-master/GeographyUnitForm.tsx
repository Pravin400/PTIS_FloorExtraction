"use client";

import { MapPinned } from "lucide-react";
import { Drawer } from "@/components/common/Drawer";
import { CancelButton, SaveButton } from "@/components/common";
import { StatusToggleSection } from "./components/StatusToggleSection";
import { FormFieldsSection } from "./components/FormFieldsSection";
import { ValidationSection } from "./components/ValidationSection";
import { useGeographyUnitForm } from "@/hooks/water-bill/geographyunitmaster/useGeographyUnitForm";
import { GeographyUnit } from "@/types/water-bill/geographyUnit.types";

export interface GeographyUnitFormProps {
  id: number | null;
  initialData?: GeographyUnit;
}

export default function GeographyUnitForm({ id, initialData }: GeographyUnitFormProps) {
  const {
    formData,
    searchSequenceValue,
    errors,
    isSubmitting,
    isActive,
    open,
    geographyTypeOptions,
    parentUnitOptions,
    optionsLoading,
    parentOptionsLoading,
    handleChange,
    handleBlur,
    handleGeographyTypeChange,
    handleParentUnitChange,
    handleSubmit,
    handleToggleStatus,
    handleCancel,
    showError,
    t,
    tCommon,
    isEdit,
  } = useGeographyUnitForm({
    id,
    initialData,
    onSuccess: () => {},
    onCancel: () => {},
  });

  return (
    <Drawer
      open={open}
      onClose={handleCancel}
      className="border-l-4 border-[#4F6A94]"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-linear-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            <MapPinned size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {isEdit ? t("form.editTitle") : t("form.addTitle")}
            </div>
            <div className="text-sm text-slate-500">
              {isEdit ? t("form.editSubtitle") : t("form.subtitle")}
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <CancelButton label={tCommon("buttons.cancel")} onClick={handleCancel} disabled={isSubmitting} />
          <SaveButton
            label={isEdit ? t("form.actions.update") : t("form.actions.save")}
            type="submit"
            form="form"
            isLoading={isSubmitting}
          />
        </>
      }
    >
      <form id="form" onSubmit={handleSubmit} className="space-y-6 bg-[#F8FAFF] p-5">
        <StatusToggleSection
          isEdit={isEdit}
          isActive={isActive}
          handleToggleStatus={handleToggleStatus}
          error={errors.isActive}
          t={t}
          tCommon={tCommon}
        />

        <FormFieldsSection
          formData={formData}
          searchSequenceValue={searchSequenceValue}
          geographyTypeOptions={geographyTypeOptions}
          parentUnitOptions={parentUnitOptions}
          optionsLoading={optionsLoading}
          parentOptionsLoading={parentOptionsLoading}
          handleChange={handleChange}
          handleBlur={handleBlur}
          handleGeographyTypeChange={handleGeographyTypeChange}
          handleParentUnitChange={handleParentUnitChange}
          errors={errors}
          showError={showError}
          t={t}
          isActive={isActive}
          isEdit={isEdit}
        />

        <ValidationSection tCommon={tCommon} />
      </form>
    </Drawer>
  );
}
