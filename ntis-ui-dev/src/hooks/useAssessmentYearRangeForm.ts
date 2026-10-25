"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import {
  AssessmentYearRange,
  AssessmentYearRangeConfig,
  AssessmentYearRangeFormModel,
  getAssessmentYearRangeId,
} from "@/types/assessment-year-range.types";

interface UseAssessmentYearRangeFormProps {
  config: AssessmentYearRangeConfig;
  id: number | null;
  initialData?: AssessmentYearRange;
  createAction: (data: AssessmentYearRangeFormModel) => Promise<{ success: boolean; message?: string; statusCode?: number }>;
  updateAction: (data: AssessmentYearRangeFormModel) => Promise<{ success: boolean; message?: string; statusCode?: number }>;
}

const MIN_YEAR = 1700;
const MAX_YEAR = 2100;

export function useAssessmentYearRangeForm({
  config,
  id,
  initialData,
  createAction,
  updateAction,
}: UseAssessmentYearRangeFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations(config.translationNamespace);
  const tCommon = useTranslations("common");
  const assessmentLabel = useAliasLabel("Assessment", t("aliasFallback.entity"));
  const values = useMemo(
    () => ({ assessment: assessmentLabel, entity: assessmentLabel }),
    [assessmentLabel]
  );
  const isEdit = Boolean(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  const getInitialId = (): number | undefined => {
    if (id) return id;
    if (initialData) return getAssessmentYearRangeId(initialData);
    return undefined;
  };

  const [formData, setFormData] = useState<AssessmentYearRangeFormModel>({
    id: getInitialId(),
    fromYear: initialData?.fromYear ?? "",
    toYear: initialData?.toYear ?? "",
    isActive: initialData?.isActive ?? true,
    updatedBy: 1,
  });

  const [fromYearValue, setFromYearValue] = useState<string>(
    initialData?.fromYear?.toString() ?? ""
  );
  const [toYearValue, setToYearValue] = useState<string>(
    initialData?.toYear?.toString() ?? ""
  );

  const [errors, setErrors] = useState<Partial<Record<keyof AssessmentYearRangeFormModel, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = useCallback(
    (data: AssessmentYearRangeFormModel): Partial<Record<keyof AssessmentYearRangeFormModel, string>> => {
      const newErrors: Partial<Record<keyof AssessmentYearRangeFormModel, string>> = {};
      const fromYear = Number(data.fromYear);
      const toYear = Number(data.toYear);

      // From Year validation
      if (!data.fromYear && data.fromYear !== 0) {
        newErrors.fromYear = t("form.validation.fromYearRequired", values);
      } else if (!Number.isFinite(fromYear) || !/^\d{4}$/.test(String(data.fromYear))) {
        newErrors.fromYear = t("form.validation.yearFormat", values);
      } else if (fromYear < MIN_YEAR || fromYear > MAX_YEAR) {
        newErrors.fromYear = t("form.validation.yearRange", { min: MIN_YEAR, max: MAX_YEAR, ...values });
      }

      // To Year validation
      if (!data.toYear && data.toYear !== 0) {
        newErrors.toYear = t("form.validation.toYearRequired", values);
      } else if (!Number.isFinite(toYear) || !/^\d{4}$/.test(String(data.toYear))) {
        newErrors.toYear = t("form.validation.yearFormat", values);
      } else if (toYear < MIN_YEAR || toYear > MAX_YEAR) {
        newErrors.toYear = t("form.validation.yearRange", { min: MIN_YEAR, max: MAX_YEAR, ...values });
      }

      // Cross-field validation: fromYear <= toYear
      if (!newErrors.fromYear && !newErrors.toYear && fromYear > toYear) {
        newErrors.fromYear = t("form.validation.fromYearGreaterThanToYear", values);
      }

      // Active status validation for new records
      if (!isEdit && !data.isActive) {
        newErrors.isActive = t("form.validation.mustBeActive", values);
      }

      return newErrors;
    },
    [t, isEdit, values]
  );

  const showError = useCallback(
    (field: keyof AssessmentYearRangeFormModel): boolean =>
      (submittedOnce || touched[field]) && !!errors[field],
    [submittedOnce, touched, errors]
  );

  const handleYearChange = useCallback((field: "fromYear" | "toYear", value: string): void => {
    // Only allow digits and limit to 4 characters
    const sanitized = value.replace(/\D/g, "").slice(0, 4);
    
    if (field === "fromYear") {
      setFromYearValue(sanitized);
      setFormData((p) => ({
        ...p,
        fromYear: sanitized === "" ? "" : Number(sanitized),
      }));
    } else {
      setToYearValue(sanitized);
      setFormData((p) => ({
        ...p,
        toYear: sanitized === "" ? "" : Number(sanitized),
      }));
    }
  }, []);

  const handleBlur = useCallback(
    (field: "fromYear" | "toYear"): void => {
      setTouched((p) => ({ ...p, [field]: true }));

      // Use functional state update to get the latest formData
      setFormData((currentFormData) => {
        const fieldErrors = validate(currentFormData);
        
        setErrors((p) => {
          const newErrors = { ...p };
          if (fieldErrors[field]) {
            newErrors[field] = fieldErrors[field];
          } else {
            delete newErrors[field];
          }
          // Also update cross-field errors
          if (field === "toYear" && fieldErrors.fromYear) {
            newErrors.fromYear = fieldErrors.fromYear;
          }
          return newErrors;
        });
        
        // Return current data unchanged
        return currentFormData;
      });
    },
    [validate]
  );

  const mapApiError = useCallback(
    (result: { statusCode?: number; message?: string }) => {
      const errorMap: Record<number, string> = {
        409: t("apiErrors.duplicateRecord", values),
        404: t("apiErrors.notFound", values),
        401: tCommon("errors.unauthorized"),
        403: tCommon("errors.unauthorized"),
      };

      const code = result.statusCode ?? 0;
      if (errorMap[code]) return errorMap[code];

      if (code === 400) {
        const msg = result.message?.toLowerCase() || "";
        if (msg.includes("cannot deactivate") || msg.includes("referenced in") || msg.includes("in use")) {
          return t("apiErrors.cannotDeactivateYearRange", values);
        }
        if (msg.includes("duplicate") || msg.includes("already exists") || msg.includes("overlap")) {
          return t("apiErrors.duplicateRecord", values);
        }
        return result.message || t("apiErrors.invalidData", values);
      }

      if (code >= 500) return tCommon("errors.serverError");
      return result.message || t("apiErrors.operationFailed", values);
    },
    [t, tCommon, values]
  );

  const [open, setOpen] = useState(true);
  const [, startTransition] = React.useTransition();
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount to prevent navigation after component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const closeAndRoute = useCallback(() => {
    setOpen(false);
    // Clear any existing timeout to prevent multiple navigations
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      startTransition(() => {
        router.push(`/${locale}${config.routePath}`);
      });
    }, 400);
  }, [router, locale, config.routePath]);

  const handleCancel = useCallback(() => {
    closeAndRoute();
  }, [closeAndRoute]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmittedOnce(true);

    const v = validate(formData);
    setErrors(v);

    if (Object.keys(v).length) return;

    setIsSubmitting(true);
    try {
      const result = isEdit
        ? await updateAction(formData)
        : await createAction(formData);

      if (!result.success) {
        // Handle server-side validation errors
        if (result.statusCode === 400 && result.message) {
          try {
            const parsedError = JSON.parse(result.message);
            if (parsedError.errors && typeof parsedError.errors === 'object') {
              const serverErrors: Partial<Record<keyof AssessmentYearRangeFormModel, string>> = {};
              const whitelist: Array<keyof AssessmentYearRangeFormModel> = ['fromYear', 'toYear', 'isActive', 'id'];
              let hasUnmappedErrors = false;
              
              Object.entries(parsedError.errors).forEach(([key, messages]) => {
                const fieldKey = (key.charAt(0).toLowerCase() + key.slice(1)) as keyof AssessmentYearRangeFormModel;
                
                if (Array.isArray(messages) && messages.length > 0) {
                  const backendMsg = messages[0];
                  
                  // Whitelist check
                  if (whitelist.includes(fieldKey)) {
                    if (backendMsg === "FromYear_MustBeLessThanToYear") {
                      return;
                    }
                    serverErrors[fieldKey] = backendMsg;
                  } else {
                    hasUnmappedErrors = true;
                  }
                }
              });

              if (Object.keys(serverErrors).length > 0) {
                setErrors((prev) => ({ ...prev, ...serverErrors }));
                if (!hasUnmappedErrors) return; // Only stop if all errors were mapped
              }
            }
          } catch (_) {
            // Not a JSON error, fall back to default toast
            // Silently ignore parsing errors to prevent Next.js dev overlay from popping up on string-based backend errors
          }
        }
        
        toast.error(mapApiError(result));
        return;
      }

      toast.success(
        isEdit
          ? t("success.updated", { fromYear: formData.fromYear, toYear: formData.toYear, ...values })
          : t("success.created", { fromYear: formData.fromYear, toYear: formData.toYear, ...values })
      );

      startTransition(() => {
        router.refresh();
        closeAndRoute();
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = useCallback((): void => {
    setIsActive((prev) => {
      const newValue = !prev;
      setFormData((p) => ({ ...p, isActive: newValue }));
      return newValue;
    });
  }, []);

  return {
    formData,
    fromYearValue,
    toYearValue,
    errors,
    isSubmitting,
    isActive,
    open,
    setOpen,
    handleYearChange,
    handleBlur,
    handleSubmit,
    handleToggleStatus,
    handleCancel,
    showError,
    t,
    tCommon,
    isEdit,
    assessmentLabel,
  };
}
