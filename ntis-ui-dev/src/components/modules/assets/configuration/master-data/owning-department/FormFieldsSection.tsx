"use client";

import React, { useImperativeHandle, useRef } from "react";
import { Input, ValidationMessage } from "@/components/common";
import type { OwningDepartmentFormModel } from "@/types/asset-masters/owning-department.types";

export interface FormFieldsSectionRef {
  nameRef: React.RefObject<HTMLInputElement | null>;
}

interface FormFieldsSectionProps {
  formData: OwningDepartmentFormModel;
  errors: Partial<Record<keyof OwningDepartmentFormModel, string>>;
  showError: (fieldName: keyof OwningDepartmentFormModel) => boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  t: (key: string) => string;
}

export const FormFieldsSection = React.forwardRef<FormFieldsSectionRef, FormFieldsSectionProps>(
  ({ formData, errors, showError, onChange, onBlur, t }, ref) => {
    const nameRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      nameRef,
    }));

    return (
      <div className="rounded-xl border border-[#DCEAFF] bg-[#F8FAFF] p-5 space-y-4">
        <Input
          ref={nameRef}
          name="owningDepartmentName"
          label={t("form.fields.owningDepartmentName.label")}
          required
          value={formData.owningDepartmentName}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={t("form.fields.owningDepartmentName.placeholder")}
          fullWidth
        />
        <ValidationMessage message={errors.owningDepartmentName} visible={showError("owningDepartmentName")} />

        <Input
          name="description"
          label={t("form.fields.description.label")}
          required
          value={formData.description}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={t("form.fields.description.placeholder")}
          maxLength={100}
          fullWidth
        />
        <ValidationMessage message={errors.description} visible={showError("description")} />
      </div>
    );
  }
);

FormFieldsSection.displayName = "FormFieldsSection";
