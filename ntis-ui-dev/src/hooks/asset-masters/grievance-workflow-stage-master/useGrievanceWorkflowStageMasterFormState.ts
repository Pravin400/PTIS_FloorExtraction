"use client";

import { useState, useMemo } from "react";
import type {
  GrievanceWorkflowStageMaster,
  GrievanceWorkflowStageMasterFormModel,
} from "@/types/asset-masters/grievance-workflow-stage-master.types";

interface UseGrievanceWorkflowStageMasterFormStateProps {
  initialData: GrievanceWorkflowStageMaster | null;
}

export function useGrievanceWorkflowStageMasterFormState({
  initialData,
}: UseGrievanceWorkflowStageMasterFormStateProps) {
  const isEdit = initialData?.id != null;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [open, setOpen] = useState(true);

  const initialFormData = useMemo<GrievanceWorkflowStageMasterFormModel>(() => {
    return {
      id: initialData?.id ?? null,
      ulbTypeId: 1,
      stageCode: initialData?.stageCode ?? "",
      stageName: initialData?.stageName ?? "",
      stageNameLocal: initialData?.stageNameLocal ?? "",
      stageOrder: initialData?.stageOrder ?? "",
      status: initialData?.status ?? "",
      description: initialData?.description ?? "",
      isActive: initialData?.isActive ?? true,
    };
  }, [initialData]);

  const [formData, setFormData] = useState<GrievanceWorkflowStageMasterFormModel>({
    ...initialFormData,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof GrievanceWorkflowStageMasterFormModel, string>>
  >({});
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
