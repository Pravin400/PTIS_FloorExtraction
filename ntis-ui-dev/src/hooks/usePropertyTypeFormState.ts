"use client";

import { useState } from "react";
import { PropertyTypeFormModel, PropertyType } from "@/types/property-type.types";

interface UsePropertyTypeFormStateProps {
  id: number | null;
  initialData?: PropertyType;
}

/**
 * Hook for managing PropertyType form state
 * 
 * Handles:
 * - Form data initialization and state management
 * - Active status state
 * - Search sequence value state
 * - Error and touched states
 * 
 * @param props - Form state configuration
 * @returns Form state and setters
 */
export function usePropertyTypeFormState({
  id,
  initialData,
}: UsePropertyTypeFormStateProps) {
  const isEdit = Boolean(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [open, setOpen] = useState(true);

  // For add mode, show placeholder (0). For edit, use initial value.
  const [formData, setFormData] = useState<PropertyTypeFormModel>({
    id: id ?? initialData?.id,
    propertyDescription: initialData?.propertyDescription ?? "",
    descriptionEnglish: initialData?.descriptionEnglish ?? (initialData?.propertyDescriptionEnglish as string) ?? "",
    propertyDescriptionEnglish: (initialData?.propertyDescriptionEnglish as string) ?? initialData?.descriptionEnglish ?? "",
    type: initialData?.type ?? "",
    propertyTypeGroup: initialData?.propertyTypeGroup ?? null,
    searchSequence: initialData?.searchSequence ?? 0,
    propertyTypeCategoryId: isEdit
      ? (initialData?.propertyTypeCategoryId ?? 0)
      : 0,
    isActive: initialData?.isActive ?? true,
    updatedBy: 1,
  });

  /**
   * String representation of searchSequence for text input binding.
   *
   * This is intentionally separate from formData.searchSequence because:
   * - Input fields require string values for proper binding
   * - User may type intermediate values (e.g., empty string while clearing)
   * - On blur, empty values are normalized to "0" and synced to formData
   *
   * Both values are kept in sync via handleChange/handleBlur in the handlers hook.
   */
  const [searchSequenceValue, setSearchSequenceValue] = useState<string>(
    initialData?.searchSequence?.toString() ?? "0"
  );

  const [errors, setErrors] = useState<Partial<Record<keyof PropertyTypeFormModel, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  return {
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
  };
}
