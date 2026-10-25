"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  createGeographyTypeAction,
  updateGeographyTypeAction,
} from "@/app/[locale]/water-bill/geography-type-master/action";
import { GeographyTypeFormModel, GeographyType } from "@/types/water-bill/geographyType.types";
import {
  CODE_SANITIZE,
  DESCRIPTION_SANITIZE,
  HAS_LETTER_REGEX,
  validateForm,
  commonValidations,
} from "@/lib/utils/validation";
import { CODE_MAX, GEOGRAPHY_TYPE_MAX } from "@/components/modules/water-bill/geography-type-master/constants";

interface UseGeographyTypeFormProps {
  id: number | null;
  initialData?: GeographyType;
  onSuccess: () => void;
  onCancel: () => void;
}

export function useGeographyTypeForm({
  id,
  initialData,
  onSuccess,
  onCancel,
}: UseGeographyTypeFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("geographyTypeMaster");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [formData, setFormData] = useState<GeographyTypeFormModel>({
    id: id ?? initialData?.id,
    geographyTypeCode: initialData?.geographyTypeCode ?? "",
    geographyType: initialData?.geographyType ?? "",
    levelNo: initialData?.levelNo ?? 0,
    isActive: initialData?.isActive ?? true,
  });

  const [levelNoValue, setLevelNoValue] = useState<string>(initialData?.levelNo?.toString() ?? "0");

  const [errors, setErrors] = useState<Partial<Record<keyof GeographyTypeFormModel, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = useCallback(
    (data: GeographyTypeFormModel): Partial<Record<keyof GeographyTypeFormModel, string>> => {
      const schema = {
        geographyTypeCode: commonValidations.masterCode(t, CODE_MAX, {
          required: "form.validation.codeRequired",
          format: "form.validation.codeFormat",
          maxLength: "form.validation.codeMaxLength",
        }),
        geographyType: commonValidations.masterDescription(t, GEOGRAPHY_TYPE_MAX, {
          required: "form.validation.geographyTypeRequired",
          format: "form.validation.geographyTypeFormat",
          maxLength: "form.validation.geographyTypeMaxLength",
        }),
        levelNo: commonValidations.masterSearchSequence(t, "form.validation.levelNoInvalid"),
        isActive: commonValidations.masterActiveStatus(t, isEdit, "form.validation.mustBeActive"),
      };
      return validateForm(data, schema);
    },
    [t, isEdit]
  );

  const showError = useCallback(
    (field: keyof GeographyTypeFormModel): boolean => (submittedOnce || touched[field]) && !!errors[field],
    [submittedOnce, touched, errors]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;

    let sanitizedValue = value;
    if (name === "geographyType") {
      sanitizedValue = value.replace(DESCRIPTION_SANITIZE, "");
      if (sanitizedValue.length > GEOGRAPHY_TYPE_MAX) {
        sanitizedValue = sanitizedValue.substring(0, GEOGRAPHY_TYPE_MAX);
      }
    } else if (name === "geographyTypeCode") {
      sanitizedValue = value.replace(CODE_SANITIZE, "");
      if (sanitizedValue.length > CODE_MAX) {
        sanitizedValue = sanitizedValue.substring(0, CODE_MAX);
      }
      sanitizedValue = sanitizedValue.toUpperCase();
    }

    if (name === "levelNo") {
      const sanitized = value.replace(/[^0-9]/g, "").substring(0, 3);
      setLevelNoValue(sanitized);
      setFormData((p) => ({
        ...p,
        levelNo: sanitized === "" ? 0 : Number(sanitized),
      }));
      return;
    }

    setFormData((p) => ({
      ...p,
      [name]: sanitizedValue,
    }));
  }, []);

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>): void => {
      const { name, value } = e.target;
      setTouched((p) => ({ ...p, [name]: true }));

      let sanitizedValue = value;
      if (name === "levelNo" && value === "") {
        sanitizedValue = "0";
        setLevelNoValue("0");
      }

      const updatedFormData = {
        ...formData,
        [name]: name === "levelNo" ? Number(sanitizedValue || 0) : sanitizedValue,
      };

      setFormData(updatedFormData);

      const fieldErrors = validate(updatedFormData);
      setErrors((p) => {
        const newErrors = { ...p };
        const fieldName = name as keyof GeographyTypeFormModel;

        if (fieldErrors[fieldName]) {
          newErrors[fieldName] = fieldErrors[fieldName];
        } else {
          delete newErrors[fieldName];
        }

        return newErrors;
      });
    },
    [formData, validate]
  );

  const mapApiError = useCallback(
    (result: { statusCode?: number; message?: string }) => {
      const errorMap: Record<number, string> = {
        409: t("apiErrors.duplicateRecord"),
        404: t("apiErrors.notFound"),
        401: tCommon("errors.unauthorized"),
        403: tCommon("errors.unauthorized"),
      };

      const code = result.statusCode ?? 0;
      if (errorMap[code]) return errorMap[code];

      if (code === 400) {
        const msg = result.message?.toLowerCase() || "";
        if (msg.includes("duplicate") || msg.includes("already exists")) {
          return t("apiErrors.duplicateRecord");
        }
        return result.message || t("apiErrors.invalidData");
      }

      if (code >= 500) return tCommon("errors.serverError");
      return result.message || t("apiErrors.operationFailed");
    },
    [t, tCommon]
  );

  const [open, setOpen] = useState(true);
  const [, startTransition] = React.useTransition();

  const closeAndRoute = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      startTransition(() => {
        router.push(`/${locale}/water-bill/geography-type-master`);
      });
    }, 400);
  }, [router, locale]);

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

    if (!HAS_LETTER_REGEX.test(formData.geographyTypeCode)) {
      toast.error(t("form.validation.codeNumbersOnlyNotAllowed"));
      return;
    }

    if (!HAS_LETTER_REGEX.test(formData.geographyType)) {
      toast.error(t("form.validation.geographyTypeNumbersOnlyNotAllowed"));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = isEdit
        ? await updateGeographyTypeAction(formData)
        : await createGeographyTypeAction(formData);

      if (!result.success) {
        toast.error(mapApiError(result));
        return;
      }

      toast.success(
        isEdit
          ? t("success.updated", { code: formData.geographyTypeCode })
          : t("success.created", { code: formData.geographyTypeCode })
      );

      onSuccess();
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
    levelNoValue,
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
