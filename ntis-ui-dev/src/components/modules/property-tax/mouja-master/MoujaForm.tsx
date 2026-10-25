"use client";

import { useMemo } from "react";
import { MapPin } from "lucide-react";
import { Drawer } from "@/components/common/Drawer";
import { CancelButton, SaveButton } from "@/components/common";
import { StatusToggleSection } from "./components/StatusToggleSection";
import { FormFieldsSection } from "./components/FormFieldsSection";
import { ValidationSection } from "./components/ValidationSection";
import { Mouja } from "@/types/mouja.types";
import { useMoujaForm } from "@/hooks/moujamaster/useMoujaForm";

export interface MoujaFormProps {
  id: number | null;
  initialData?: Mouja;
}

export default function MoujaForm({
  id,
  initialData,
}: MoujaFormProps) {
  const {
    formData,
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
    moujaLabel,
  } = useMoujaForm({
    id,
    initialData,
    onSuccess: () => {},
    onCancel: () => {},
  });

  const values = useMemo(
    () => (moujaLabel ? { mouja: moujaLabel, entity: moujaLabel } : undefined),
    [moujaLabel]
  );

  return (
    <Drawer
      open={open}
      onClose={handleCancel}
      className="border-l-4 border-[#4F6A94]"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-linear-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            <MapPin size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {isEdit ? t("form.editTitle", values) : t("form.addTitle", values)}
            </div>
            <div className="text-sm text-slate-500">
              {isEdit ? t("form.editSubtitle", values) : t("form.subtitle", values)}
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
            label={isEdit ? t("form.actions.update", values) : t("form.actions.save", values)}
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
          moujaLabel={moujaLabel}
        />

        <FormFieldsSection
          formData={formData}
          handleChange={handleChange}
          handleBlur={handleBlur}
          errors={errors}
          showError={showError}
          t={t}
          moujaLabel={moujaLabel}
        />

        <ValidationSection tCommon={tCommon} />
      </form>
    </Drawer>
  );
}
