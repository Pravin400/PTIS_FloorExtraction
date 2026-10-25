"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import {
  createAssetGrievanceCategoryAction,
  updateAssetGrievanceCategoryAction,
} from "@/app/[locale]/assets/configuration/master-data/grievance-category-master/action";
import { AssetGrievanceCategoryFormModel, AssetGrievanceCategory } from "@/types/asset-masters/asset-grievance-category.types";
import {
  sanitizeCategoryField,
  validateGrievanceCategoryForm,
  mapGrievanceCategoryApiError,
  isDeactivateBlockedMessage,
  translateCategoryValidationError,
} from "./validation";

interface UseAssetGrievanceCategoryFormProps {
  id: number | null;
  initialData?: AssetGrievanceCategory;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function useAssetGrievanceCategoryForm({
  id,
  initialData,
  onSuccess = () => { },
  onCancel = () => { },
}: UseAssetGrievanceCategoryFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("assetGrievanceCategory");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [formData, setFormData] = useState<AssetGrievanceCategoryFormModel>({
    id: id ?? initialData?.id,
    grievanceTypeCode: initialData?.grievanceTypeCode ?? "",
    grievanceTypeName: initialData?.grievanceTypeName ?? "",
    grievanceTypeNameLocal: initialData?.grievanceTypeNameLocal ?? "",
    description: initialData?.description ?? "",
    targetTableName: initialData?.targetTableName ?? "",
    slaDays: initialData?.slaDays ?? null,
    codeFormat: initialData?.codeFormat ?? "",
    // Use null (not 0) as the sentinel for "not yet entered" so the required validator fires
    displaySequence: initialData?.displaySequence ?? (null as unknown as number),
    isActive: initialData?.isActive ?? true,
  });
  const [slaValue, setSlaValue] = useState<string>(
    initialData?.slaDays != null ? initialData.slaDays.toString() : ""
  );
  const [displaySequenceValue, setDisplaySequenceValue] = useState<string>(
    // Start blank for new records so the user must explicitly enter a value
    initialData?.displaySequence != null ? initialData.displaySequence.toString() : ""
  );
  const [errors, setErrors] = useState<Partial<Record<keyof AssetGrievanceCategoryFormModel, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = useCallback(
    (data: AssetGrievanceCategoryFormModel): Partial<Record<keyof AssetGrievanceCategoryFormModel, string>> => {
      return validateGrievanceCategoryForm(data, t, isEdit);
    },
    [t, isEdit]
  );

  const showError = useCallback((field: keyof AssetGrievanceCategoryFormModel): boolean =>
    (submittedOnce || touched[field]) && !!errors[field],
    [submittedOnce, touched, errors]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name === "slaDays") {
      const val = value.replace(/[^0-9]/g, "").substring(0, 4);
      setSlaValue(val);
      setFormData(p => ({ ...p, slaDays: val === "" ? null : Number(val) }));
    } else if (name === "displaySequence") {
      const val = value.replace(/[^0-9]/g, "").substring(0, 6);
      setDisplaySequenceValue(val);
      // Keep null sentinel when empty so validator fires displaySequenceReq
      setFormData(p => ({ ...p, displaySequence: val === "" ? (null as unknown as number) : Number(val) }));
    } else if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(p => ({ ...p, [name]: checked }));
    } else {
      setFormData(p => ({ ...p, [name]: sanitizeCategoryField(name, value) }));
    }
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched(p => ({ ...p, [name]: true }));
    let updated: AssetGrievanceCategoryFormModel;

    if (name === "slaDays") {
      const sanitized = value.replace(/[^0-9]/g, "").substring(0, 4);
      setSlaValue(sanitized);
      updated = { ...formData, slaDays: sanitized === "" ? null : Number(sanitized) };
    } else if (name === "displaySequence") {
      const sanitized = value.replace(/[^0-9]/g, "").substring(0, 6);
      setDisplaySequenceValue(sanitized);
      // Keep null sentinel when empty so validator fires displaySequenceReq
      updated = { ...formData, displaySequence: sanitized === "" ? (null as unknown as number) : Number(sanitized) };
    } else {
      const sanitized = sanitizeCategoryField(name, value);
      updated = { ...formData, [name]: sanitized };
    }

    setFormData(updated);
    const fieldErrors = validate(updated);
    setErrors(p => {
      const err = { ...p };
      const field = name as keyof AssetGrievanceCategoryFormModel;
      if (fieldErrors[field]) err[field] = fieldErrors[field]; else delete err[field];
      return err;
    });
  }, [formData, validate]);

  const [open, setOpen] = useState(true);

  const closeAndRoute = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      router.push(`/${locale}/assets/configuration/master-data/grievance-category-master`);
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
      const res = isEdit ? await updateAssetGrievanceCategoryAction(formData) : await createAssetGrievanceCategoryAction(formData);
      if (!res.success) {
        if (res.validationErrors && Object.keys(res.validationErrors).length > 0) {
          const fieldErrors: Partial<Record<keyof AssetGrievanceCategoryFormModel, string>> = {};
          for (const [key, val] of Object.entries(res.validationErrors)) {
            const rawError = Array.isArray(val) ? val[0] : val;
            fieldErrors[key as keyof AssetGrievanceCategoryFormModel] = translateCategoryValidationError(rawError, t);
          }
          setErrors(prev => ({ ...prev, ...fieldErrors }));
          // Show the first translated field error in the toast so the user sees
          // a localized message instead of the raw form.errors.* key
          toast.error(Object.values(fieldErrors)[0] ?? mapGrievanceCategoryApiError(res, t, tCommon));
          return;
        }
        const mappedError = mapGrievanceCategoryApiError(res, t, tCommon);

        const isDuplicate = res.statusCode === 409 || res.message?.toLowerCase().includes("already exists") || res.message?.toLowerCase().includes("duplicate");
        if (isDuplicate) {
          const lowerMsg = res.message?.toLowerCase() || "";
          const isCodeDupe = lowerMsg.includes("code");
          const isNameDupe = lowerMsg.includes("name");
          
          const codeSpecificMsg = t("apiErrors.AssetGrievanceCategory_GrievanceTypeCode_Duplicate") || t("form.errors.duplicateRecord") || "Record already exists";
          const nameSpecificMsg = t("apiErrors.AssetGrievanceCategory_CategoryName_Duplicate") || t("form.errors.duplicateName") || "Record already exists";

          if (isCodeDupe && !isNameDupe) {
            toast.error(codeSpecificMsg);
            setErrors(prev => ({ ...prev, grievanceTypeCode: codeSpecificMsg }));
          } else if (isNameDupe && !isCodeDupe) {
            toast.error(nameSpecificMsg);
            setErrors(prev => ({ ...prev, grievanceTypeName: nameSpecificMsg }));
          } else {
            toast.error(mappedError);
            setErrors(prev => ({
              ...prev,
              grievanceTypeCode: codeSpecificMsg,
              grievanceTypeName: nameSpecificMsg,
            }));
          }
          return;
        }

        if (isDeactivateBlockedMessage(res.message)) {
          setErrors(prev => ({ ...prev, isActive: mappedError }));
        }
        toast.error(mappedError);
        return;
      }
      const successMessage = t(isEdit ? "master.toast.updateSuccess" : "master.toast.createSuccess");
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
    setErrors(prev => ({ ...prev, isActive: "" }));
  }, []);



  return {
    formData,
    slaValue,
    displaySequenceValue,
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
