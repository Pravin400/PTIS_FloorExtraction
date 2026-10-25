"use client";

import { useState, useMemo } from "react";
import type { AliasMaster, AliasMasterFormModel } from "@/types/alias-master.types";

interface UseAliasMasterFormStateProps {
  initialData: AliasMaster | null;
}

export function useAliasMasterFormState({ initialData }: UseAliasMasterFormStateProps) {
  const isEdit = initialData?.id != null;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [open, setOpen] = useState(true);

  const initialFormData = useMemo<AliasMasterFormModel>(() => {
    return {
      id: initialData?.id ?? null,
      keyName: initialData?.keyName ?? "",
      labelName: initialData?.labelName ?? "",
      englishName: initialData?.englishName ?? "",
      regionalName: initialData?.regionalName ?? "",
      hindiName: initialData?.hindiName ?? "",
      isActive: initialData?.isActive ?? true,
    };
  }, [initialData]);

  const [formData, setFormData] = useState<AliasMasterFormModel>({
    ...initialFormData,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AliasMasterFormModel, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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
