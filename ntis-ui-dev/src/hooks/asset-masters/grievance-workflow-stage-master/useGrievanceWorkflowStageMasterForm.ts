"use client";

import { useLocale, useTranslations } from "next-intl";
import type { GrievanceWorkflowStageMasterFormProps } from "@/types/asset-masters/grievance-workflow-stage-master.types";
import { useGrievanceWorkflowStageMasterFormState } from "./useGrievanceWorkflowStageMasterFormState";
import { useGrievanceWorkflowStageMasterFormValidation } from "./useGrievanceWorkflowStageMasterFormValidation";
import { useGrievanceWorkflowStageMasterFormHandlers } from "./useGrievanceWorkflowStageMasterFormHandlers";

export function useGrievanceWorkflowStageMasterForm({
  initialData,
}: GrievanceWorkflowStageMasterFormProps) {
  const locale = useLocale();
  const t = useTranslations("grievanceWorkflowStageMaster");

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
  } = useGrievanceWorkflowStageMasterFormState({ initialData });

  const { validate, showError } = useGrievanceWorkflowStageMasterFormValidation({
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
    handleClose,
  } = useGrievanceWorkflowStageMasterFormHandlers({
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
  });

  return {
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
  };
}
