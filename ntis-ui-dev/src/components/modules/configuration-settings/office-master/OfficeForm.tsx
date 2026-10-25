"use client";

import { 
  CancelButton, 
  SaveButton, 
  Drawer
} from "@/components/common";
import { AlertCircle, Building2 } from "lucide-react";
import { Office } from "@/types/office.types";
import { useOfficeForm } from "@/hooks/useOfficeForm";
import { OfficeStatusToggle } from "./OfficeStatusToggle";
import { OfficeDetailsSection } from "./OfficeDetailsSection";
import { OfficeContactSection } from "./OfficeContactSection";

export interface OfficeFormProps {
  officeId: number | null;
  initialData?: Office;
}

export default function OfficeForm({
  officeId,
  initialData,
}: OfficeFormProps) {
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
  } = useOfficeForm({
    officeId,
    initialData,
    onSuccess: () => {},
    onCancel: () => {},
  });

  const isSaveDisabled = Object.keys(errors).length > 0;

  return (
    <Drawer
      open={open}
      onClose={handleCancel}
      className="border-l-4 border-[#4F6A94]"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-linear-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            <Building2 size={20} />
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
            form="form"
            isLoading={isSubmitting}
            disabled={isSaveDisabled}
          />
        </>
      }
    >
      <form id="form" onSubmit={handleSubmit} className="space-y-6 bg-[#F8FAFF] p-5">
        {isEdit && (
          <OfficeStatusToggle 
            isActive={isActive} 
            onToggle={handleToggleStatus} 
            error={errors.isActive}
            t={t}
            tCommon={tCommon}
          />
        )}

        <OfficeDetailsSection 
          formData={formData} 
          errors={errors} 
          handleChange={handleChange} 
          handleBlur={handleBlur} 
          showError={showError} 
          t={t} 
        />

        <OfficeContactSection 
          formData={formData} 
          errors={errors} 
          handleChange={handleChange} 
          handleBlur={handleBlur} 
          showError={showError} 
          t={t} 
        />

        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 shadow-xs">
          <AlertCircle size={16} className="shrink-0" />
          <span className="font-medium">{tCommon("note.mandatory")}</span>
        </div>
      </form>
    </Drawer>
  );
}
