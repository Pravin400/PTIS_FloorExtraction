import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createInventoryNameAction, updateInventoryNameAction } from "@/app/[locale]/assets/configuration/master-data/inventory-name/actions";
import type { InventoryNameFormModel } from "@/types/asset-masters/inventory-name.types";
import { mapInventoryNameApiError, isDeactivateBlocked } from "./validation";

interface UseInventoryNameSubmitProps {
  isEdit: boolean;
  locale: string;
  formData: InventoryNameFormModel;
  validate: (data: InventoryNameFormModel) => Partial<Record<keyof InventoryNameFormModel, string>>;
  setErrors: (errors: Partial<Record<keyof InventoryNameFormModel, string>>) => void;
  setTouched: (touched: Record<string, boolean>) => void;
  setSubmittedOnce?: (submitted: boolean) => void;
  setOpen: (open: boolean) => void;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  tCommon: (key: string) => string;
}

export function useInventoryNameSubmit({
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
}: UseInventoryNameSubmitProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (setSubmittedOnce) setSubmittedOnce(true);

    setTouched({
      inventoryItemCategoryId: true,
      subTypeCode: true,
      subTypeName: true,
      displayOrder: true,
      description: true,
    });

    const v = validate(formData);
    setErrors(v);

    if (Object.keys(v).length) {
      toast.error(tCommon("errors.validationError") || "errors.validationError");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = isEdit 
        ? await updateInventoryNameAction(formData) 
        : await createInventoryNameAction(formData);

      if (res?.success) {
        toast.success(
          isEdit
            ? tCommon("messages.updateSuccess")
            : tCommon("messages.createSuccess")
        );
        setOpen(false);
        router.push(`/${locale}/assets/configuration/master-data/inventory-name`);
        router.refresh();
        return;
      } else {
        const errorMessage = mapInventoryNameApiError(res, t, tCommon);
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

