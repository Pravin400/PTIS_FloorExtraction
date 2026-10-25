"use client";

import { useTranslations, useLocale } from "next-intl";
import { useOwningDepartmentFormState } from "./useOwningDepartmentFormState";
import { useOwningDepartmentFormValidation } from "./useOwningDepartmentFormValidation";
import { useOwningDepartmentFormHandlers } from "./useOwningDepartmentFormHandlers";
import type { OwningDepartment } from "@/types/asset-masters/owning-department.types";

export function useOwningDepartmentForm({ initialData = null }: { initialData?: OwningDepartment | null } = {}) {
  const t = useTranslations("owningDepartment");
  const locale = useLocale();

  const {
    formData,
    setFormData,
    errors,
    setErrors,
    touched,
    setTouched,
    isSubmitting,
    setIsSubmitting,
    submittedOnce,
    setSubmittedOnce,
    open,
    setOpen,
    isEdit,
    initialFormData,
  } = useOwningDepartmentFormState({ initialData });

  const { validate, showError } = useOwningDepartmentFormValidation({
    isEdit,
    submittedOnce,
    touched,
    errors,
    t,
  });

  const {
    handleChange,
    handleStatusToggle,
    handleBlur,
    handleSubmit,
    handleClear,
    handleClose,
  } = useOwningDepartmentFormHandlers({
    formData,
    setFormData,
    setTouched,
    setErrors,
    setIsSubmitting,
    setSubmittedOnce,
    setOpen,
    validate,
    isEdit,
    locale,
    t,
    initialFormData,
  });

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    isSubmitting,
    open,
    isEdit,
    handleChange,
    handleStatusToggle,
    handleBlur,
    handleSubmit,
    handleClear,
    handleClose,
    showError,
  };
}
