import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveInventoryModelAction } from "@/app/[locale]/assets/configuration/master-data/inventory-model/actions";
import type { InventoryModelFormModel } from "@/types/asset-masters/inventory-model.types";
import { mapInventoryModelApiError, isDeactivateBlocked } from "./validation";

interface UseInventoryModelSubmitProps {
  isEdit: boolean;
  locale: string;
  formData: InventoryModelFormModel;
  validate: (data: InventoryModelFormModel) => Partial<Record<keyof InventoryModelFormModel, string>>;
  setErrors: (errors: Partial<Record<keyof InventoryModelFormModel, string>>) => void;
  setTouched: (touched: Record<string, boolean>) => void;
  setSubmittedOnce?: (submitted: boolean) => void;
  setOpen: (open: boolean) => void;
  t: (key: string) => string;
  tCommon?: (key: string) => string;
}

export function useInventoryModelSubmit({
  isEdit,
  locale,
  formData,
  validate,
  setErrors,
  setTouched,
  setSubmittedOnce,
  setOpen,
  t,
  tCommon = (k) => k,
}: UseInventoryModelSubmitProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (setSubmittedOnce) setSubmittedOnce(true);

    setTouched({
      name: true,
      group: true,
      displayOrder: true,
      description: true,
    });

    const v = validate(formData);
    setErrors(v);

    if (Object.keys(v).length) return;

    setIsSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("group", formData.group || "");
      fd.append("displayOrder", String(formData.displayOrder ?? ""));
      fd.append("description", formData.description);
      fd.append("isActive", String(formData.isActive));
      fd.append("locale", locale);

      const res = await saveInventoryModelAction(isEdit ? String(formData.id) : "", fd);

      if (res?.ok) {
        toast.success(
          res.mode === "update"
            ? t("messages.updateSuccess")
            : t("messages.createSuccess")
        );
        setOpen(false);
        router.push(`/${locale}/assets/configuration/master-data/inventory-model`);
        router.refresh();
        return;
      }

      if (res && !res.ok) {
        const errorMessage = mapInventoryModelApiError(res, t, tCommon);
        // Deactivating a record that is still in use: show the reason under the status toggle.
        if (isDeactivateBlocked(res)) {
          setErrors({ isActive: errorMessage });
        }
        toast.error(errorMessage);
        if (res.error === "duplicate") {
          setErrors({
            name: t("validation.duplicateRecord") || t("errors.duplicateRecord") || "Already exists",
          });
        }
        return;
      }

      toast.error(t("messages.error"));
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message ?? t("messages.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleSubmit, isSubmitting };
}

