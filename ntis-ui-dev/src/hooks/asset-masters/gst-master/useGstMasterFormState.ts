"use client";

import { useState, useMemo } from "react";
import type { GstMaster, GstMasterFormModel } from "@/types/asset-masters/gst-master.types";

interface UseGstMasterFormStateProps {
  initialData: GstMaster | null;
}

export function useGstMasterFormState({ initialData }: UseGstMasterFormStateProps) {
  const isEdit = initialData?.id != null;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [open, setOpen] = useState(true);

  const initialFormData = useMemo<GstMasterFormModel>(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      id: initialData?.id ?? null,
      taxCode: initialData?.taxCode ?? "",
      taxName: initialData?.taxName ?? "",
      taxPercentage: initialData?.taxPercentage ?? "",
      effectiveFromDate: initialData?.effectiveFromDate?.slice(0, 10) ?? today,
      effectiveToDate: initialData?.effectiveToDate?.slice(0, 10) ?? today,
      isActive: initialData?.isActive ?? true,
    };
  }, [initialData]);

  const [formData, setFormData] = useState<GstMasterFormModel>({
    ...initialFormData,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof GstMasterFormModel, string>>>({});
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
