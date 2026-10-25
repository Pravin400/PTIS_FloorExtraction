"use client";

import React, { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import {
  createAssetTypeOfUseAction,
  updateAssetTypeOfUseAction,
} from "@/app/[locale]/assets/configuration/master-data/type-of-use/action";
import { AssetTypeOfUseFormModel, AssetTypeOfUse } from "@/types/asset-masters/type-of-use.types";
import { validateTypeOfUseForm, sanitizeTypeOfUseFieldValue } from "./validation";
import { getErrorMessage, isDeactivateBlockedMessage } from "./error-mapping";


interface UseTypeOfUseFormProps {
  id: number | null;
  initialData?: AssetTypeOfUse;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialTypes?: { id: number; name: string }[];
  onCategoryChange?: (categoryId: number) => void;
}

export function useTypeOfUseForm({
  id,
  initialData,
  onSuccess = () => {},
  onCancel = () => {},
  initialTypes = [],
  onCategoryChange,
}: UseTypeOfUseFormProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("assetTypeOfUse");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const parseQueryId = (value: string | null): number =>
    value && /^\d+$/.test(value) ? Number(value) : 0;
  const urlGroupId = parseQueryId(sp.get("selectedGroupId"));
  const urlCategoryId = parseQueryId(sp.get("assetCategoryId"));

  const [formData, setFormData] = useState<AssetTypeOfUseFormModel>({
    id: id ?? initialData?.id,
    isActive: initialData?.isActive ?? true,
    assetCategoryId: initialData?.assetCategoryId ?? urlCategoryId,
    assetTypeId: initialData?.assetTypeId ?? 0,
    typeOfUseGroupId: initialData?.typeOfUseGroupId ?? urlGroupId,
    typeOfUseCode: initialData?.typeOfUseCode ?? "",
    description: initialData?.description ?? "",
    type: initialData?.type ?? "",
    searchSequence: initialData?.searchSequence ?? "",
  });

  const types = initialTypes;
  const [errors, setErrors] = useState<Partial<Record<keyof AssetTypeOfUseFormModel, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = useCallback(
    (data: AssetTypeOfUseFormModel): Partial<Record<keyof AssetTypeOfUseFormModel, string>> => {
      return validateTypeOfUseForm(data, t, isEdit);
    },
    [t, isEdit]
  );

  const showError = useCallback(
    (field: keyof AssetTypeOfUseFormModel): boolean =>
      (submittedOnce || touched[field]) && !!errors[field],
    [submittedOnce, touched, errors]
  );

  const parseVal = (name: string, value: string) => {
    if (["assetCategoryId", "assetTypeId", "typeOfUseGroupId"].includes(name)) {
      const num = Number(value);
      return Number.isFinite(num) && num > 0 ? num : 0;
    }
    if (name === "searchSequence") {
      const sanitized = value.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
      if (sanitized === "") return "";
      const numVal = Number(sanitized);
      return numVal > 999 ? 999 : numVal;
    }
    return sanitizeTypeOfUseFieldValue(name, value);
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    const val = parseVal(name, value);
    if (name === "assetCategoryId") {
      const categoryId = Number(val);
      setFormData((p) => ({ ...p, assetCategoryId: categoryId, assetTypeId: 0 }));
      onCategoryChange?.(categoryId);
      return;
    }
    setFormData((p) => ({ ...p, [name]: val }));
  }, [onCategoryChange]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));
    const val = parseVal(name, value);
    const updated = { ...formData, [name]: val };
    setFormData(updated);
    const fieldErrors = validate(updated);
    setErrors((p) => {
      const newErrors = { ...p };
      const fieldName = name as keyof AssetTypeOfUseFormModel;
      if (fieldErrors[fieldName]) newErrors[fieldName] = fieldErrors[fieldName];
      else delete newErrors[fieldName];
      return newErrors;
    });
  }, [formData, validate]);

  const mapApiError = useCallback((result: { statusCode?: number; message?: string; validationErrors?: Record<string, string | string[]> }) => {
    if (result.validationErrors) {
      for (const raw of Object.values(result.validationErrors)) {
        const val = Array.isArray(raw) ? raw[0] : raw;
        if (val) {
          const cleanVal = val.replace(/\.$/, "");
          return getErrorMessage(cleanVal, result.statusCode, t, tCommon, t("type.title"));
        }
      }
    }
    return getErrorMessage(result.message, result.statusCode, t, tCommon, t("type.title"));
  }, [t, tCommon]);

  const [open, setOpen] = useState(true);

  const closeAndRoute = useCallback((updatedGroupId?: number) => {
    setOpen(false);
    setTimeout(() => {
      const params = new URLSearchParams(sp.toString());
      params.delete("assetCategoryId");
      if (updatedGroupId !== undefined) {
        params.set("selectedGroupId", String(updatedGroupId));
        params.set("typePn", "1");
      }
      const paramsStr = params.toString() ? `?${params.toString()}` : "";
      router.push(`/${locale}/assets/configuration/master-data/type-of-use${paramsStr}`);
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
      toast.error(t("errors.fixErrors"));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = isEdit
        ? await updateAssetTypeOfUseAction(formData)
        : await createAssetTypeOfUseAction(formData);

      if (!result.success) {
        const apiErrorText = [
          result.message ?? "",
          ...Object.values(result.validationErrors ?? {}).map((value) =>
            Array.isArray(value) ? value.join(" ") : String(value)
          ),
        ].join(" ");

        let handled = false;
        const isAmbiguousDuplicate = result.statusCode === 409 && /same details already exists/i.test(apiErrorText);

        if (/AssetTypeOfUse_TypeOfUseCode_Duplicate/i.test(apiErrorText) || (/code/i.test(apiErrorText) && /already exist/i.test(apiErrorText)) || isAmbiguousDuplicate) {
          setErrors((previous) => ({ ...previous, typeOfUseCode: t("apiErrors.AssetTypeOfUse_TypeOfUseCode_Duplicate", { default: "Type of Use Code already exists" }) }));
          setTouched((previous) => ({ ...previous, typeOfUseCode: true }));
          handled = true;
        }
        
        if (/AssetTypeOfUse_Description_Duplicate/i.test(apiErrorText) || (/name|description/i.test(apiErrorText) && /already exist/i.test(apiErrorText)) || isAmbiguousDuplicate) {
          setErrors((previous) => ({ ...previous, description: t("apiErrors.AssetTypeOfUse_Description_Duplicate", { default: "Type of Use Name already exists" }) }));
          setTouched((previous) => ({ ...previous, description: true }));
          handled = true;
        }

        if (handled) return;

        const errorMessage = mapApiError(result);
        if (isDeactivateBlockedMessage(result.message)) {
          setErrors((p) => ({ ...p, isActive: errorMessage }));
        }
        toast.error(errorMessage);
        return;
      }

      const successMessage = isEdit
        ? t("messages.typeUpdated", { default: "Type updated successfully" })
        : t("messages.typeCreated", { default: "Type created successfully" });
      toast.success(successMessage || result.message);
      onSuccess();
      closeAndRoute(formData.typeOfUseGroupId);
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
    types,
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




