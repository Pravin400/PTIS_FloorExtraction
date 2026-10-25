"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  createMeterTypeAction,
  updateMeterTypeAction,
} from "@/app/[locale]/water-bill/metertypemaster/action";
import { MeterType, MeterTypeFormModel } from "@/types/water-bill/meter-type-master.types";
import {
  ALPHANUMERIC_ONLY_REGEX,
  ALPHANUMERIC_ONLY_SANITIZE,
  ALPHANUMERIC_WITH_SPACES_REGEX,
  ALPHANUMERIC_WITH_SPACES_SANITIZE,
} from "@/lib/utils/validation-rules";

export interface UseMeterTypeFormProps {
  id: number | null;
  initialData?: MeterType;
  onSuccess: () => void;
  onCancel: () => void;
}

export function useMeterTypeForm({ id, initialData, onSuccess, onCancel }: UseMeterTypeFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("meterTypeMaster");
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<MeterTypeFormModel>({
    id: id ?? initialData?.id,
    code: initialData?.meterTypeCode || initialData?.code || "",
    meterTypeCode: initialData?.meterTypeCode || initialData?.code || "",
    meterType: initialData?.meterType || "",
    description: initialData?.description || "",
    isActive: initialData?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback(
    (field: string, value: string): string => {
      const trimmed = (value || "").trim();
      if (field === "code" || field === "meterTypeCode") {
        if (!trimmed) return t("validation.codeRequired");
        if (trimmed.length < 2) return t("validation.codeMinLength");
        if (trimmed.length > 20) return t("validation.codeMaxLength");
        if (!ALPHANUMERIC_ONLY_REGEX.test(trimmed)) {
          return t("validation.codeInvalid");
        }
      }
      if (field === "meterType") {
        if (!trimmed) return t("validation.nameRequired");
        if (trimmed.length < 2) return t("validation.nameMinLength");
        if (trimmed.length > 100) return t("validation.nameMaxLength");
        if (!ALPHANUMERIC_WITH_SPACES_REGEX.test(trimmed)) {
          return t("validation.nameInvalid");
        }
      }
      if (field === "description" && trimmed) {
        if (trimmed.length > 300) return t("validation.descriptionMaxLength");
      }
      return "";
    },
    [t]
  );

  const validateAll = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    const codeErr = validateField("code", formData.code || "");
    if (codeErr) newErrors.code = codeErr;

    const nameErr = validateField("meterType", formData.meterType || "");
    if (nameErr) newErrors.meterType = nameErr;

    const descErr = validateField("description", formData.description || "");
    if (descErr) newErrors.description = descErr;

    setErrors(newErrors);
    setTouched({ code: true, meterType: true, description: true });
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  const handleBlur = useCallback(
    (field: string) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const val =
        field === "code" ? formData.code || "" : field === "meterType" ? formData.meterType || "" : formData.description || "";
      const err = validateField(field, val);
      setErrors((prev) => ({ ...prev, [field]: err }));
    },
    [formData, validateField]
  );

  const handleCodeChange = useCallback(
    (value: string) => {
      const val = value.replace(ALPHANUMERIC_ONLY_SANITIZE, "").toUpperCase().slice(0, 20);
      setFormData((prev) => ({ ...prev, code: val, meterTypeCode: val }));
      if (touched.code) {
        setErrors((prev) => ({ ...prev, code: validateField("code", val) }));
      }
    },
    [touched.code, validateField]
  );

  const handleMeterTypeChange = useCallback(
    (value: string) => {
      const val = value.replace(ALPHANUMERIC_WITH_SPACES_SANITIZE, "").slice(0, 100);
      setFormData((prev) => ({ ...prev, meterType: val }));
      if (touched.meterType) {
        setErrors((prev) => ({ ...prev, meterType: validateField("meterType", val) }));
      }
    },
    [touched.meterType, validateField]
  );

  const handleDescriptionChange = useCallback(
    (value: string) => {
      const val = value.slice(0, 300);
      setFormData((prev) => ({ ...prev, description: val }));
      if (touched.description) {
        setErrors((prev) => ({ ...prev, description: validateField("description", val) }));
      }
    },
    [touched.description, validateField]
  );

  const handleToggleStatus = useCallback((checked: boolean) => {
    setFormData((prev) => ({ ...prev, isActive: checked }));
  }, []);

  const mapApiError = useCallback(
    (res: { statusCode?: number; message?: string }) => {
      const code = res.statusCode ?? 0;
      const msg = (res.message || "").toLowerCase();

      if (code === 409 || msg.includes("duplicate") || msg.includes("already exists") || msg.includes("already exist")) {
        return t("messages.duplicateRecord");
      }
      if (code === 404) {
        return t("messages.notFound");
      }
      if (code >= 500) {
        return t("messages.operationFailed");
      }
      return res.message || t("messages.operationFailed");
    },
    [t]
  );

  const [open, setOpen] = useState(true);
  const [, startTransition] = React.useTransition();

  const closeAndRoute = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      startTransition(() => {
        router.push(`/${locale}/water-bill/metertypemaster`);
      });
    }, 400);
  }, [router, locale]);

  const handleCancel = useCallback(() => {
    onCancel();
    closeAndRoute();
  }, [onCancel, closeAndRoute]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateAll()) return;

      setIsSubmitting(true);
      try {
        const result = isEdit ? await updateMeterTypeAction(formData) : await createMeterTypeAction(formData);

        if (!result.success) {
          toast.error(mapApiError(result));
          return;
        }

        toast.success(isEdit ? t("messages.updateSuccess") : t("messages.createSuccess"));

        onSuccess();
        startTransition(() => {
          router.refresh();
          closeAndRoute();
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, isEdit, validateAll, mapApiError, onSuccess, router, t, closeAndRoute]
  );

  return {
    isEdit,
    formData,
    errors,
    touched,
    isSubmitting,
    open,
    handleCodeChange,
    handleMeterTypeChange,
    handleDescriptionChange,
    handleToggleStatus,
    handleBlur,
    handleSubmit,
    handleCancel,
  };
}
