import { useState, useCallback } from "react";
import type React from "react";
import type { InventoryConditionFormModel, ConditionCategoryType } from "@/types/asset-masters/inventory-condition.types";
import { sanitizeFieldValue } from "./validation";

export function useInventoryConditionForm(
  initialData: InventoryConditionFormModel | null | undefined,
  validate: (data: InventoryConditionFormModel) => Partial<Record<keyof InventoryConditionFormModel, string>>
) {
  const [formData, setFormData] = useState<InventoryConditionFormModel>(() => {
    if (initialData) {
      const catType = (initialData.conditionCategory || initialData.conditionType || "Inventory") as ConditionCategoryType;
      const catId = Number(initialData.categoryId || initialData.inventoryItemCategoryId || 0);
      return {
        ...initialData,
        conditionCategory: catType,
        conditionType: catType,
        categoryId: catId,
        inventoryItemCategoryId: catId,
        conditionName: initialData.conditionName || "",
        conditionFactor: initialData.conditionFactor ?? "",
        displayOrder: initialData.displayOrder ?? "",
        description: initialData.description || "",
        isActive: initialData.isActive ?? true,
      };
    }
    return {
      id: undefined,
      categoryId: 0,
      inventoryItemCategoryId: 0,
      conditionCategory: "",
      conditionType: "",
      conditionName: "",
      conditionFactor: "",
      displayOrder: "",
      description: "",
      isActive: true,
    };
  });

  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof InventoryConditionFormModel, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const sanitized = sanitizeFieldValue(name, value);

    let valToSave: unknown = sanitized;
    if (name === "conditionFactor" && sanitized !== "") {
      valToSave = Number(sanitized);
    } else if (name === "displayOrder" && sanitized !== "") {
      valToSave = Number(sanitized);
    }

    setFormData((p) => ({ ...p, [name]: valToSave }));
    setErrors((p) => {
      const err = { ...p };
      delete err[name as keyof InventoryConditionFormModel];
      return err;
    });
  }, []);

  const handleSelectChange = useCallback((name: string, value: string) => {
    if (name === "conditionType" || name === "conditionCategory") {
      setFormData((p) => {
        const catType = value as ConditionCategoryType;
        const updated: InventoryConditionFormModel = {
          ...p,
          conditionCategory: catType,
          conditionType: catType,
          categoryId: 0,
          inventoryItemCategoryId: 0,
        };
        const fieldErrors = validate(updated);
        setErrors((prev) => {
          const err = { ...prev };
          if (fieldErrors.conditionCategory || fieldErrors.conditionType) {
            err.conditionCategory = fieldErrors.conditionCategory || fieldErrors.conditionType;
            err.conditionType = err.conditionCategory;
          } else {
            delete err.conditionCategory;
            delete err.conditionType;
          }
          if (fieldErrors.categoryId || fieldErrors.inventoryItemCategoryId) {
            err.categoryId = fieldErrors.categoryId || fieldErrors.inventoryItemCategoryId;
            err.inventoryItemCategoryId = err.categoryId;
          } else {
            delete err.categoryId;
            delete err.inventoryItemCategoryId;
          }
          return err;
        });
        return updated;
      });
    } else if (name === "categoryId" || name === "inventoryItemCategoryId") {
      setFormData((p) => {
        const numVal = Number(value);
        const updated: InventoryConditionFormModel = {
          ...p,
          categoryId: numVal,
          inventoryItemCategoryId: numVal,
        };
        const fieldErrors = validate(updated);
        setErrors((prev) => {
          const err = { ...prev };
          if (fieldErrors.categoryId || fieldErrors.inventoryItemCategoryId) {
            err.categoryId = fieldErrors.categoryId || fieldErrors.inventoryItemCategoryId;
            err.inventoryItemCategoryId = err.categoryId;
          } else {
            delete err.categoryId;
            delete err.inventoryItemCategoryId;
          }
          return err;
        });
        return updated;
      });
    } else {
      setFormData((p) => {
        const updated = { ...p, [name]: value };
        const fieldErrors = validate(updated);
        setErrors((prev) => {
          const err = { ...prev };
          const field = name as keyof InventoryConditionFormModel;
          if (fieldErrors[field]) err[field] = fieldErrors[field]; else delete err[field];
          return err;
        });
        return updated;
      });
    }
  }, [validate]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));

    const sanitized = sanitizeFieldValue(name, value);
    let valToSave: unknown = sanitized;
    if (name === "conditionFactor" && sanitized !== "") {
      valToSave = Number(sanitized);
    } else if (name === "displayOrder" && sanitized !== "") {
      valToSave = Number(sanitized);
    }

    const updated = { ...formData, [name]: valToSave };
    setFormData(updated);

    const fieldErrors = validate(updated);
    setErrors((p) => {
      const err = { ...p };
      const field = name as keyof InventoryConditionFormModel;
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
