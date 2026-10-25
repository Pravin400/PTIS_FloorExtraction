"use client";

import React, { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { createSubZoneAction, updateSubZoneAction } from "@/app/[locale]/assets/configuration/master-data/mouja-subzone/action";
import { SubZoneFormModel, SubZoneDetails } from "@/types/asset-masters/mouja-subzone.types";
import { sanitizeSubZoneFieldValue, validateSubZoneForm, getErrorMessage, isDeactivateBlockedMessage } from "./validation";

interface UseSubZoneFormProps {
  id: number | null;
  initialData?: SubZoneDetails;
  selectedMoujaId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function useSubZoneForm({ id, initialData, selectedMoujaId, onSuccess = () => {}, onCancel = () => {} }: UseSubZoneFormProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("moujaSubzone");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [open, setOpen] = useState(true);
  const [formData, setFormData] = useState<SubZoneFormModel>({
    id: id ?? initialData?.id,
    moujaId: initialData?.moujaId ?? selectedMoujaId ?? null,
    subZoneNo: initialData?.subZoneNo ?? "",
    subZoneName: initialData?.subZoneName ?? "",
    isActive: initialData?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof SubZoneFormModel, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = useCallback((data: SubZoneFormModel) => validateSubZoneForm(data, t, isEdit), [t, isEdit]);
  const showError = useCallback((field: keyof SubZoneFormModel) => (submittedOnce || touched[field]) && !!errors[field], [submittedOnce, touched, errors]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: sanitizeSubZoneFieldValue(name, value) }));
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));
    const updated = { ...formData, [name]: sanitizeSubZoneFieldValue(name, value) };
    setFormData(updated);
    const fieldErrors = validate(updated);
    setErrors((p) => {
      const fieldName = name as keyof SubZoneFormModel;
      if (fieldErrors[fieldName]) return { ...p, [fieldName]: fieldErrors[fieldName] };
      const next = { ...p };
      delete next[fieldName];
      return next;
    });
  }, [formData, validate]);

  const mapApiError = useCallback((res: { statusCode?: number; message?: string; errors?: Record<string, string> | null }) => {
    if (res.errors) {
      for (const val of Object.values(res.errors)) {
        if (val) {
          const cleanVal = val.replace(/\.$/, "");
          const translationKey = `apiErrors.${cleanVal}` as never;
          try {
            const translated = t(translationKey);
            if (translated && translated !== translationKey && !translated.includes(translationKey)) {
              return translated;
            }
          } catch {}
        }
      }
    }
    return getErrorMessage(res.message, res.statusCode, t, tCommon, t("list.subZoneTitle"));
  }, [t, tCommon]);

  const closeAndRoute = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      router.push(`/${locale}/assets/configuration/master-data/mouja-subzone${sp.toString() ? `?${sp.toString()}` : ""}`);
    }, 400);
  }, [router, locale, sp]);

  const handleCancel = useCallback(() => {
    onCancel();
    closeAndRoute();
  }, [onCancel, closeAndRoute]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedOnce(true);
    const v = validate(formData);
    setErrors(v);
    if (Object.keys(v).length > 0) {
      toast.error(t("form.validation.fixErrors"));
      return;
    }
    setIsSubmitting(true);
    try {
      const res = isEdit ? await updateSubZoneAction(formData) : await createSubZoneAction(formData);
      if (!res.success) {
        const errorMessage = mapApiError(res);
        if (isDeactivateBlockedMessage(res.message)) {
          setErrors((p) => ({ ...p, isActive: errorMessage }));
        }
        toast.error(errorMessage);
        return;
      }
      const successMessage = isEdit ? t("success.subZoneUpdated") : t("success.subZoneCreated");
      toast.success(successMessage || res.message);
      onSuccess();
      closeAndRoute();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = useCallback((checked: boolean) => {
    setIsActive(checked);
    setFormData((p) => ({ ...p, isActive: checked }));
    setErrors((p) => ({ ...p, isActive: "" }));
  }, []);

  const handleSelectChange = useCallback((name: string, value: string) => {
    const parsed = Number(value);
    const numericValue = value && Number.isFinite(parsed) ? parsed : null;
    setFormData((p) => {
      const updated = { ...p, [name]: numericValue };
      const fieldErrors = validate(updated);
      setErrors((prev) => {
        const fieldName = name as keyof SubZoneFormModel;
        if (fieldErrors[fieldName]) return { ...prev, [fieldName]: fieldErrors[fieldName] };
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
      return updated;
    });
  }, [validate]);

  return { formData, errors, isSubmitting, isActive, open, setOpen, handleChange, handleBlur, handleSelectChange, handleSubmit, handleToggleStatus, handleCancel, showError, t, tCommon, isEdit };
}
