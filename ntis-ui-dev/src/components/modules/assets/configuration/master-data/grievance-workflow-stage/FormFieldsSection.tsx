"use client";

import React from "react";
import { Input, TextArea, ValidationMessage } from "@/components/common";
import type { GrievanceWorkflowStageMasterFormModel } from "@/types/asset-masters/grievance-workflow-stage-master.types";
import { GRIEVANCE_WORKFLOW_STAGE_LIMITS } from "@/lib/validation/asset/asset-masters/grievance-workflow-stage-validation";

export interface FormFieldsSectionProps {
  formData: GrievanceWorkflowStageMasterFormModel;
  errors: Partial<Record<keyof GrievanceWorkflowStageMasterFormModel, string>>;
  showError: (field: keyof GrievanceWorkflowStageMasterFormModel) => boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  t: (key: string) => string;
}

export interface FormFieldsSectionRef {
  stageCodeRef: React.RefObject<HTMLInputElement | null>;
}

export const FormFieldsSection = React.forwardRef<FormFieldsSectionRef, FormFieldsSectionProps>(
  ({ formData, errors, showError, onChange, onBlur, t }, ref) => {
    const stageCodeRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => ({
      stageCodeRef,
    }));

    return (
      <div className="space-y-4 rounded-xl border border-[#DCEAFF] bg-slate-50 p-5">
        <div>
          <Input
            ref={stageCodeRef}
            name="stageCode"
            label={t("form.fields.stageCode.label")}
            required
            maxLength={GRIEVANCE_WORKFLOW_STAGE_LIMITS.STAGE_CODE_MAX}
            value={formData.stageCode}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={t("form.fields.stageCode.placeholder")}
            fullWidth
          />
          <ValidationMessage message={errors.stageCode} visible={showError("stageCode")} />
        </div>

        <div>
          <Input
            name="stageName"
            label={t("form.fields.stageName.label")}
            required
            maxLength={GRIEVANCE_WORKFLOW_STAGE_LIMITS.STAGE_NAME_MAX}
            value={formData.stageName}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={t("form.fields.stageName.placeholder")}
            fullWidth
          />
          <ValidationMessage message={errors.stageName} visible={showError("stageName")} />
        </div>

        <div>
          <Input
            name="stageNameLocal"
            label={t("form.fields.stageNameLocal.label")}
            maxLength={GRIEVANCE_WORKFLOW_STAGE_LIMITS.STAGE_NAME_LOCAL_MAX}
            value={formData.stageNameLocal || ""}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={t("form.fields.stageNameLocal.placeholder")}
            fullWidth
          />
          <ValidationMessage message={errors.stageNameLocal} visible={showError("stageNameLocal")} />
        </div>

        <div>
          <Input
            name="stageOrder"
            type="number"
            min={GRIEVANCE_WORKFLOW_STAGE_LIMITS.STAGE_ORDER_MIN}
            max={GRIEVANCE_WORKFLOW_STAGE_LIMITS.STAGE_ORDER_MAX}
            onKeyDown={(e) => {
              if (["e", "E", "+", "-", "."].includes(e.key)) {
                e.preventDefault();
              }
            }}
            label={t("form.fields.stageOrder.label")}
            required
            value={String(formData.stageOrder || "")}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={t("form.fields.stageOrder.placeholder")}
            fullWidth
          />
          <ValidationMessage message={errors.stageOrder} visible={showError("stageOrder")} />
        </div>

        <div>
          <Input
            name="status"
            label={t("form.fields.status.label")}
            required
            maxLength={GRIEVANCE_WORKFLOW_STAGE_LIMITS.STATUS_MAX}
            value={formData.status}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={t("form.fields.status.placeholder")}
            fullWidth
          />
          <ValidationMessage message={errors.status} visible={showError("status")} />
        </div>

        <div>
          <TextArea
            name="description"
            label={t("form.fields.description.label")}
            maxLength={GRIEVANCE_WORKFLOW_STAGE_LIMITS.DESCRIPTION_MAX}
            value={formData.description || ""}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={t("form.fields.description.placeholder")}
            rows={3}
            className="w-full"
          />
          <ValidationMessage message={errors.description} visible={showError("description")} />
        </div>
      </div>
    );
  }
);

FormFieldsSection.displayName = "FormFieldsSection";
