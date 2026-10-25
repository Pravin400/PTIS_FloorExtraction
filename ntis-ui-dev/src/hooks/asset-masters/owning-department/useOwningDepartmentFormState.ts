"use client";

import { useState, useMemo } from "react";
import type { OwningDepartment, OwningDepartmentFormModel } from "@/types/asset-masters/owning-department.types";

interface UseOwningDepartmentFormStateProps {
  initialData: OwningDepartment | null;
}

export function useOwningDepartmentFormState({ initialData }: UseOwningDepartmentFormStateProps) {
  const isEdit = !!initialData;

  const initialFormData = useMemo<OwningDepartmentFormModel>(() => {
    return {
      id: initialData?.id ?? null,
      owningDepartmentName: initialData?.owningDepartmentName ?? "",
      description: initialData?.description ?? "",
      isActive: initialData?.isActive ?? true,
    };
  }, [initialData]);

  const [formData, setFormData] = useState<OwningDepartmentFormModel>({ ...initialFormData });
  const [errors, setErrors] = useState<Partial<Record<keyof OwningDepartmentFormModel, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [open, setOpen] = useState(true);

  return {
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
  };
}
