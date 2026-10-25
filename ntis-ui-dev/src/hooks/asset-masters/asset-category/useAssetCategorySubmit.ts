import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveAssetCategoryAction } from "@/app/[locale]/assets/configuration/master-data/asset-category/actions";
import type { AssetCategoryFormModel } from "@/types/asset-masters/asset-category.types";
import { mapAssetCategoryApiError, isDeactivateBlockedMessage } from "./validation";
import { getSafeMessage } from "@/lib/utils/asset-utils/createSafeMasterTranslator";

interface UseAssetCategorySubmitProps {
  isEdit: boolean;
  locale: string;
  formData: AssetCategoryFormModel;
  validate: (data: AssetCategoryFormModel) => Partial<Record<keyof AssetCategoryFormModel, string>>;
  setErrors: (errors: Partial<Record<keyof AssetCategoryFormModel, string>>) => void;
  setTouched: (touched: Record<string, boolean>) => void;
  setSubmittedOnce: (submitted: boolean) => void;
  setOpen: (open: boolean) => void;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export function useAssetCategorySubmit({
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
}: UseAssetCategorySubmitProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmittedOnce(true);

    setTouched({
      code: true,
      name: true,
      description: true,
      valuationType: true,
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
      fd.append("code", formData.code);
      fd.append("name", formData.name);
      fd.append("description", formData.description || "");
      fd.append("isMovable", String(formData.isMovable));
      fd.append("hasFloorDetails", String(formData.hasFloorDetails));
      fd.append("hasInventory", String(formData.hasInventory));
      fd.append("isInventoryMandatory", String(formData.isInventoryMandatory));
      fd.append("hasLegalCompliance", String(formData.hasLegalCompliance));
      fd.append("valuationType", formData.valuationType || "");
      fd.append("isActive", String(formData.isActive));
      fd.append("locale", locale);

      const res = await saveAssetCategoryAction(isEdit ? String(formData.id) : "", fd);

      if (res?.ok) {
        toast.success(
          res.mode === "update"
            ? t("messages.updateSuccess")
            : t("messages.createSuccess")
        );
        setOpen(false);
        router.push(`/${locale}/assets/configuration/master-data/asset-category`);
        router.refresh();
        return;
      }

      if (res && !res.ok) {
        const errorMessage = mapAssetCategoryApiError(res, t, tCommon);
        if (isDeactivateBlockedMessage(res.message || res.error)) {
          setErrors({ isActive: errorMessage });
        }
        toast.error(errorMessage);
        if (res.error === "duplicate") {
          const newErrors: Partial<Record<keyof AssetCategoryFormModel, string>> = {};
          const duplicateFields = (res as { duplicateFields?: { code?: string | boolean | null; name?: string | boolean | null } }).duplicateFields;
          const field = (res as { field?: string }).field;

          const getCodeDuplicateMsg = () =>
            t("validation.codeDuplicate") || t("errors.codeDuplicate") || t("errors.duplicateCode") || "This code already exists";

          const getNameDuplicateMsg = () =>
            t("validation.nameDuplicate") || t("errors.nameDuplicate") || t("errors.duplicateName") || "This name already exists";

          if (duplicateFields) {
            if (duplicateFields.code) {
              newErrors.code = getCodeDuplicateMsg();
              setTouched({ code: true });
            }
            if (duplicateFields.name) {
              newErrors.name = getNameDuplicateMsg();
              setTouched({ name: true });
            }
          } else if (field === "code") {
            newErrors.code = getCodeDuplicateMsg();
            setTouched({ code: true });
          } else if (field === "name") {
            newErrors.name = getNameDuplicateMsg();
            setTouched({ name: true });
          } else {
            newErrors.code = getCodeDuplicateMsg();
            newErrors.name = getNameDuplicateMsg();
            setTouched({ code: true, name: true });
          }

          setErrors(newErrors);
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

