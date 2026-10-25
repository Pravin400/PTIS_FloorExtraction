"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  createMeterTestStatusAction,
  updateMeterTestStatusAction,
} from "@/app/[locale]/water-bill/meterteststatusmaster/action";
import { MeterTestStatus, MeterTestStatusFormModel } from "@/types/water-bill/meter-test-status-master.types";
import {
  ALPHANUMERIC_ONLY_REGEX,
  ALPHANUMERIC_ONLY_SANITIZE,
  ALPHANUMERIC_WITH_SPACES_REGEX,
  ALPHANUMERIC_WITH_SPACES_SANITIZE,
} from "@/lib/utils/validation-rules";

export interface UseMeterTestStatusFormProps {
  id: number | null;
  initialData?: MeterTestStatus;
  onSuccess: () => void;
  onCancel: () => void;
}

export function useMeterTestStatusForm({ id, initialData, onSuccess, onCancel }: UseMeterTestStatusFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("meterTestStatusMaster");
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<MeterTestStatusFormModel>({
    id: id ?? initialData?.id,
    code: initialData?.meterTestStatusCode || initialData?.code || "",
    meterTestStatusCode: initialData?.meterTestStatusCode || initialData?.code || "",
    meterTestStatus: initialData?.meterTestStatus || "",
    isActive: initialData?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback(
    (field: string, value: string): string => {
      const trimmed = (value || "").trim();
      if (field === "code" || field === "meterTestStatusCode") {
        if (!trimmed) return t("validation.codeRequired");
        if (trimmed.length < 2) return t("validation.codeMinLength");
        if (trimmed.length > 15) return t("validation.codeMaxLength");
        if (!ALPHANUMERIC_ONLY_REGEX.test(trimmed)) {
          return t("validation.codeInvalid");
        }
      }
      if (field === "meterTestStatus") {
        if (!trimmed) return t("validation.nameRequired");
        if (trimmed.length < 2) return t("validation.nameMinLength");
        if (trimmed.length > 30) return t("validation.nameMaxLength");
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

    const nameErr = validateField("meterTestStatus", formData.meterTestStatus || "");
    if (nameErr) newErrors.meterTestStatus = nameErr;

    setErrors(newErrors);
    setTouched({ code: true, meterTestStatus: true });
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  const handleBlur = useCallback(
    (field: string) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const val = field === "code" ? formData.code || "" : formData.meterTestStatus || "";
      const err = validateField(field, val);
      setErrors((prev) => ({ ...prev, [field]: err }));
    },
    [formData, validateField]
  );

  const handleCodeChange = useCallback(
    (value: string) => {
      const val = value.replace(ALPHANUMERIC_ONLY_SANITIZE, "").toUpperCase().slice(0, 15);
      setFormData((prev) => ({ ...prev, code: val, meterTestStatusCode: val }));
      if (touched.code) {
        setErrors((prev) => ({ ...prev, code: validateField("code", val) }));
      }
    },
    [touched.code, validateField]
  );

  const handleStatusNameChange = useCallback(
    (value: string) => {
      const val = value.replace(ALPHANUMERIC_WITH_SPACES_SANITIZE, "").slice(0, 30);
      setFormData((prev) => ({ ...prev, meterTestStatus: val }));
      if (touched.meterTestStatus) {
        setErrors((prev) => ({ ...prev, meterTestStatus: validateField("meterTestStatus", val) }));
      }
    },
    [touched.meterTestStatus, validateField]
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
        router.push(`/${locale}/water-bill/meterteststatusmaster`);
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
          ? await updateMeterTestStatusAction(formData)
          : await createMeterTestStatusAction(formData);

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
    handleStatusNameChange,
    handleToggleStatus,
    handleBlur,
    handleSubmit,
    handleCancel,
  };
}
