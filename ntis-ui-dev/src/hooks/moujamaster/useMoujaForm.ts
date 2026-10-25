"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import {
  createMoujaAction,
  updateMoujaAction,
} from "@/app/[locale]/property-tax/moujamaster/action";
import { MoujaFormModel, Mouja } from "@/types/mouja.types";
import { 
  CODE_WITH_DECIMAL_SANITIZE, 
  DESCRIPTION_SANITIZE, 
  validateForm, 
  commonValidations 
} from "@/lib/utils/validation";
import { MOUJA_NO_MAX, MOUJA_NAME_MAX } from "@/components/modules/property-tax/mouja-master/constants";

interface UseMoujaFormProps {
  id: number | null;
  initialData?: Mouja;
  onSuccess: () => void;
  onCancel: () => void;
}

export function useMoujaForm({
  id,
  initialData,
  onSuccess,
  onCancel,
}: UseMoujaFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("mouja.moujaMaster");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(id);

  const moujaLabel = useAliasLabel("Mouja", t("aliasFallback.entity"));
  const values = useMemo(
    () => ({ mouja: moujaLabel, entity: moujaLabel }),
    [moujaLabel]
  );

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
      const tWithValues = (key: string, v?: Record<string, string | number | Date>) => t(key, { ...values, ...v });
      const schema = {
        moujaNo: commonValidations.masterCodeWithDecimal(tWithValues, MOUJA_NO_MAX, {
          required: 'form.validation.moujaNoRequired',
          format: 'form.validation.moujaNoFormat',
          maxLength: 'form.validation.moujaNoMaxLength',
        }),
        moujaName: commonValidations.masterDescription(tWithValues, MOUJA_NAME_MAX, {
          required: 'form.validation.moujaNameRequired',
          format: 'form.validation.moujaNameFormat',
          maxLength: 'form.validation.moujaNameMaxLength',
        }),
        isActive: commonValidations.masterActiveStatus(tWithValues, isEdit, 'form.validation.mustBeActive'),
      };
      return validateForm(data, schema);
    },
    [t, isEdit, values]
  );

  const showError = useCallback((field: keyof MoujaFormModel): boolean =>
    (submittedOnce || touched[field]) && !!errors[field],
    [submittedOnce, touched, errors]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    
    let sanitizedValue = value;
    if (name === "moujaName") {
      sanitizedValue = value.replace(DESCRIPTION_SANITIZE, "");
      if (sanitizedValue.length > MOUJA_NAME_MAX) {
        sanitizedValue = sanitizedValue.substring(0, MOUJA_NAME_MAX);
      }
    } else if (name === "moujaNo") {
      sanitizedValue = value.replace(CODE_WITH_DECIMAL_SANITIZE, "");
      if (sanitizedValue.length > MOUJA_NO_MAX) {
        sanitizedValue = sanitizedValue.substring(0, MOUJA_NO_MAX);
      }
    }

    setFormData((p) => ({
      ...p,
      [name]: sanitizedValue,
    }));
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));

    const updatedFormData = {
      ...formData,
      [name]: value,
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

  const mapApiError = useCallback((result: { statusCode?: number; message?: string }) => {
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
      if (msg.includes("duplicate") || msg.includes("already exists")) {
        return t("apiErrors.duplicateRecord", values);
      }
      return result.message || t("apiErrors.invalidData", values);
    }
    
    if (code >= 500) return tCommon("errors.serverError");
    return result.message || t("apiErrors.operationFailed", values);
  }, [t, tCommon, values]);

  const [open, setOpen] = useState(true);
  const [, startTransition] = React.useTransition();

  const closeAndRoute = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      startTransition(() => {
        router.push(`/${locale}/property-tax/moujamaster`);
      });
    }, 400); // Increased delay for smoother animation
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

    setIsSubmitting(true);
    try {
      const result = isEdit
        ? await updateMoujaAction(formData)
        : await createMoujaAction(formData);

      if (!result.success) {
        toast.error(mapApiError(result));
        return;
      }

      toast.success(isEdit
        ? t("success.updated", { code: formData.moujaNo, ...values })
        : t("success.created", { code: formData.moujaNo, ...values })
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
    moujaLabel,
  };
}
