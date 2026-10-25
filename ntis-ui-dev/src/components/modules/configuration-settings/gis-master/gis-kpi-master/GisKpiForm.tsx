"use client";

import { Activity } from "lucide-react";
import { Drawer } from "@/components/common/Drawer";
import { CancelButton, SaveButton } from "@/components/common";
import { StatusToggleSection } from "./components/StatusToggleSection";
import { FormFieldsSection } from "./components/FormFieldsSection";
import { ValidationSection } from "./components/ValidationSection";
import { GisKpiMaster } from "@/types/gis-master/gis-kpi-master.types";
import { useGisKpiForm } from "@/hooks/gis-master/gis-kpi-master/useGisKpiForm";

export interface GisKpiFormProps {
  id: number | null;
  initialData?: GisKpiMaster;
}

export default function GisKpiForm({ id, initialData }: GisKpiFormProps) {
  const {
    formData,
    setFormData,
    errors,
    isSubmitting,
    isActive,
    open,
    handleChange,
    handleBlur,
    handleSubmit,
    handleToggleStatus,
    handleCancel,
    showError,
    t,
    tCommon,
    isEdit,
  } = useGisKpiForm({
    id,
    initialData,
    onSuccess: () => {},
    onCancel: () => {},
  });

  const handleColorSelect = (color: string) => {
    setFormData((prev) => ({
      ...prev,
      defaultColor: color,
    }));
  };

  return (
    <Drawer
      open={open}
      onClose={handleCancel}
      className="border-l-4 border-[#4F6A94]"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-linear-to-br from-blue-500 to-blue-600 rounded-lg text-white shadow-xs">
            <Activity size={20} />
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
          <CancelButton
            label={tCommon("buttons.cancel")}
            onClick={handleCancel}
            disabled={isSubmitting}
          />
          <SaveButton
            label={isEdit ? t("form.actions.update") : t("form.actions.save")}
            type="submit"
            form="gis-kpi-form"
            isLoading={isSubmitting}
          />
        </>
      }
    >
      <form id="gis-kpi-form" onSubmit={handleSubmit} className="space-y-6 bg-[#F8FAFF] p-5">
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
          handleChange={handleChange}
          handleBlur={handleBlur}
          errors={errors}
          showError={showError}
          t={t}
          isActive={isActive}
          isEdit={isEdit}
          onColorSelect={handleColorSelect}
        />

        <ValidationSection tCommon={tCommon} />
      </form>
    </Drawer>
  );
}
