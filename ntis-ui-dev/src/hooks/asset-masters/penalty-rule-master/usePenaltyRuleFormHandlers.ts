"use client";

import React, { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { PenaltyRuleFormModel } from "@/types/asset-masters/penalty-rule-master.types";
import { savePenaltyRule } from "@/app/[locale]/assets/configuration/master-data/penalty-rule-master/action";
import { CODE_SANITIZE, ASSET_MASTER_NAME_SANITIZE } from "@/lib/utils/asset-validation-rules";
import { getPenaltyRuleErrorMessage, parsePenaltyRuleApiErrors } from "./error-mapping";

interface UsePenaltyRuleFormHandlersProps {
  formData: PenaltyRuleFormModel;
  setFormData: React.Dispatch<React.SetStateAction<PenaltyRuleFormModel>>;
  setTouched: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof PenaltyRuleFormModel, string>>>>;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  setSubmittedOnce: React.Dispatch<React.SetStateAction<boolean>>;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  validate: (data: PenaltyRuleFormModel) => Partial<Record<keyof PenaltyRuleFormModel, string>>;
  isEdit: boolean;
  locale: string;
  t: (key: string) => string;
  initialFormData: PenaltyRuleFormModel;
}

export function usePenaltyRuleFormHandlers({
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
}: UsePenaltyRuleFormHandlersProps) {
  const router = useRouter();
  const tCommon = useTranslations("common");
  const [, startTransition] = useTransition();

  const handleClose = useCallback(() => {
    setOpen(false);
    router.back();
  }, [router, setOpen]);

  const handleClear = useCallback(() => {
    setFormData({ ...initialFormData });
    setErrors({});
    setTouched({});
    setSubmittedOnce(false);
  }, [initialFormData, setFormData, setErrors, setTouched, setSubmittedOnce]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let sanitizedValue = value;
    if (name === "penaltyCode") {
      sanitizedValue = value.toUpperCase().replace(CODE_SANITIZE, "").slice(0, 20);
    } else if (name === "penaltyName") {
      sanitizedValue = value.replace(ASSET_MASTER_NAME_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ");
      if (sanitizedValue.length > 100) {
        sanitizedValue = sanitizedValue.substring(0, 100);
      }
    } else if (name === "penaltyValue") {
      const oldValue = String(formData.penaltyValue);
      if (value.length >= oldValue.length) {
        const maxVal = formData.calculationType === "Percentage" ? 999 : 9999999999999.99;
        if (Number(value) > maxVal) {
          return;
        }
      }
    }
    setFormData((p) => ({ ...p, [name]: sanitizedValue }));
    setErrors((p) => ({ ...p, [name]: "" }));
  }, [formData.calculationType, formData.penaltyValue, setFormData, setErrors]);

  const handleStatusToggle = useCallback(() => {
    setFormData((p) => ({ ...p, isActive: !p.isActive }));
    setErrors((p) => ({ ...p, isActive: "" }));
  }, [setFormData, setErrors]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof PenaltyRuleFormModel;

    setTouched((prev) => ({ ...prev, [name]: true }));

    const updatedFormData = {
      ...formData,
      [name]: value,
    };

    const fieldErrors = validate(updatedFormData);
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (fieldErrors[fieldName]) {
        newErrors[fieldName] = fieldErrors[fieldName];
      } else {
        delete newErrors[fieldName];
      }
      return newErrors;
    });
  }, [formData, validate, setTouched, setErrors]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedOnce(true);

    const nextErrors = validate(formData);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error(t("form.validation.fixErrors"));
      return;
    }

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("locale", locale);
      fd.set("penaltyCode", formData.penaltyCode);
      fd.set("penaltyName", formData.penaltyName);
      fd.set("calculationType", formData.calculationType);
      fd.set("penaltyValue", String(formData.penaltyValue));
      fd.set("gracePeriodDays", String(formData.gracePeriodDays));
      fd.set("isActive", String(formData.isActive));

      const res = await savePenaltyRule(isEdit ? String(formData.id ?? "") : "", fd);
      if (res?.ok) {
        toast.success(isEdit ? t("form.messages.updateSuccess") : t("form.messages.createSuccess"));
        setOpen(false);
        startTransition(() => {
          router.push(`/${locale}/assets/configuration/master-data/penalty-rule-master`);
        });
        return;
      }

      const { fieldErrors, globalMessage } = parsePenaltyRuleApiErrors(
        res?.message || res?.error,
        res?.statusCode,
        t,
        tCommon
      );

      if (Object.keys(fieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
        setTouched((prev) => {
          const nextTouched = { ...prev };
          for (const key of Object.keys(fieldErrors)) {
            nextTouched[key] = true;
          }
          return nextTouched;
        });
      }

      toast.error(globalMessage);
    } catch (err) {
      toast.error(getPenaltyRuleErrorMessage(err instanceof Error ? err.message : undefined, undefined, t, tCommon));
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isEdit, locale, t, tCommon, validate, setErrors, setTouched, setSubmittedOnce, setIsSubmitting, setOpen, router]);

  return {
    handleChange,
    handleStatusToggle,
    handleBlur,
    handleSubmit,
    handleClear,
    handleClose,
  };
}
