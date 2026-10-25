"use client";

import React, { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import {
  createAssetSubTypeOfUseAction,
  updateAssetSubTypeOfUseAction,
} from "@/app/[locale]/assets/configuration/master-data/type-of-use/action";
import { AssetSubTypeOfUseFormModel, AssetSubTypeOfUse } from "@/types/asset-masters/type-of-use.types";

import { validateSubTypeOfUseForm, sanitizeSubTypeOfUseFieldValue } from "./validation";
import { getErrorMessage, isDeactivateBlockedMessage } from "./error-mapping";


interface UseSubTypeOfUseFormProps {
  id: number | null;
  initialData?: AssetSubTypeOfUse;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function useSubTypeOfUseForm({
  id,
  initialData,
  onSuccess = () => {},
  onCancel = () => {},
}: UseSubTypeOfUseFormProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("assetTypeOfUse");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  const urlTypeOfUseId = (() => {
    const value = sp.get("selectedTypeOfUseId");
    return value && /^\d+$/.test(value) ? Number(value) : 0;
  })();

  const [formData, setFormData] = useState<AssetSubTypeOfUseFormModel>({
    id: id ?? initialData?.id,
    isActive: initialData?.isActive ?? true,
    typeOfUseId: initialData?.typeOfUseId ?? urlTypeOfUseId,
    description: initialData?.description ?? "",
    searchSequence: initialData?.searchSequence ?? "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AssetSubTypeOfUseFormModel, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = useCallback(
    (data: AssetSubTypeOfUseFormModel): Partial<Record<keyof AssetSubTypeOfUseFormModel, string>> => {
      return validateSubTypeOfUseForm(data, t, isEdit);
    },
    [t, isEdit]
  );

  const showError = useCallback(
    (field: keyof AssetSubTypeOfUseFormModel): boolean =>
      (submittedOnce || touched[field]) && !!errors[field],
    [submittedOnce, touched, errors]
  );

  const parseSubTypeVal = useCallback((name: string, value: string): string | number => {
    if (name === "typeOfUseId") return Number(value) || 0;
    if (name === "searchSequence") {
      const sanitized = value.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
      if (sanitized === "") return "";
      const numVal = Number(sanitized);
      return numVal > 999 ? 999 : numVal;
    }
    return sanitizeSubTypeOfUseFieldValue(name, value);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    const val = parseSubTypeVal(name, value);

    setFormData((p) => ({
      ...p,
      [name]: val,
    }));
  }, [parseSubTypeVal]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));

    const sanitizedValue = parseSubTypeVal(name, value);

    const updatedFormData = {
      ...formData,
      [name]: sanitizedValue,
    };
    setFormData(updatedFormData);

    const fieldErrors = validate(updatedFormData);
    setErrors((p) => {
      const newErrors = { ...p };
      const fieldName = name as keyof AssetSubTypeOfUseFormModel;
      if (fieldErrors[fieldName]) {
        newErrors[fieldName] = fieldErrors[fieldName];
      } else {
        delete newErrors[fieldName];
      }
      return newErrors;
    });
  }, [formData, parseSubTypeVal, validate]);

  const mapApiError = useCallback((result: { statusCode?: number; message?: string; validationErrors?: Record<string, string | string[]> }) => {
    if (result.validationErrors) {
      for (const raw of Object.values(result.validationErrors)) {
        const val = Array.isArray(raw) ? raw[0] : raw;
        if (val) {
          const cleanVal = val.replace(/\.$/, "");
          return getErrorMessage(cleanVal, result.statusCode, t, tCommon, t("subtype.title"));
        }
      }
    }
    return getErrorMessage(result.message, result.statusCode, t, tCommon, t("subtype.title"));
  }, [t, tCommon]);

  const [open, setOpen] = useState(true);

  const closeAndRoute = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      const params = sp.toString() ? `?${sp.toString()}` : "";
      router.push(`/${locale}/assets/configuration/master-data/type-of-use${params}`);
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

    if (Object.keys(v).length) {
      toast.error(t("errors.fixErrors", { default: "Please fix validation errors" }));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = isEdit
        ? await updateAssetSubTypeOfUseAction(formData)
        : await createAssetSubTypeOfUseAction(formData);

      if (!result.success) {
        const apiErrorText = [
          result.message ?? "",
          ...Object.values(result.validationErrors ?? {}).map((value) =>
            Array.isArray(value) ? value.join(" ") : String(value)
          ),
        ].join(" ");

        let handled = false;
        if (/AssetSubTypeOfUse_Description_Duplicate/i.test(apiErrorText) || (/name|description/i.test(apiErrorText) && /already exist/i.test(apiErrorText)) || /same details already exists/i.test(apiErrorText)) {
          setErrors((p) => ({ ...p, description: t("apiErrors.AssetSubTypeOfUse_Description_Duplicate", { default: "Sub-Type Name already exists" }) }));
          setTouched((p) => ({ ...p, description: true }));
          handled = true;
        }

        if (handled) {
          toast.error(t("apiErrors.AssetSubTypeOfUse_Description_Duplicate", { default: "Sub-Type Name already exists" }));
          return;
        }

        const errorMessage = mapApiError(result);
        if (isDeactivateBlockedMessage(result.message)) {
          setErrors((p) => ({ ...p, isActive: errorMessage }));
        }
        toast.error(errorMessage);
        return;
      }

      const successMessage = isEdit
        ? t("messages.subTypeUpdated", { default: "Sub-Type updated successfully" })
        : t("messages.subTypeCreated", { default: "Sub-Type created successfully" });
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

