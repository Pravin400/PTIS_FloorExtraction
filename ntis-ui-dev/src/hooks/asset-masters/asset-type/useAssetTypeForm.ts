"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { sanitizeFieldValue, validateAssetTypeForm } from "./validation";
import { useAssetTypeSubmit } from "./useAssetTypeSubmit";
import type { AssetTypeFormModel } from "@/types/asset-masters/asset-type.types";
import type { MasterDataGroup } from "@/types/asset-masters/master-data.types";

export interface UseAssetTypeFormProps {
  initialData?: AssetTypeFormModel | null;
  groups?: MasterDataGroup[];
}

export function useAssetTypeForm({ initialData, groups }: UseAssetTypeFormProps) {
  const router = useRouter();
  const isEdit = initialData?.id != null;

  const [open, setOpen] = useState(true);
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const t = useTranslations("asset.configuration.masterData.form");
  const tCommon = useTranslations("common");
  const tNames = useTranslations("asset.masterNames");
  const locale = useLocale();

  const [formData, setFormData] = useState<AssetTypeFormModel>(
    initialData ?? {
      id: undefined,
      code: "",
      name: "",
      typeNameLocal: "",
      group: "",
      allowUnitRegistration: false,
      allowRoomRegistration: false,
      isSubUnit: false,
      description: "",
      isActive: true,
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const categoryOptions = useMemo(() => {
    return (groups || [])
      .filter((g) => g.id !== "all" && (g.status !== "Inactive" || g.id === String(formData.group ?? "")))
      .map((g) => ({ label: g.name, value: g.id }));
  }, [groups, formData.group]);

  const handleClose = useCallback(() => {
    setOpen(false);
    router.back();
  }, [router]);

  const validate = useCallback((data: AssetTypeFormModel) => {
    return validateAssetTypeForm(data, t, isEdit);
  }, [t, isEdit]);

  const showError = useCallback((field: keyof AssetTypeFormModel) => {
    return (submittedOnce || touched[field]) && !!errors[field];
  }, [submittedOnce, touched, errors]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "isSubUnit" && e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
      setFormData((p) => ({ ...p, isSubUnit: (e.target as HTMLInputElement).checked }));
      return;
    }
    const sanitized = sanitizeFieldValue(name, value);

    setFormData((p) => ({ ...p, [name]: sanitized }));
    setErrors((p) => {
      const err = { ...p };
      delete err[name];
      return err;
    });
  }, []);

  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData((p) => {
      const updated = { ...p, [name]: value };
      const fieldErrors = validate(updated);
      setErrors((prev) => {
        const err = { ...prev };
        if (fieldErrors[name as keyof AssetTypeFormModel]) {
          err[name] = fieldErrors[name as keyof AssetTypeFormModel]!;
        } else {
          delete err[name];
        }
        return err;
      });
      return updated;
    });
  }, [validate]);

  const handleRadioChange = useCallback((value: string) => {
    setFormData((p) => {
      const updated = {
        ...p,
        allowUnitRegistration: value === "unit",
        allowRoomRegistration: value === "room",
      };
      const fieldErrors = validate(updated);
      setErrors((prev) => {
        const err = { ...prev };
        if (fieldErrors.registrationType) {
          err.registrationType = fieldErrors.registrationType;
        } else {
          delete err.registrationType;
        }
        return err;
      });
      return updated;
    });
  }, [validate]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));

    const sanitized = sanitizeFieldValue(name, value);
    const updated = { ...formData, [name]: sanitized };
    setFormData(updated);

    const fieldErrors = validate(updated);
    setErrors((p) => {
      const err = { ...p };
      const field = name as keyof AssetTypeFormModel;
      if (fieldErrors[field]) err[field] = fieldErrors[field]!; else delete err[field];
      return err;
    });
  }, [formData, validate]);

  const { handleSubmit, isSubmitting } = useAssetTypeSubmit({
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

  const handleToggleSubUnit = useCallback((checked: boolean) => {
    setFormData((p) => ({ ...p, isSubUnit: checked }));
  }, []);

  return {
    isEdit,
    open,
    handleClose,
    formData,
    errors,
    showError,
    handleChange,
    handleSelectChange,
    handleRadioChange,
    handleBlur,
    handleToggleStatus,
    handleToggleSubUnit,
    handleSubmit,
    isSubmitting,
    t,
    tCommon,
    tNames,
    categoryOptions,
  };
}


