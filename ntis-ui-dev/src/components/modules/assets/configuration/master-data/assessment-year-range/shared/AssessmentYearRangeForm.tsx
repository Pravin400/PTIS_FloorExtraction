"use client";

import { useEffect, useRef } from "react";
import { CalendarRange } from "lucide-react";
import { Drawer } from "@/components/common/Drawer";
import { CancelButton, SaveButton } from "@/components/common";
import { StatusToggleSection } from "./components/StatusToggleSection";
import { FormFieldsSection } from "./components/FormFieldsSection";
import { ValidationSection } from "./components/ValidationSection";
import {
  AssessmentYearRange,
  AssessmentYearRangeConfig,
  AssessmentYearRangeFormModel,
} from "@/types/asset-masters/assessment-year-range.types";
import { useAssessmentYearRangeForm } from "@/hooks/asset-masters/assessmentYearRange/useAssessmentYearRangeForm";

export interface AssessmentYearRangeFormProps<T extends AssessmentYearRange> {
  config: AssessmentYearRangeConfig;
  id: number | null;
  initialData?: T;
  createAction: (data: AssessmentYearRangeFormModel) => Promise<{ success: boolean; message?: string; statusCode?: number }>;
  updateAction: (data: AssessmentYearRangeFormModel) => Promise<{ success: boolean; message?: string; statusCode?: number }>;
}

export function AssessmentYearRangeForm<T extends AssessmentYearRange>({
  config,
  id,
  initialData,
  createAction,
  updateAction,
}: AssessmentYearRangeFormProps<T>) {
  const {
    fromYearValue,
    toYearValue,
    errors,
    isSubmitting,
    isActive,
    open,
    handleYearChange,
    handleBlur,
    handleSubmit,
    handleToggleStatus,
    handleCancel,
    showError,
    t,
    tCommon,
    isEdit,
  } = useAssessmentYearRangeForm({
    config,
    id,
    initialData,
    createAction,
    updateAction,
  });

  const statusToggleRef = useRef<HTMLButtonElement>(null);
  const fromYearRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const timeoutId = setTimeout(() => {
      if (isEdit && statusToggleRef.current) {
        statusToggleRef.current.focus();
      } else if (!isEdit && fromYearRef.current) {
        fromYearRef.current.focus();
      }
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [open, isEdit]);

  return (
    <Drawer
      open={open}
      onClose={handleCancel}
      className="border-l-4 border-[#4F6A94]"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            <CalendarRange size={20} />
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
            form="assessment-year-range-form"
            isLoading={isSubmitting}
          />
        </>
      }
    >
      <form id="assessment-year-range-form" onSubmit={handleSubmit} className="space-y-6 bg-[#F8FAFF] p-5">
        <StatusToggleSection
          statusToggleRef={statusToggleRef}
          isEdit={isEdit}
          isActive={isActive}
          handleToggleStatus={handleToggleStatus}
          error={errors.isActive}
          t={t}
          tCommon={tCommon}
        />

        <FormFieldsSection
          fromYearRef={fromYearRef}
          fromYearValue={fromYearValue}
          toYearValue={toYearValue}
          handleYearChange={handleYearChange}
          handleBlur={handleBlur}
          errors={errors}
          showError={showError}
          t={t}
        />

        <ValidationSection tCommon={tCommon} />
      </form>
    </Drawer>
  );
}
