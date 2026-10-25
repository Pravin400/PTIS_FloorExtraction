"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createPropertyTypeAction,
  updatePropertyTypeAction,
} from "@/app/[locale]/property-tax/propertytype/action";
import { PropertyTypeFormModel } from "@/types/property-type.types";
import {
  CODE_SANITIZE,
  DESCRIPTION_SANITIZE,
} from "@/lib/utils/validation";
import {
  PROPERTY_DESCRIPTION_MAX,
  DESCRIPTION_ENGLISH_MAX,
  DESCRIPTION_ENGLISH_SANITIZE,
  TYPE_MAX,
  PROPERTY_TYPE_GROUP_MAX
} from "@/components/modules/property-tax/property-type-master/constants";

interface UsePropertyTypeFormHandlersProps {
  formData: PropertyTypeFormModel;
  setFormData: React.Dispatch<React.SetStateAction<PropertyTypeFormModel>>;
  setSearchSequenceValue: React.Dispatch<React.SetStateAction<string>>;
  setTouched: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof PropertyTypeFormModel, string>>>>;
  setIsActive: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  setSubmittedOnce: React.Dispatch<React.SetStateAction<boolean>>;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  validate: (data: PropertyTypeFormModel) => Partial<Record<keyof PropertyTypeFormModel, string>>;
  isEdit: boolean;
  locale: string;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  tCommon: (key: string) => string;
  wardLabel?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Hook for PropertyType form handlers
 * 
 * Handles:
 * - Form input change handlers
 * - Form blur handlers
 * - Submit logic with API calls
 * - Status toggle
 * - Navigation and cancel logic
 * 
 * @param props - Handler configuration
 * @returns Form handlers
 */
export function usePropertyTypeFormHandlers({
  formData,
  setFormData,
  setSearchSequenceValue,
  setTouched,
  setErrors,
  setIsActive,
  setIsSubmitting,
  setSubmittedOnce,
  setOpen,
  validate,
  isEdit,
  locale,
  t,
  tCommon,
  wardLabel,
  onSuccess,
  onCancel,
}: UsePropertyTypeFormHandlersProps) {
  const router = useRouter();
  const [, startTransition] = React.useTransition();

  const mapApiError = useCallback((result: { statusCode?: number; message?: string }) => {
    const ward = wardLabel || t("aliasFallback.ward");
    const msg = result.message?.toLowerCase() || "";
    if (msg.includes("cannot deactivate") || msg.includes("referenced in") || msg.includes("in use")) {
      return t("apiErrors.cannotDeactivateReferred", { ward });
    }

    const errorMap: Record<number, string> = {
      409: t("apiErrors.duplicateRecord"),
      404: t("apiErrors.notFound"),
      401: tCommon("errors.unauthorized"),
      403: tCommon("errors.unauthorized"),
    };

    const code = result.statusCode ?? 0;
    if (errorMap[code]) return errorMap[code];

    if (code === 400) {
      if (msg.includes("duplicate") || msg.includes("already exists")) {
        return t("apiErrors.duplicateRecord");
      }
      return result.message || t("apiErrors.invalidData");
    }

    if (code >= 500) return tCommon("errors.serverError");
    return result.message || t("apiErrors.operationFailed");
  }, [t, tCommon, wardLabel]);

  const closeAndRoute = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      startTransition(() => {
        router.push(`/${locale}/property-tax/propertytype`);
      });
    }, 400);
  }, [router, locale, setOpen]);

  const handleCancel = useCallback(() => {
    onCancel();
    closeAndRoute();
  }, [onCancel, closeAndRoute]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;

    let sanitizedValue = value;
    if (name === "descriptionEnglish") {
      sanitizedValue = value.replace(DESCRIPTION_ENGLISH_SANITIZE, "");
      if (sanitizedValue.length > DESCRIPTION_ENGLISH_MAX) {
        sanitizedValue = sanitizedValue.substring(0, DESCRIPTION_ENGLISH_MAX);
      }
    } else if (name === "propertyDescription" || name === "propertyTypeGroup") {
      sanitizedValue = value.replace(DESCRIPTION_SANITIZE, "");
      const maxLength = name === "propertyDescription" ? PROPERTY_DESCRIPTION_MAX : PROPERTY_TYPE_GROUP_MAX;
      if (sanitizedValue.length > maxLength) {
        sanitizedValue = sanitizedValue.substring(0, maxLength);
      }
    } else if (name === "type") {
      sanitizedValue = value.replace(CODE_SANITIZE, "");
      if (sanitizedValue.length > TYPE_MAX) {
        sanitizedValue = sanitizedValue.substring(0, TYPE_MAX);
      }
    }

    if (name === "searchSequence") {
      setSearchSequenceValue(value);
      setFormData((p) => ({
        ...p,
        searchSequence: value === "" ? 0 : Number(value),
      }));
      return;
    }

    setFormData((p) => ({
      ...p,
      [name]: sanitizedValue,
    }));
  }, [setFormData, setSearchSequenceValue]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));

    let sanitizedValue = value;
    if (name === "searchSequence" && value === "") {
      sanitizedValue = "0";
      setSearchSequenceValue("0");
    }

    const updatedFormData = {
      ...formData,
      [name]: name === "searchSequence" ? Number(sanitizedValue || 0) : sanitizedValue,
    };

    setFormData(updatedFormData);

    const fieldErrors = validate(updatedFormData);
    setErrors((p) => {
      const newErrors = { ...p };
      const fieldName = name as keyof PropertyTypeFormModel;

      if (fieldErrors[fieldName]) {
        newErrors[fieldName] = fieldErrors[fieldName];
      } else {
        delete newErrors[fieldName];
      }

      return newErrors;
    });
  }, [formData, validate, setFormData, setErrors, setTouched, setSearchSequenceValue]);

  const handleToggleStatus = useCallback((): void => {
    setIsActive((prev) => {
      const newValue = !prev;
      setFormData((p) => ({ ...p, isActive: newValue }));
      return newValue;
    });
  }, [setIsActive, setFormData]);

  const handleCategoryChange = useCallback((value: string): void => {
    const categoryId = value === "" ? 0 : Number(value);
    setFormData((p) => {
      const nextFormData = { ...p, propertyTypeCategoryId: categoryId };
      setErrors(validate(nextFormData));
      return nextFormData;
    });
    // Mark as touched for validation
    setTouched((p) => ({ ...p, propertyTypeCategoryId: true }));
  }, [validate, setFormData, setErrors, setTouched]);

  const handleTypeChange = useCallback((value: string): void => {
    setFormData((p) => {
      const nextFormData = { ...p, type: value };
      setErrors(validate(nextFormData));
      return nextFormData;
    });
    // Mark as touched for validation
    setTouched((p) => ({ ...p, type: true }));
  }, [validate, setFormData, setErrors, setTouched]);

  const handleSubmit = async (e: React.FormEvent): Promise<{ success: boolean; createdId?: number }> => {
    e.preventDefault();
    setSubmittedOnce(true);

    const v = validate(formData);
    setErrors(v);

    if (Object.keys(v).length) return { success: false };

    setIsSubmitting(true);
    try {
      const result = isEdit
        ? await updatePropertyTypeAction(formData)
        : await createPropertyTypeAction(formData);

      if (!result.success) {
        toast.error(mapApiError(result));
        return { success: false };
      }

      onSuccess();
      // Return createdId for add mode (from createPropertyTypeAction)
      const createdId = !isEdit && 'createdId' in result ? (result.createdId as number | undefined) : undefined;
      return { success: true, createdId };
    } catch {
      return { success: false };
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshAndClose = () => {
    startTransition(() => {
      router.refresh();
      closeAndRoute();
    });
  };

  return {
    handleChange,
    handleBlur,
    handleCategoryChange,
    handleTypeChange,
    handleSubmit,
    handleToggleStatus,
    handleCancel,
    refreshAndClose,
  };
}
