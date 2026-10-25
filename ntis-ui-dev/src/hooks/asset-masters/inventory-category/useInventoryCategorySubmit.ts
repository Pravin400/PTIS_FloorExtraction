import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveInventoryCategoryAction } from "@/app/[locale]/assets/configuration/master-data/inventory-category/actions";
import type { InventoryCategoryFormModel } from "@/types/asset-masters/inventory-category.types";
import { mapInventoryCategoryApiError, isDeactivateBlocked } from "./validation";
import { getSafeMessage } from "@/lib/utils/asset-utils/createSafeMasterTranslator";

interface UseInventoryCategorySubmitProps {
  isEdit: boolean;
  locale: string;
  formData: InventoryCategoryFormModel;
  validate: (data: InventoryCategoryFormModel) => Partial<Record<keyof InventoryCategoryFormModel, string>>;
  setErrors: (errors: Partial<Record<keyof InventoryCategoryFormModel, string>>) => void;
  setTouched: (touched: Record<string, boolean>) => void;
  setSubmittedOnce?: (submitted: boolean) => void;
  setOpen: (open: boolean) => void;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export function useInventoryCategorySubmit({
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
}: UseInventoryCategorySubmitProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (setSubmittedOnce) setSubmittedOnce(true);

    setTouched({
      code: true,
      name: true,
      depreciationRate: true,
      displayOrder: true,
      description: true,
    });

    const v = validate(formData);
    setErrors(v);

    if (Object.keys(v).length) {
      const fixErrorsMsg =
        getSafeMessage(tCommon, "validation.fixErrors") ||
        getSafeMessage(t, "validation.fixErrors") ||
        getSafeMessage(t, "form.validation.fixErrors") ||
        getSafeMessage(t, "errors.fixErrors") ||
        "Please fix validation errors before submitting";
      toast.error(fixErrorsMsg);
      return;
    }

    setIsSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("group", formData.group);
      fd.append("code", formData.code);
      fd.append("name", formData.name);
      fd.append("depreciationRate", formData.depreciationRate || "");
      fd.append("displayOrder", formData.displayOrder || "");
      fd.append("description", formData.description);
      fd.append("isActive", String(formData.isActive));
      fd.append("locale", locale);

      const res = await saveInventoryCategoryAction(isEdit ? String(formData.id) : "", fd);

      if (res?.ok) {
        toast.success(
          res.mode === "update"
            ? t("messages.updateSuccess")
            : t("messages.createSuccess")
        );
        setOpen(false);
        router.push(`/${locale}/assets/configuration/master-data/inventory-category`);
        router.refresh();
        return;
      }

      if (res && !res.ok) {
        const genericDupMsg = t("validation.duplicateRecord") || t("errors.duplicateRecord") || "This record already exists";
        const codeDupMsg = t("errors.codeDuplicate") || t("errors.duplicateCode") || genericDupMsg;
        const nameDupMsg = t("errors.nameDuplicate") || t("errors.duplicateName") || genericDupMsg;

        if (res.error === "duplicate_code") {
          toast.error(codeDupMsg);
          setErrors({ code: codeDupMsg });
        } else if (res.error === "duplicate_name") {
          toast.error(nameDupMsg);
          setErrors({ name: nameDupMsg });
        } else if (res.error === "duplicate") {
          toast.error(mapInventoryCategoryApiError(res, t, tCommon));
          setErrors({
            code: codeDupMsg,
            name: nameDupMsg,
          });
        } else {
          const errorMessage = mapInventoryCategoryApiError(res, t, tCommon);
          // Deactivating a record that is still in use: show the reason under the status toggle.
          if (isDeactivateBlocked(res)) {
            setErrors({ isActive: errorMessage });
          }
          toast.error(errorMessage);
        }
        return;
      }

      toast.error(t("messages.error") || tCommon("errors.generic"));
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message ?? tCommon("errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleSubmit, isSubmitting };
}

