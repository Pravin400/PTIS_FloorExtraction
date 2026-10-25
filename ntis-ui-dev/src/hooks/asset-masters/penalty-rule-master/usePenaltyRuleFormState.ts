"use client";

import { useState, useMemo } from "react";
import type { PenaltyRule, PenaltyRuleFormModel } from "@/types/asset-masters/penalty-rule-master.types";

interface UsePenaltyRuleFormStateProps {
  initialData: PenaltyRule | null;
}

export function usePenaltyRuleFormState({ initialData }: UsePenaltyRuleFormStateProps) {
  const isEdit = initialData?.id != null;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [open, setOpen] = useState(true);

  const initialFormData = useMemo<PenaltyRuleFormModel>(() => ({
    id: initialData?.id ?? null,
    penaltyCode: initialData?.penaltyCode ?? "",
    penaltyName: initialData?.penaltyName ?? "",
    calculationType: initialData?.calculationType ?? "",
    penaltyValue: initialData?.penaltyValue ?? "",
    gracePeriodDays: initialData?.gracePeriodDays ?? "",
    isActive: initialData?.isActive ?? true,
  }), [initialData]);

  const [formData, setFormData] = useState<PenaltyRuleFormModel>({
    ...initialFormData,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PenaltyRuleFormModel, string>>>({});
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
