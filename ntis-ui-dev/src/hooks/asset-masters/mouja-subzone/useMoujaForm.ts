"use client";

import React, { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { createMoujaAction, updateMoujaAction } from "@/app/[locale]/assets/configuration/master-data/mouja-subzone/action";
import { MoujaFormModel, Mouja } from "@/types/asset-masters/mouja-subzone.types";
import { sanitizeMoujaFieldValue, validateMoujaForm, getErrorMessage, isDeactivateBlockedMessage } from "./validation";

interface UseMoujaFormProps {
  id: number | null;
  initialData?: Mouja;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function useMoujaForm({
  id,
  initialData,
  onSuccess = () => { },
  onCancel = () => { },
}: UseMoujaFormProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("moujaSubzone");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [formData, setFormData] = useState<MoujaFormModel>({
    id: id ?? initialData?.id,
    moujaNo: initialData?.moujaNo ?? "",
    moujaName: initialData?.moujaName ?? "",
    isActive: initialData?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof MoujaFormModel, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = useCallback(
    (data: MoujaFormModel): Partial<Record<keyof MoujaFormModel, string>> => {
      return validateMoujaForm(data, t, isEdit);
    },
    [t, isEdit]
  );

  const showError = useCallback((field: keyof MoujaFormModel): boolean =>
    (submittedOnce || touched[field]) && !!errors[field],
    [submittedOnce, touched, errors]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeMoujaFieldValue(name, value);
    setFormData((p) => ({
      ...p,
      [name]: sanitizedValue,
    }));
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));

    const sanitizedValue = sanitizeMoujaFieldValue(name, value);
    const updatedFormData = {
      ...formData,
      [name]: sanitizedValue,
    };
    setFormData(updatedFormData);

    const fieldErrors = validate(updatedFormData);
    setErrors((p) => {
      const newErrors = { ...p };
      const fieldName = name as keyof MoujaFormModel;
      if (fieldErrors[fieldName]) {
        newErrors[fieldName] = fieldErrors[fieldName];
      } else {
        delete newErrors[fieldName];
      }
      return newErrors;
    });
  }, [formData, validate]);

  const mapApiError = useCallback((result: { statusCode?: number; message?: string; errors?: Record<string, string> | null }) => {
    if (result.errors) {
      for (const val of Object.values(result.errors)) {
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
    return getErrorMessage(result.message, result.statusCode, t, tCommon, t("list.moujaTitle"));
  }, [t, tCommon]);

  const [open, setOpen] = useState(true);

  const closeAndRoute = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      const params = sp.toString() ? `?${sp.toString()}` : "";
      router.push(`/${locale}/assets/configuration/master-data/mouja-subzone${params}`);
    }, 400);
  }, [router, locale, sp]);

  const handleCancel = useCallback(() => {
    onCancel();
    closeAndRoute();
  }, [onCancel, closeAndRoute]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmittedOnce(true);

    const v = validate(formData);
    setErrors(v);

    if (Object.keys(v).length) return;

    setIsSubmitting(true);
    try {
      const result = isEdit
        ? await updateMoujaAction(formData)
        : await createMoujaAction(formData);

      if (!result.success) {
        const errorMessage = mapApiError(result);
        if (isDeactivateBlockedMessage(result.message)) {
          setErrors((p) => ({ ...p, isActive: errorMessage }));
        }
        toast.error(errorMessage);
        return;
      }

      const successMessage = isEdit
        ? t("success.moujaUpdated")
        : t("success.moujaCreated");
      toast.success(successMessage || result.message);

      onSuccess();
      closeAndRoute();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = useCallback((checked: boolean): void => {
    setIsActive(checked);
    setFormData((p) => ({ ...p, isActive: checked }));
    setErrors((p) => ({ ...p, isActive: "" }));
  }, []);

  return {
    formData,
    errors,
    isSubmitting,
    isActive,
    open,
    setOpen,
    handleChange,
    handleBlur,
    handleSubmit,
    handleToggleStatus,
    handleCancel,
    showError,
    t,
    tCommon,
    isEdit,
  };
}
