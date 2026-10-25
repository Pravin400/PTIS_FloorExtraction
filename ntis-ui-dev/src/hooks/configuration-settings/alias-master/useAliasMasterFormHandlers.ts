"use client";

import React, { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { AliasMasterFormModel } from "@/types/alias-master.types";
import { saveAliasMaster } from "@/app/[locale]/configuration-settings/alias-master/action";
import { ASSET_MASTER_NAME_SANITIZE, TRANSLATION_TEXT_SANITIZE } from "@/lib/utils/asset-validation-rules";

interface UseAliasMasterFormHandlersProps {
  formData: AliasMasterFormModel;
  setFormData: React.Dispatch<React.SetStateAction<AliasMasterFormModel>>;
  setTouched: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof AliasMasterFormModel, string>>>>;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  setSubmittedOnce: React.Dispatch<React.SetStateAction<boolean>>;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  validate: (data: AliasMasterFormModel) => Partial<Record<keyof AliasMasterFormModel, string>>;
  isEdit: boolean;
  locale: string;
  t: (key: string) => string;
  initialFormData: AliasMasterFormModel;
}

export function useAliasMasterFormHandlers({
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
}: UseAliasMasterFormHandlersProps) {
  const router = useRouter();
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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let sanitizedValue = value;
    if (name === "keyName" || name === "labelName") {
      sanitizedValue = value.replace(ASSET_MASTER_NAME_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ");
      if (sanitizedValue.length > (name === "keyName" ? 50 : 100)) {
        sanitizedValue = sanitizedValue.substring(0, name === "keyName" ? 50 : 100);
      }
    } else if (name === "englishName" || name === "regionalName" || name === "hindiName") {
      sanitizedValue = value.replace(TRANSLATION_TEXT_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ").slice(0, 100);
    }
    setFormData((p) => ({ ...p, [name]: sanitizedValue }));
    setErrors((p) => ({ ...p, [name]: "" }));
  }, [setFormData, setErrors]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const keyName = name as keyof AliasMasterFormModel;

    setTouched((prev) => ({ ...prev, [name]: true }));

    const updatedFormData = {
      ...formData,
      [name]: value,
    };

    const fieldErrors = validate(updatedFormData);
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (fieldErrors[keyName]) {
        newErrors[keyName] = fieldErrors[keyName];
      } else {
        delete newErrors[keyName];
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
      fd.set("keyName", formData.keyName);
      fd.set("labelName", formData.labelName);
      fd.set("englishName", formData.englishName || "");
      fd.set("regionalName", formData.regionalName || "");
      fd.set("hindiName", formData.hindiName || "");
      fd.set("isActive", String(formData.isActive));

      const res = await saveAliasMaster(isEdit ? String(formData.id ?? "") : "", fd);
      if (res?.ok) {
        toast.success(isEdit ? t("form.messages.updateSuccess") : t("form.messages.createSuccess"));
        setOpen(false);
        startTransition(() => {
          router.push(`/${locale}/configuration-settings/alias-master`);
        });
        return;
      }

      if (res?.error === "duplicate") {
        toast.error(t("form.messages.duplicate"));
        return;
      }
      toast.error(res?.message || res?.error || t("form.messages.error"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("form.messages.error"));
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isEdit, locale, t, validate, setErrors, setSubmittedOnce, setIsSubmitting, setOpen, router]);

  return {
    handleChange,
    handleBlur,
    handleSubmit,
    handleClear,
    handleClose,
  };
}
