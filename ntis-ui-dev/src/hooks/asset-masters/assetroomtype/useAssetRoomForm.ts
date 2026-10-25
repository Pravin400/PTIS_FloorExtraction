"use client";

import React, { useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { parseReferenceBlockedMessage } from "@/lib/utils/asset-utils/shared-error-mapping";
import {
  createAssetRoomAction,
  updateAssetRoomAction,
} from "@/app/[locale]/assets/configuration/master-data/asset-room-type/action";
import { AssetRoomTypeFormModel, AssetRoomType } from "@/types/asset-masters/asset-room-type.types";
import {
  sanitizeFieldValue,
  validateAssetRoomForm,
  mapAssetRoomApiError,
} from "./validation";

interface UseAssetRoomFormProps {
  id: number | null;
  initialData?: AssetRoomType;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function useAssetRoomForm({
  id,
  initialData,
  onSuccess = () => { },
  onCancel = () => { },
}: UseAssetRoomFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("assetRoomType");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [formData, setFormData] = useState<AssetRoomTypeFormModel>({
    id: id ?? initialData?.id,
    roomTypeCode: initialData?.roomTypeCode ?? "",
    roomTypeName: initialData?.roomTypeName ?? "",
    description: initialData?.description ?? "",
    isActive: initialData?.isActive ?? true,
    assetCategoryId: initialData?.assetCategoryId ?? null,
    assetTypeId: initialData?.assetTypeId ?? null,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AssetRoomTypeFormModel, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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

  const validate = useCallback(
    (data: AssetRoomTypeFormModel): Partial<Record<keyof AssetRoomTypeFormModel, string>> => {
      return validateAssetRoomForm(data, t, isEdit);
    },
    [t, isEdit]
  );

  const showError = useCallback((field: keyof AssetRoomTypeFormModel): boolean =>
    (submittedOnce || touched[field]) && !!errors[field],
    [submittedOnce, touched, errors]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: sanitizeFieldValue(name, value) }));
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(p => ({ ...p, [name]: true }));
    const sanitized = sanitizeFieldValue(name, value);
    const updated = { ...formData, [name]: sanitized };
    setFormData(updated);
    const fieldErrors = validate(updated);
    setErrors(p => {
      const err = { ...p };
      const field = name as keyof AssetRoomTypeFormModel;
      if (fieldErrors[field]) err[field] = fieldErrors[field]; else delete err[field];
      return err;
    });
  }, [formData, validate]);

  const [open, setOpen] = useState(true);

  const closeAndRoute = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      router.push(`/${locale}/assets/configuration/master-data/asset-room-type`);
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
      const res = isEdit ? await updateAssetRoomAction(formData) : await createAssetRoomAction(formData);
      if (!res.success) {
        const errorMessage = mapAssetRoomApiError(res, t, tCommon);
        if (parseReferenceBlockedMessage(res.message)?.operation === "deactivate") {
          setErrors(prev => ({ ...prev, isActive: errorMessage }));
        }
        toast.error(errorMessage);
        return;
      }
      const successMessage = t(isEdit ? "success.updated" : "success.created", { code: formData.roomTypeCode });
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

  const handleSelectChange = useCallback((name: string, value: string) => {
    const parsed = Number(value);
    const numVal = value && Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    if (name === "assetCategoryId") {
      setFormData(p => {
        const updated = { ...p, assetCategoryId: numVal, assetTypeId: null };
        const errs = validate(updated);
        setErrors(prev => ({ ...prev, assetCategoryId: errs.assetCategoryId, assetTypeId: errs.assetTypeId }));
        return updated;
      });
      pushCategoryQuery(numVal);
    } else {
      setFormData(p => {
        const updated = { ...p, [name]: numVal };
        const errs = validate(updated);
        setErrors(prev => {
          const err = { ...prev };
          const field = name as keyof AssetRoomTypeFormModel;
          if (errs[field]) err[field] = errs[field]; else delete err[field];
          return err;
        });
        return updated;
      });
    }
  }, [validate, pushCategoryQuery]);

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
