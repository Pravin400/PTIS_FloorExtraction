import { useState, useCallback } from "react";
import type React from "react";
import type { InventoryNameFormModel } from "@/types/asset-masters/inventory-name.types";
import { sanitizeFieldValue } from "./validation";

export function useInventoryNameForm(
  initialData: InventoryNameFormModel | null | undefined,
  validate: (data: InventoryNameFormModel) => Partial<Record<keyof InventoryNameFormModel, string>>
) {
  const [formData, setFormData] = useState<InventoryNameFormModel>(
    initialData ?? {
      id: undefined,
      inventoryItemCategoryId: 0,
      subTypeCode: "",
      subTypeName: "",
      description: "",
      displayOrder: "",
      isActive: true,
    }
  );

  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof InventoryNameFormModel, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const sanitized = sanitizeFieldValue(name, value);

    setFormData((p) => ({ ...p, [name]: sanitized }));
    setErrors((p) => {
      const err = { ...p };
      delete err[name as keyof InventoryNameFormModel];
      return err;
    });
  }, []);

  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData((p) => {
      const updated = { ...p, [name]: Number(value) };
      const fieldErrors = validate(updated);
      setErrors((prev) => {
        const err = { ...prev };
        const field = name as keyof InventoryNameFormModel;
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
      const field = name as keyof InventoryNameFormModel;
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

