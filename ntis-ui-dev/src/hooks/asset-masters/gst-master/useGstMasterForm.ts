"use client";

import { useLocale, useTranslations } from "next-intl";
import type { GstMaster } from "@/types/asset-masters/gst-master.types";
import { useGstMasterFormState } from "./useGstMasterFormState";
import { useGstMasterFormValidation } from "./useGstMasterFormValidation";
import { useGstMasterFormHandlers } from "./useGstMasterFormHandlers";

interface UseGstMasterFormProps {
  initialData: GstMaster | null;
}

export function useGstMasterForm({ initialData }: UseGstMasterFormProps) {
  const locale = useLocale();
  const t = useTranslations("gstMaster");

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
  } = useGstMasterFormState({ initialData });

  const { validate, showError } = useGstMasterFormValidation({
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
  } = useGstMasterFormHandlers({
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
