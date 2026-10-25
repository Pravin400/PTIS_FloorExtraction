import { useState, useCallback, useMemo } from "react";
import type React from "react";
import type { InventoryCategoryFormModel, InventoryCategoryGroupOption } from "@/types/asset-masters/inventory-category.types";
import { sanitizeFieldValue } from "./validation";

export function useInventoryCategoryForm(
  initialData: InventoryCategoryFormModel | null,
  validate: (data: InventoryCategoryFormModel) => Partial<Record<keyof InventoryCategoryFormModel, string>>,
  groups?: InventoryCategoryGroupOption[]
) {
  const [formData, setFormData] = useState<InventoryCategoryFormModel>(
    initialData ?? {
      id: undefined,
      code: "",
      name: "",
      group: "",
      depreciationRate: "",
      displayOrder: "",
      description: "",
      isActive: true,
    }
  );

  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof InventoryCategoryFormModel, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const categoryOptions = useMemo(() => {
    return (groups || [])
      .filter((g) => g.id !== "all" && (g.status !== "Inactive" || g.id === String(formData.group ?? "")))
      .map((g) => ({ label: g.name, value: g.id }));
  }, [groups, formData.group]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const sanitized = sanitizeFieldValue(name, value);

    setFormData((p) => ({ ...p, [name]: sanitized }));
    setErrors((p) => {
      const err = { ...p };
      delete err[name as keyof InventoryCategoryFormModel];
      return err;
    });
  }, []);

  const handleSelectChange = useCallback((field: keyof InventoryCategoryFormModel, value: string) => {
    setTouched((p) => ({ ...p, [field]: true }));
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    const fieldErrors = validate(updated);
    setErrors((p) => {
      const err = { ...p };
      if (fieldErrors[field]) err[field] = fieldErrors[field];
      else delete err[field];
      return err;
    });
  }, [formData, validate]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));

    const sanitized = sanitizeFieldValue(name, value);
    const updated = { ...formData, [name]: sanitized };
    setFormData(updated);

    const fieldErrors = validate(updated);
    setErrors((p) => {
      const err = { ...p };
      const field = name as keyof InventoryCategoryFormModel;
      if (fieldErrors[field]) err[field] = fieldErrors[field]; else delete err[field];
      return err;
    });
  }, [formData, validate]);

  const handleToggleStatus = useCallback((checked?: boolean | unknown) => {
    setFormData((p) => ({ ...p, isActive: typeof checked === "boolean" ? checked : !p.isActive }));
    setErrors((p) => {
      const err = { ...p };
      delete err.isActive;
      return err;
    });
  }, []);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    touched,
    setTouched,
    submittedOnce,
    setSubmittedOnce,
    handleChange,
    handleSelectChange,
    handleBlur,
    handleToggleStatus,
    categoryOptions,
  };
}

