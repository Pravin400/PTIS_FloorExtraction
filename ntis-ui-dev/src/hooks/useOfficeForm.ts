"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import {
  createOfficeAction,
  updateOfficeAction,
} from "@/app/[locale]/configuration-settings/office-master/action";
import { Office, OfficeFormModel } from "@/types/office.types";
import { officeValidations } from "@/lib/utils/validation";
import { formatDateToDDMMYYYY, formatDDMMYYYYToISO } from "@/lib/utils/format";


interface UseOfficeFormProps {
  officeId: number | null;
  initialData?: Office;
  onSuccess: () => void;
  onCancel: () => void;
}

export function useOfficeForm({
  officeId,
  initialData,
  onSuccess,
  onCancel,
}: UseOfficeFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("office");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(officeId);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const initialFormData: OfficeFormModel = {
    officeId: officeId ?? initialData?.officeId,
    officeCode: initialData?.officeCode ?? "",
    officeName: initialData?.officeName ?? "",
    type: initialData?.type ?? "",
    address: initialData?.address ?? "",
    city: initialData?.city ?? "",
    pincode: initialData?.pincode ?? "",
    phone: initialData?.phone ?? "",
    emailId: initialData?.emailId ?? "",
    establishedDate: initialData?.establishedDate 
      ? formatDateToDDMMYYYY(initialData.establishedDate) 
      : "",
    isActive: initialData?.isActive ?? true,
    updatedBy: undefined,
  };

  const [formData, setFormData] = useState<OfficeFormModel>(initialFormData);

  const [errors, setErrors] = useState<Partial<Record<keyof OfficeFormModel, string>>>(() => {
    return officeValidations.validate(initialFormData, t, isEdit, tCommon);
  });
  const [touched, setTouched] = useState<Partial<Record<keyof OfficeFormModel, boolean>>>({});
  const [open, setOpen] = useState(true);
  const isMounted = useRef(true);

  const validate = useCallback(
    (data: OfficeFormModel) => {
      const v = officeValidations.validate(data, t, isEdit, tCommon);
      setErrors(v);
      return v;
    },
    [t, isEdit, tCommon]
  );

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Apply input restrictions during typing/paste
    if (name === 'officeCode') {
      processedValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    } else if (name === 'officeName') {
      processedValue = value.replace(/[^A-Za-z0-9\s&-]/g, '').replace(/\s+/g, ' ').slice(0, 100);
    } else if (name === 'phone') {
      processedValue = value.replace(/[^0-9]/g, '').slice(0, 10);
    } else if (name === 'pincode') {
      processedValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    } else if (name === 'city') {
      processedValue = value.replace(/[^A-Za-z\s]/g, '').replace(/\s+/g, ' ').slice(0, 50);
    } else if (name === 'address') {
      processedValue = value.replace(/[^A-Za-z0-9,\-.\/\s]/g, '').replace(/\s+/g, ' ').slice(0, 250);
    } else if (name === 'establishedDate') {
      const digits = value.replace(/\D/g, '').slice(0, 8);
      let formatted = "";
      if (digits.length > 0) formatted += digits.slice(0, 2);
      if (digits.length > 2) formatted += "-" + digits.slice(2, 4);
      if (digits.length > 4) formatted += "-" + digits.slice(4, 8);
      processedValue = formatted;
    } else if (name === 'emailId') {
      processedValue = value.slice(0, 100);
    }

    setFormData((prev) => {
      const updated = { ...prev, [name]: processedValue };
      validate(updated);
      return updated;
    });
  }, [validate]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validate(formData);
  }, [formData, validate]);

  const closeAndRoute = useCallback(() => {
    setOpen(false);
    // Use router.push immediately to return to the list view
    router.push(`/${locale}/configuration-settings/office-master`);
    router.refresh();
  }, [router, locale]);

  const handleCancel = useCallback(() => {
    onCancel();
    closeAndRoute();
  }, [onCancel, closeAndRoute]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedOnce(true);

    const v = validate(formData);
    if (Object.keys(v).length > 0) return;

    setIsSubmitting(true);
    try {
      const submissionData = {
        ...formData,
        establishedDate: formatDDMMYYYYToISO(formData.establishedDate)
      };
      const result = isEdit ? await updateOfficeAction(submissionData) : await createOfficeAction(submissionData);
      if (result.success) {
        toast.success(isEdit ? t("success.updated") : t("success.created"));
        onSuccess();
        closeAndRoute();
      } else {
        if (result.errors) {
          setErrors((prev) => ({ ...prev, ...result.errors }));
        }
        toast.error(result.message || "Operation failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = useCallback((): void => {
    setFormData((prev) => {
      const updated = { ...prev, isActive: !prev.isActive };
      if (submittedOnce) validate(updated);
      return updated;
    });
  }, [submittedOnce, validate]);

  const showError = useCallback((field: keyof OfficeFormModel): boolean => {
    return Boolean((submittedOnce || touched[field]) && errors[field]);
  }, [submittedOnce, touched, errors]);

  return {
    formData,
    errors,
    isSubmitting: isSubmitting,
    isActive: formData.isActive,
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
