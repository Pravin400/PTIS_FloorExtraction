import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createInventoryConditionAction, updateInventoryConditionAction } from "@/app/[locale]/assets/configuration/master-data/inventory-condition/actions";
import type { InventoryConditionFormModel } from "@/types/asset-masters/inventory-condition.types";
import { mapInventoryConditionApiError, isDeactivateBlocked } from "./validation";

interface UseInventoryConditionSubmitProps {
  isEdit: boolean;
  locale: string;
  formData: InventoryConditionFormModel;
  validate: (data: InventoryConditionFormModel) => Partial<Record<keyof InventoryConditionFormModel, string>>;
  setErrors: (errors: Partial<Record<keyof InventoryConditionFormModel, string>>) => void;
  setTouched: (touched: Record<string, boolean>) => void;
  setSubmittedOnce?: (submitted: boolean) => void;
  setOpen: (open: boolean) => void;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  tCommon: (key: string) => string;
}

export function useInventoryConditionSubmit({
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
}: UseInventoryConditionSubmitProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (setSubmittedOnce) setSubmittedOnce(true);

    const submissionData: InventoryConditionFormModel = {
      ...formData,
      conditionCategory: formData.conditionCategory || formData.conditionType || "",
      categoryId: formData.categoryId ?? formData.inventoryItemCategoryId,
    };

    setTouched({
      conditionCategory: true,
      conditionType: true,
      categoryId: true,
      inventoryItemCategoryId: true,
      conditionName: true,
      conditionFactor: true,
      displayOrder: true,
      description: true,
    });

    const v = validate(submissionData);
    setErrors(v);

    if (Object.keys(v).length) {
      toast.error(tCommon("errors.validationError") || "Please fix validation errors");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = isEdit 
        ? await updateInventoryConditionAction(submissionData)
        : await createInventoryConditionAction(submissionData);

      if (res?.success) {
        toast.success(
          isEdit
            ? tCommon("messages.updateSuccess")
            : tCommon("messages.createSuccess")
        );
        setOpen(false);
        router.push(`/${locale}/assets/configuration/master-data/inventory-condition`);
        router.refresh();
        return;
      } else {
        const errorMessage = mapInventoryConditionApiError(res, t, tCommon);
        // Deactivating a record that is still in use: show the reason under the status toggle.
        if (isDeactivateBlocked(res)) {
          setErrors({ isActive: errorMessage });
        }
        toast.error(errorMessage);
      }
    } catch (error: unknown) {
      toast.error((error as Error)?.message ?? tCommon("errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleSubmit, isSubmitting };
}
