"use client";

import { useLocale, useTranslations } from "next-intl";
import type { PenaltyRule } from "@/types/asset-masters/penalty-rule-master.types";
import { usePenaltyRuleFormState } from "./usePenaltyRuleFormState";
import { usePenaltyRuleFormValidation } from "./usePenaltyRuleFormValidation";
import { usePenaltyRuleFormHandlers } from "./usePenaltyRuleFormHandlers";

interface UsePenaltyRuleFormProps {
  initialData: PenaltyRule | null;
}

export function usePenaltyRuleForm({ initialData }: UsePenaltyRuleFormProps) {
  const locale = useLocale();
  const t = useTranslations("penaltyRuleMaster");

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
  } = usePenaltyRuleFormState({ initialData });

  const { validate, showError } = usePenaltyRuleFormValidation({
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
  } = usePenaltyRuleFormHandlers({
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
    setErrors,
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
