"use client";

import { useLocale, useTranslations } from "next-intl";
import type { AliasMaster } from "@/types/alias-master.types";
import { useAliasMasterFormState } from "./useAliasMasterFormState";
import { useAliasMasterFormValidation } from "./useAliasMasterFormValidation";
import { useAliasMasterFormHandlers } from "./useAliasMasterFormHandlers";

interface UseAliasMasterFormProps {
  initialData: AliasMaster | null;
}

export function useAliasMasterForm({ initialData }: UseAliasMasterFormProps) {
  const locale = useLocale();
  const t = useTranslations("aliasMaster");

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
  } = useAliasMasterFormState({ initialData });

  const { validate, showError } = useAliasMasterFormValidation({
    submittedOnce,
    touched,
    errors,
    isEdit,
    t,
  });

  const {
    handleChange,
    handleBlur,
    handleSubmit,
    handleClear,
    handleClose,
  } = useAliasMasterFormHandlers({
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
    handleBlur,
    handleSubmit,
    handleClear,
    handleClose,
    showError,
  };
}
