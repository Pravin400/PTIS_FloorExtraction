"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import {
  createDesignationAction,
  updateDesignationAction,
} from "@/app/[locale]/assets/configuration/master-data/designation-master/action";
import { DesignationFormModel, Designation } from "@/types/asset-masters/designation.types";
import {
  sanitizeFieldValue,
  validateDesignationForm,
  mapDesignationApiError,
  isDeactivateBlockedMessage,
} from "./validation";

interface UseDesignationFormProps {
  id: number | null;
  initialData?: Designation;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function useDesignationForm({
  id,
  initialData,
  onSuccess = () => { },
  onCancel = () => { },
}: UseDesignationFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("designation");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [formData, setFormData] = useState<DesignationFormModel>({
    id: id ?? initialData?.id,
    designationCode: initialData?.designationCode ?? "",
    designationName: initialData?.designationName ?? "",
    designationLocal: initialData?.designationLocal ?? "",
    designationDescription: initialData?.designationDescription ?? "",
    isActive: initialData?.isActive ?? true,
    owningDepartmentId: initialData?.owningDepartmentId ?? null,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof DesignationFormModel, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = useCallback(
    (data: DesignationFormModel): Partial<Record<keyof DesignationFormModel, string>> => {
      return validateDesignationForm(data, t, isEdit);
    },
    [t, isEdit]
  );

  const showError = useCallback((field: keyof DesignationFormModel): boolean =>
    (submittedOnce || touched[field]) && !!errors[field],
    [submittedOnce, touched, errors]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeFieldValue(name, value);
    setFormData((p) => ({
      ...p,
      [name]: sanitizedValue,
    }));
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));

    const sanitizedValue = sanitizeFieldValue(name, value);
    const updatedFormData = {
      ...formData,
      [name]: sanitizedValue,
    };

    setFormData(updatedFormData);

    const fieldErrors = validate(updatedFormData);
    setErrors((p) => {
      const newErrors = { ...p };
      const fieldName = name as keyof DesignationFormModel;

      if (fieldErrors[fieldName]) {
        newErrors[fieldName] = fieldErrors[fieldName];
      } else {
        delete newErrors[fieldName];
      }

      return newErrors;
    });
  }, [formData, validate]);

  const [open, setOpen] = useState(true);

  const closeAndRoute = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      router.push(`/${locale}/assets/configuration/master-data/designation-master`);
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

    setIsSubmitting(true);
    try {
      const result = isEdit
        ? await updateDesignationAction(formData)
        : await createDesignationAction(formData);

      if (!result.success) {
        const errorMessage = mapDesignationApiError(result, t, tCommon);
        if (isDeactivateBlockedMessage(result.message)) {
          setErrors((p) => ({ ...p, isActive: errorMessage }));
        }
        toast.error(errorMessage);
        return;
      }

      const successMessage = isEdit
        ? t("success.updated", { code: formData.designationCode })
        : t("success.created", { code: formData.designationCode });
      toast.success(successMessage || result.message);

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

  const handleSelectChange = useCallback((name: string, value: string): void => {
    const parsed = Number(value);
    const numericValue = value && Number.isInteger(parsed) && parsed > 0 ? parsed : null;

    setFormData((p) => {
      const updated = {
        ...p,
        [name]: numericValue,
      };

      const fieldErrors = validate(updated);
      setErrors((prev) => {
        const newErrors = { ...prev };
        const fieldName = name as keyof DesignationFormModel;

        if (fieldErrors[fieldName]) {
          newErrors[fieldName] = fieldErrors[fieldName];
        } else {
          delete newErrors[fieldName];
        }

        return newErrors;
      });

      return updated;
    });
  }, [validate]);

  return {
    formData,
    errors,
    isSubmitting,
    isActive,
    open,
    setOpen,
    handleChange,
    handleBlur,
    handleSelectChange,
    handleSubmit,
    handleToggleStatus,
    handleCancel,
    showError,
    t,
    tCommon,
    isEdit,
  };
}