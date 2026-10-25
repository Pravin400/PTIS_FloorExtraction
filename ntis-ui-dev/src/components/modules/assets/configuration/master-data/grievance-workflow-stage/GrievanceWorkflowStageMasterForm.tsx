"use client";

import { useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Workflow, CheckCircle2, X } from "lucide-react";
import { Drawer } from "@/components/common/Drawer";
import {
  CancelButton,
  SaveButton,
  ToggleSwitch,
  ValidationMessage,
  MandatoryNote,
} from "@/components/common";
import { cn } from "@/lib/utils/cn";
import type { GrievanceWorkflowStageMaster } from "@/types/asset-masters/grievance-workflow-stage-master.types";
import { useGrievanceWorkflowStageMasterForm } from "@/hooks/asset-masters/grievance-workflow-stage-master/useGrievanceWorkflowStageMasterForm";
import { FormFieldsSection, type FormFieldsSectionRef } from "./FormFieldsSection";

export default function GrievanceWorkflowStageMasterForm({
  initialData,
}: {
  initialData: GrievanceWorkflowStageMaster | null;
}) {
  const t = useTranslations("grievanceWorkflowStageMaster");

  const {
    formData,
    errors,
    isSubmitting,
    open,
    isEdit,
    handleChange,
    handleStatusToggle,
    handleBlur,
    handleSubmit,
    handleClose,
    showError,
  } = useGrievanceWorkflowStageMasterForm({ initialData });

  const statusToggleRef = useRef<HTMLButtonElement>(null);
  const formFieldsRef = useRef<FormFieldsSectionRef>(null);

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      if (isEdit && statusToggleRef.current) {
        statusToggleRef.current.focus();
      } else if (!isEdit && formFieldsRef.current?.stageCodeRef?.current) {
        formFieldsRef.current.stageCodeRef.current.focus();
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [open, isEdit]);

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      className="border-l-4 border-[#4F6A94]"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
            <Workflow size={20} />
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
          <CancelButton label={t("form.actions.cancel")} onClick={handleClose} disabled={isSubmitting} />
          <SaveButton
            label={isEdit ? t("form.actions.update") : t("form.actions.save")}
            type="submit"
            form="grievance-workflow-stage-form"
            isLoading={isSubmitting}
          />
        </>
      }
    >
      <form
        id="grievance-workflow-stage-form"
        onSubmit={handleSubmit}
        className="flex h-full flex-col gap-6 bg-[#F8FAFF] p-5"
      >
        <div className="flex-1 space-y-6">
          {isEdit && (
            <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-4">
              <div
                className={cn(
                  "rounded-xl p-3 flex items-center justify-between",
                  formData.isActive
                    ? "border border-blue-200 bg-[#F0F6FF]"
                    : "border border-gray-200 bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full",
                      formData.isActive ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-900"
                    )}
                  >
                    {formData.isActive ? <CheckCircle2 size={18} /> : <X size={18} />}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{t("form.status.label")}</div>
                    <div className="text-sm text-slate-500">
                      {t("form.status.description")}{" "}
                      {formData.isActive ? t("form.status.active") : t("form.status.inactive")}
                    </div>
                  </div>
                </div>
                <ToggleSwitch
                  ref={statusToggleRef}
                  checked={formData.isActive}
                  onChange={handleStatusToggle}
                  showPopup={false}
                  activeLabel={t("form.status.active")}
                  inactiveLabel={t("form.status.inactive")}
                />
              </div>
              <ValidationMessage message={errors.isActive} visible={!!errors.isActive} />
            </div>
          )}

          <FormFieldsSection
            ref={formFieldsRef}
            formData={formData}
            errors={errors}
            showError={showError}
            onChange={handleChange}
            onBlur={handleBlur}
            t={t}
          />
        </div>

        <MandatoryNote text={t("form.validation.mandatoryNoticePlain") || "Fields marked with * are mandatory"} />
      </form>
    </Drawer>
  );
}
