"use client";

import { useTranslations, useLocale } from "next-intl";
import { PropertyType } from "@/types/property-type.types";
import { usePropertyTypeFormState } from "./usePropertyTypeFormState";
import { usePropertyTypeFormValidation } from "./usePropertyTypeFormValidation";
import { usePropertyTypeFormHandlers } from "./usePropertyTypeFormHandlers";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface UsePropertyTypeFormProps {
  id: number | null;
  initialData?: PropertyType;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Main hook for PropertyType form
 * 
 * Composes:
 * - usePropertyTypeFormState for state management
 * - usePropertyTypeFormValidation for validation logic
 * - usePropertyTypeFormHandlers for event handlers
 * 
 * @param props - Form configuration
 * @returns Complete form state and handlers
 */
export function usePropertyTypeForm({
  id,
  initialData,
  onSuccess,
  onCancel,
}: UsePropertyTypeFormProps) {
  const locale = useLocale();
  const t = useTranslations("propertyType.propertyType");
  const tCommon = useTranslations("common");

  const categoryLabel = useAliasLabel("Category", t("aliasFallback.category"));
  const typeOfUseLabel = useAliasLabel("Type_Of_Use", t("aliasFallback.typeOfUse"));
  const wardLabel = useAliasLabel("Ward", t("aliasFallback.ward"));

  // State management
  const {
    formData,
    setFormData,
    searchSequenceValue,
    setSearchSequenceValue,
    errors,
    setErrors,
    touched,
    setTouched,
    isSubmitting,
    setIsSubmitting,
    submittedOnce,
    setSubmittedOnce,
    isActive,
    setIsActive,
    open,
    setOpen,
    isEdit,
  } = usePropertyTypeFormState({ id, initialData });

  // Validation
  const { validate, showError } = usePropertyTypeFormValidation({
    isEdit,
    submittedOnce,
    touched,
    errors,
    t,
    categoryLabel,
  });

  // Handlers
  const {
    handleChange,
    handleBlur,
    handleCategoryChange,
    handleTypeChange,
    handleSubmit,
    handleToggleStatus,
    handleCancel,
    refreshAndClose,
  } = usePropertyTypeFormHandlers({
    formData,
    setFormData,
    setSearchSequenceValue,
    setTouched,
    setErrors,
    setIsActive,
    setIsSubmitting,
    setSubmittedOnce,
    setOpen,
    validate,
    isEdit,
    locale,
    t,
    tCommon,
    wardLabel,
    onSuccess,
    onCancel,
  });

  return {
    formData,
    searchSequenceValue,
    errors,
    isSubmitting,
    isActive,
    open,
    setOpen,
    handleChange,
    handleBlur,
    handleCategoryChange,
    handleTypeChange,
    handleSubmit,
    handleToggleStatus,
    handleCancel,
    refreshAndClose,
    showError,
    t,
    tCommon,
    isEdit,
    categoryLabel,
    typeOfUseLabel,
    wardLabel,
  };
}
