import { useState, useCallback } from "react";
import type React from "react";
import type { InventoryModelFormModel } from "@/types/asset-masters/inventory-model.types";
import { sanitizeFieldValue } from "./validation";

export function useInventoryModelForm(
  initialData: InventoryModelFormModel | null | undefined,
  validate: (data: InventoryModelFormModel) => Partial<Record<keyof InventoryModelFormModel, string>>
) {
  const [formData, setFormData] = useState<InventoryModelFormModel>(
    initialData ?? {
      id: undefined,
      name: "",
      group: "",
      description: "",
      displayOrder: "",
      isActive: true,
    }
  );

  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof InventoryModelFormModel, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const sanitized = sanitizeFieldValue(name, value);

    setFormData((p) => ({ ...p, [name]: sanitized }));
    setErrors((p) => {
      const err = { ...p };
      delete err[name as keyof InventoryModelFormModel];
      return err;
    });
  }, []);

  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData((p) => {
      const updated = { ...p, [name]: value };
      const fieldErrors = validate(updated);
      setErrors((prev) => {
        const err = { ...prev };
        const field = name as keyof InventoryModelFormModel;
        if (fieldErrors[field]) err[field] = fieldErrors[field]; else delete err[field];
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
      const field = name as keyof InventoryModelFormModel;
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
  };
}

