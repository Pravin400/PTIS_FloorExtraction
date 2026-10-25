"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { sanitizeFieldValue, validateAssetCategoryForm } from "./validation";
import { useAssetCategorySubmit } from "./useAssetCategorySubmit";
import type { AssetCategoryFormModel } from "@/types/asset-masters/asset-category.types";

export interface UseAssetCategoryFormProps {
  initialData?: AssetCategoryFormModel | null;
}

export function useAssetCategoryForm({ initialData }: UseAssetCategoryFormProps) {
  const router = useRouter();
  const isEdit = initialData?.id != null;

  const [open, setOpen] = useState(true);
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const t = useTranslations("asset.configuration.masterData.form");
  const tCommon = useTranslations("common");
  const tNames = useTranslations("asset.masterNames");
  const locale = useLocale();

  const [formData, setFormData] = useState<AssetCategoryFormModel>(
    initialData ?? {
      id: undefined,
      code: "",
      name: "",
      description: "",
      isMovable: false,
      hasFloorDetails: false,
      hasInventory: false,
      isInventoryMandatory: false,
      hasLegalCompliance: false,
      valuationType: "",
      isActive: true,
    }
  );

  const [errors, setErrors] = useState<Partial<Record<keyof AssetCategoryFormModel, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleClose = useCallback(() => {
    setOpen(false);
    router.back();
  }, [router]);

  const validate = useCallback((data: AssetCategoryFormModel) => {
    return validateAssetCategoryForm(data, t, isEdit);
  }, [t, isEdit]);

  const showError = useCallback((field: keyof AssetCategoryFormModel) => {
    return (submittedOnce || touched[field]) && !!errors[field];
  }, [submittedOnce, touched, errors]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const sanitized = sanitizeFieldValue(name, value);

    setFormData((p) => ({ ...p, [name]: sanitized }));
    setErrors((p) => {
      const err = { ...p };
      delete err[name as keyof AssetCategoryFormModel];
      return err;
    });
  }, []);

  const handleCheckboxChange = useCallback((name: string, checked: boolean) => {
    setFormData((p) => {
      const updated = { ...p, [name]: checked };
      if (name === "hasInventory" && !checked) {
        updated.isInventoryMandatory = false;
      }
      if (name === "isMovable" && checked) {
        updated.hasFloorDetails = false;
      }
      if (name === "hasFloorDetails" && checked) {
        updated.isMovable = false;
      }
      return updated;
    });
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));

    const sanitized = sanitizeFieldValue(name, value);
    const updated = { ...formData, [name]: sanitized };
    setFormData(updated);

    const fieldErrors = validate(updated);
    setErrors((p) => {
      const err = { ...p };
      const field = name as keyof AssetCategoryFormModel;
      if (fieldErrors[field]) err[field] = fieldErrors[field]; else delete err[field];
      return err;
    });
  }, [formData, validate]);

  const { handleSubmit, isSubmitting } = useAssetCategorySubmit({
    isEdit,
    locale,
    formData,
    validate,
    setErrors,
    setTouched,
    setSubmittedOnce,
    setOpen,
    t,
    tCommon,
  });

  const handleToggleStatus = useCallback((checked?: boolean) => {
    setFormData((p) => ({ ...p, isActive: checked !== undefined ? checked : !p.isActive }));
    setErrors((p) => ({ ...p, isActive: "" }));
  }, []);

  return {
    isEdit,
    open,
    handleClose,
    formData,
    errors,
    showError,
    handleChange,
    handleCheckboxChange,
    handleBlur,
    handleToggleStatus,
    handleSubmit,
    isSubmitting,
    t,
    tCommon,
    tNames,
  };
}

