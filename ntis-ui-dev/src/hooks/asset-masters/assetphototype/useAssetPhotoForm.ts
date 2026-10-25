"use client";

import React, { useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { parseReferenceBlockedMessage } from "@/lib/utils/asset-utils/shared-error-mapping";
import {
  createAssetPhotoAction,
  updateAssetPhotoAction,
} from "@/app/[locale]/assets/configuration/master-data/asset-photo-type/action";
import { AssetPhotoTypeFormModel, AssetPhotoType } from "@/types/asset-masters/asset-photo-type.types";
import {
  sanitizeFieldValue,
  validateAssetPhotoForm,
  mapAssetPhotoApiError,
} from "./validation";

interface UseAssetPhotoFormProps {
  id: number | null;
  initialData?: AssetPhotoType;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function useAssetPhotoForm({
  id,
  initialData,
  onSuccess = () => { },
  onCancel = () => { },
}: UseAssetPhotoFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("assetPhotoType");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [formData, setFormData] = useState<AssetPhotoTypeFormModel>({
    id: id ?? initialData?.id,
    photoTypeCode: initialData?.photoTypeCode ?? "",
    photoTypeName: initialData?.photoTypeName ?? "",
    description: initialData?.description ?? "",
    displayOrder: initialData?.displayOrder ?? Number.NaN,
    isActive: initialData?.isActive ?? true,
    assetCategoryId: initialData?.assetCategoryId ?? null,
    assetTypeId: initialData?.assetTypeId ?? null,
    isRequired: initialData?.isRequired ?? false,
    isSubUnit: initialData?.isSubUnit ?? false,
  });
  const [displayOrderValue, setDisplayOrderValue] = useState<string>(
    initialData?.displayOrder?.toString() ?? ""
  );
  const [errors, setErrors] = useState<Partial<Record<keyof AssetPhotoTypeFormModel, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const validate = useCallback(
    (data: AssetPhotoTypeFormModel): Partial<Record<keyof AssetPhotoTypeFormModel, string>> => {
      return validateAssetPhotoForm(data, t, isEdit);
    },
    [t, isEdit]
  );
  const showError = useCallback((field: keyof AssetPhotoTypeFormModel): boolean =>
    (submittedOnce || touched[field]) && !!errors[field],
    [submittedOnce, touched, errors]
  );
  const pushCategoryQuery = useCallback((assetCategoryId: number | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (assetCategoryId && assetCategoryId > 0) {
      params.set("assetCategoryId", String(assetCategoryId));
    } else {
      params.delete("assetCategoryId");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "displayOrder") {
      const val = value.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "").substring(0, 5);
      setDisplayOrderValue(val);
      setFormData(p => ({ ...p, displayOrder: val === "" ? Number.NaN : Number(val) }));
    } else {
      setFormData(p => ({ ...p, [name]: sanitizeFieldValue(name, value) }));
    }
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(p => ({ ...p, [name]: true }));
    let sanitized = sanitizeFieldValue(name, value);
    if (name === "displayOrder") {
      sanitized = value.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "").substring(0, 5);
      setDisplayOrderValue(sanitized);
    }
    const updated = { ...formData, [name]: name === "displayOrder" ? (sanitized === "" ? Number.NaN : Number(sanitized)) : sanitized };
    setFormData(updated);
    const fieldErrors = validate(updated);
    setErrors(p => {
      const err = { ...p };
      const field = name as keyof AssetPhotoTypeFormModel;
      if (fieldErrors[field]) err[field] = fieldErrors[field]; else delete err[field];
      return err;
    });
  }, [formData, validate]);

  const [open, setOpen] = useState(true);

  const closeAndRoute = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      router.push(`/${locale}/assets/configuration/master-data/asset-photo-type`);
    }, 400);
  }, [router, locale]);

  const handleCancel = useCallback(() => {
    onCancel();
    closeAndRoute();
  }, [onCancel, closeAndRoute]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedOnce(true);
    const v = validate(formData);
    setErrors(v);
    if (Object.keys(v).length) return;
    setIsSubmitting(true);
    try {
      const res = isEdit ? await updateAssetPhotoAction(formData) : await createAssetPhotoAction(formData);
      if (!res.success) {
        if (res.validationErrors && Object.keys(res.validationErrors).length > 0) {
          const fieldErrors: Partial<Record<keyof AssetPhotoTypeFormModel, string>> = {};
          for (const [key, val] of Object.entries(res.validationErrors)) {
            const rawError = Array.isArray(val) ? val[0] : val;
            const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
            
            // i18n mapping for duplicate check (handles Code only, Name only, and Both)
            let finalError = rawError;
            if (rawError.toLowerCase().includes("already exists") || rawError.toLowerCase().includes("duplicate")) {
              if (camelKey === "photoTypeCode") {
                finalError = t("apiErrors.AssetPhotoType_PhotoTypeCode_Duplicate") || rawError;
              } else if (camelKey === "photoTypeName") {
                finalError = t("apiErrors.AssetPhotoType_PhotoTypeName_Duplicate") || rawError;
              } else {
                finalError = t("apiErrors.duplicateRecord") || rawError;
              }
            }
            
            fieldErrors[camelKey as keyof AssetPhotoTypeFormModel] = finalError;
          }
          setErrors(prev => ({ ...prev, ...fieldErrors }));
          // Show the first field error in the toast so the user sees a message instead of just red fields
          toast.error(Object.values(fieldErrors)[0] ?? mapAssetPhotoApiError(res, t, tCommon));
          return;
        }
        const errorMessage = mapAssetPhotoApiError(res, t, tCommon);
        if (parseReferenceBlockedMessage(res.message)?.operation === "deactivate") {
          setErrors(prev => ({ ...prev, isActive: errorMessage }));
        }
        toast.error(errorMessage);
        return;
      }
      const successMessage = t(isEdit ? "success.updated" : "success.created", { code: formData.photoTypeCode });
      toast.success(successMessage || res.message);
      onSuccess();
      closeAndRoute();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = useCallback((checked: boolean) => {
    setIsActive(checked);
    setFormData(p => ({ ...p, isActive: checked }));
    setErrors(p => ({ ...p, isActive: "" }));
  }, []);

  const handleToggleRequired = useCallback((checked: boolean) => setFormData(p => ({ ...p, isRequired: checked })), []);
  const handleToggleSubUnit = useCallback((checked: boolean) => setFormData(p => ({ ...p, isSubUnit: checked })), []);

  const handleSelectChange = useCallback((name: string, value: string) => {
    const parsed = Number(value);
    const numVal = value && Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    setFormData(p => {
      const updated = name === "assetCategoryId" 
        ? { ...p, assetCategoryId: numVal, assetTypeId: null }
        : { ...p, [name]: numVal };
      
      const errs = validate(updated);
      setErrors(prev => {
        const err = { ...prev };
        if (name === "assetCategoryId") {
          err.assetCategoryId = errs.assetCategoryId;
          err.assetTypeId = errs.assetTypeId;
        } else {
          const field = name as keyof AssetPhotoTypeFormModel;
          if (errs[field]) err[field] = errs[field]; else delete err[field];
        }
        return err;
      });
      return updated;
    });

    if (name === "assetCategoryId") {
      pushCategoryQuery(numVal);
    }
  }, [pushCategoryQuery, validate]);

  return {
    formData,
    displayOrderValue,
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
    handleToggleRequired,
    handleToggleSubUnit,
    handleCancel,
    showError,
    t,
    tCommon,
    isEdit,
  };
}
