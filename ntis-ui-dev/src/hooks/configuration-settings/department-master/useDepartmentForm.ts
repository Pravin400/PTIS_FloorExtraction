"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { saveDepartmentMasterAction } from "@/app/[locale]/configuration-settings/department-master/action";
import { DepartmentMaster, DepartmentMasterFormData } from "@/types/departmentMaster.types";
import { isAllZeros } from "@/lib/utils/validation-rules";
import {
  DEPARTMENT_CODE_REGEX,
  DEPARTMENT_TEXT_REGEX,
  DEPARTMENT_DESCRIPTION_REGEX,
  sanitizeDepartmentCode,
  sanitizeDepartmentText,
  sanitizeDescription
} from "@/lib/utils/department-validation";

interface UseDepartmentFormProps {
  initialOpen?: boolean;
  editingDepartment: DepartmentMaster | null;
  onSuccess?: () => void;
  onClose?: () => void;
}

export function useDepartmentForm({ initialOpen = true, editingDepartment, onSuccess, onClose }: UseDepartmentFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("departmentMaster");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(editingDepartment);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(initialOpen);

  const [formData, setFormData] = useState<DepartmentMasterFormData>({
    departmentCode: "",
    departmentName: "",
    departmentNameLocal: "",
    departmentDescription: "",
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (editingDepartment) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        departmentCode: editingDepartment.departmentCode || "",
        departmentName: editingDepartment.departmentName || "",
        departmentNameLocal: editingDepartment.departmentNameLocal || "",
        departmentDescription: editingDepartment.departmentDescription || "",
        isActive: editingDepartment.isActive,
      });
    } else {
      setFormData({
        departmentCode: "",
        departmentName: "",
        departmentNameLocal: "",
        departmentDescription: "",
        isActive: true,
      });
    }
  }, [editingDepartment]);

  const validate = useCallback((data: DepartmentMasterFormData) => {
    const newErrors: Record<string, string> = {};

    // ---------------- Department Code Validation ----------------
    const code = data.departmentCode?.trim() || "";
    if (!code) {
      newErrors.departmentCode = tCommon("validation.required");
    } else {
      if (code.length > 6) {
        newErrors.departmentCode = tCommon("validation.maxLength", { count: 6 });
      } else if (isAllZeros(code)) {
        newErrors.departmentCode = "Department Code cannot consist only of zeros";
      } else if (!DEPARTMENT_CODE_REGEX.test(code)) {
        newErrors.departmentCode = "Department Code must contain only alphanumeric characters, hyphens, and underscores (no spaces)";
      }
    }

    // ---------------- Department Name Validation ----------------
    const name = data.departmentName?.trim() || "";
    if (!name) {
      newErrors.departmentName = tCommon("validation.required");
    } else {
      if (name.length > 50) {
        newErrors.departmentName = tCommon("validation.maxLength", { count: 50 });
      } else if (!DEPARTMENT_TEXT_REGEX.test(name)) {
        newErrors.departmentName = "Department Name must contain only alphabets and spaces";
      }
    }

    // ---------------- Local Name Validation ----------------
    const nameLocal = data.departmentNameLocal?.trim() || "";
    if (nameLocal) {
      if (nameLocal.length > 50) {
        newErrors.departmentNameLocal = tCommon("validation.maxLength", { count: 50 });
      } else if (!DEPARTMENT_TEXT_REGEX.test(nameLocal)) {
        newErrors.departmentNameLocal = "Local Name must contain only alphabets and spaces";
      }
    }

    // ---------------- Description Validation ----------------
    const desc = data.departmentDescription?.trim() || "";
    if (desc) {
      if (desc.length > 100) {
        newErrors.departmentDescription = tCommon("validation.maxLength", { count: 100 });
      } else if (!DEPARTMENT_DESCRIPTION_REGEX.test(desc)) {
        newErrors.departmentDescription = "Description must contain only alphabets and spaces";
      }
    }

    return newErrors;
  }, [tCommon]);

  const closeAndRoute = useCallback(() => {
    setOpen(false);
    // Use transition for smoother navigation
    startTransition(() => {
      router.push(`/${locale}/configuration-settings/department-master`);
    });
  }, [router, locale]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    let sanitizedValue = value;
    if (name === "departmentCode") {
      sanitizedValue = sanitizeDepartmentCode(value);
    } else if (name === "departmentName" || name === "departmentNameLocal") {
      sanitizedValue = sanitizeDepartmentText(value, 50);
    } else if (name === "departmentDescription") {
      sanitizedValue = sanitizeDescription(value);
    }

    const updatedData = { ...formData, [name]: sanitizedValue };
    setFormData(updatedData);
    setTouched((p) => ({ ...p, [name]: true }));
    const v = validate(updatedData);
    setErrors(v);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));
    const v = validate(formData);
    setErrors(v);
  };

  const handleToggleStatus = () => {
    setFormData((p) => ({ ...p, isActive: !p.isActive }));
  };

  const handleCancel = useCallback(() => {
    if (onClose) onClose();
    closeAndRoute();
  }, [onClose, closeAndRoute]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedOnce(true);
    const v = validate(formData);
    setErrors(v);

    if (Object.keys(v).length > 0) {
      toast.error(tCommon("errors.fixValidation"));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = new FormData();
      if (isEdit && editingDepartment?.departmentId) {
        payload.append("departmentId", String(editingDepartment.departmentId));
      }
      payload.append("departmentCode", formData.departmentCode);
      payload.append("departmentName", formData.departmentName);
      payload.append("departmentNameLocal", formData.departmentNameLocal || "");
      payload.append("departmentIcon", "");
      payload.append("departmentDescription", formData.departmentDescription || "");
      payload.append("isActive", String(formData.isActive));

      const result = await saveDepartmentMasterAction(payload);
      if (result.success) {
        toast.success(result.message);
        if (onSuccess) onSuccess();
        startTransition(() => {
          router.refresh();
          closeAndRoute();
        });
      } else {
        toast.error(result.error || tCommon("errors.saveFailed"));
      }
    } catch (_error) {
      toast.error(tCommon("errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    errors,
    touched,
    submittedOnce,
    isSubmitting: isSubmitting || isPending,
    open,
    handleChange,
    handleBlur,
    handleToggleStatus,
    handleSubmit,
    handleCancel,
    isEdit,
    t,
    tCommon,
  };
}
