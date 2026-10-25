"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  createReadingSourceAction,
  updateReadingSourceAction,
} from "@/app/[locale]/water-bill/readingsourcemaster/action";
import { ReadingSource, ReadingSourceFormModel } from "@/types/water-bill/reading-source-master.types";
import {
  ALPHANUMERIC_ONLY_REGEX,
  ALPHANUMERIC_ONLY_SANITIZE,
  ALPHANUMERIC_WITH_SPACES_REGEX,
  ALPHANUMERIC_WITH_SPACES_SANITIZE,
} from "@/lib/utils/validation-rules";

export interface UseReadingSourceFormProps {
  id: number | null;
  initialData?: ReadingSource;
  onSuccess: () => void;
  onCancel: () => void;
}

export function useReadingSourceForm({ id, initialData, onSuccess, onCancel }: UseReadingSourceFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("readingSourceMaster");
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<ReadingSourceFormModel>({
    id: id ?? initialData?.id,
    code: initialData?.readingSourceCode || initialData?.code || "",
    readingSourceCode: initialData?.readingSourceCode || initialData?.code || "",
    readingSource: initialData?.readingSource || "",
    isActive: initialData?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback(
    (field: string, value: string): string => {
      const trimmed = (value || "").trim();
      if (field === "code" || field === "readingSourceCode") {
        if (!trimmed) return t("validation.codeRequired");
        if (trimmed.length < 2) return t("validation.codeMinLength");
        if (trimmed.length > 20) return t("validation.codeMaxLength");
        if (!ALPHANUMERIC_ONLY_REGEX.test(trimmed)) {
          return t("validation.codeInvalid");
        }
      }
      if (field === "readingSource") {
        if (!trimmed) return t("validation.nameRequired");
        if (trimmed.length < 2) return t("validation.nameMinLength");
        if (trimmed.length > 100) return t("validation.nameMaxLength");
        if (!ALPHANUMERIC_WITH_SPACES_REGEX.test(trimmed)) {
          return t("validation.nameInvalid");
        }
      }
      return "";
    },
    [t]
  );

  const validateAll = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    const codeErr = validateField("code", formData.code || "");
    if (codeErr) newErrors.code = codeErr;

    const nameErr = validateField("readingSource", formData.readingSource || "");
    if (nameErr) newErrors.readingSource = nameErr;

    setErrors(newErrors);
    setTouched({ code: true, readingSource: true });
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  const handleBlur = useCallback(
    (field: string) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const val = field === "code" ? formData.code || "" : formData.readingSource || "";
      const err = validateField(field, val);
      setErrors((prev) => ({ ...prev, [field]: err }));
    },
    [formData, validateField]
  );

  const handleCodeChange = useCallback(
    (value: string) => {
      const val = value.replace(ALPHANUMERIC_ONLY_SANITIZE, "").toUpperCase().slice(0, 20);
      setFormData((prev) => ({ ...prev, code: val, readingSourceCode: val }));
      if (touched.code) {
        setErrors((prev) => ({ ...prev, code: validateField("code", val) }));
      }
    },
    [touched.code, validateField]
  );

  const handleSourceNameChange = useCallback(
    (value: string) => {
      const val = value.replace(ALPHANUMERIC_WITH_SPACES_SANITIZE, "").slice(0, 100);
      setFormData((prev) => ({ ...prev, readingSource: val }));
      if (touched.readingSource) {
        setErrors((prev) => ({ ...prev, readingSource: validateField("readingSource", val) }));
      }
    },
    [touched.readingSource, validateField]
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
        router.push(`/${locale}/water-bill/readingsourcemaster`);
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
        const result = isEdit
          ? await updateReadingSourceAction(formData)
          : await createReadingSourceAction(formData);

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
    handleSourceNameChange,
    handleToggleStatus,
    handleBlur,
    handleSubmit,
    handleCancel,
  };
}
