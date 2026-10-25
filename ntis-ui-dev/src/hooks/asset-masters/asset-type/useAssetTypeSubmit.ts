import { useState, FormEvent, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveAssetTypeAction } from "@/app/[locale]/assets/configuration/master-data/asset-type/actions";
import type { AssetTypeFormModel } from "@/types/asset-masters/asset-type.types";
import { mapAssetTypeApiError, isDeactivateBlockedMessage } from "./validation";
import { getSafeMessage } from "@/lib/utils/asset-utils/createSafeMasterTranslator";

interface UseAssetTypeSubmitProps {
  isEdit: boolean;
  locale: string;
  formData: AssetTypeFormModel;
  validate: (data: AssetTypeFormModel) => Partial<Record<keyof AssetTypeFormModel & "registrationType", string>>;
  setErrors: Dispatch<SetStateAction<Record<string, string>>>;
  setTouched: Dispatch<SetStateAction<Record<string, boolean>>>;
  setSubmittedOnce: (submitted: boolean) => void;
  setOpen: (open: boolean) => void;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export function useAssetTypeSubmit({
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
}: UseAssetTypeSubmitProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmittedOnce(true);

    setTouched({
      code: true,
      name: true,
      typeNameLocal: true,
      group: true,
      description: true,
      registrationType: true,
    });

    const v = validate(formData);
    setErrors(v as Record<string, string>);

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
      fd.append("typeNameLocal", formData.typeNameLocal || "");
      fd.append("group", formData.group || "");
      fd.append("description", formData.description || "");
      fd.append("allowUnitRegistration", String(formData.allowUnitRegistration));
      fd.append("allowRoomRegistration", String(formData.allowRoomRegistration));
      fd.append("isSubUnit", String(formData.isSubUnit));
      fd.append("isActive", String(formData.isActive));
      fd.append("locale", locale);

      const res = await saveAssetTypeAction(isEdit ? String(formData.id) : "", fd);

      if (res?.ok) {
        toast.success(
          res.mode === "update"
            ? t("messages.updateSuccess")
            : t("messages.createSuccess")
        );
        setOpen(false);
        router.push(`/${locale}/assets/configuration/master-data/asset-type`);
        router.refresh();
        return;
      }

      if (res && !res.ok) {
        if (res.field === "typeNameLocal") {
          setTouched((prev) => ({ ...prev, typeNameLocal: true }));
          setErrors((prev) => ({
            ...prev,
            typeNameLocal: t("validation.typeNameLocalInvalid") || "AssetType_TypeNameLocal_Invalid",
          }));
          return;
        }
        const errorMessage = mapAssetTypeApiError(res, t, tCommon);
        if (isDeactivateBlockedMessage(res.message || res.error)) {
          setErrors((prev) => ({ ...prev, isActive: errorMessage }));
        }
        toast.error(errorMessage);
        if (res.error === "duplicate") {
          const newErrors: Record<string, string> = {};
          const duplicateFields = (res as { duplicateFields?: { code?: string | boolean | null; name?: string | boolean | null } }).duplicateFields;

          const getCodeDuplicateMsg = () =>
            t("validation.codeDuplicate") || t("errors.codeDuplicate") || t("errors.duplicateCode") || "This code already exists";

          const getNameDuplicateMsg = () =>
            t("validation.nameDuplicate") || t("errors.nameDuplicate") || t("errors.duplicateName") || "This name already exists";

          if (duplicateFields) {
            if (duplicateFields.code) {
              newErrors.code = getCodeDuplicateMsg();
              setTouched((prev) => ({ ...prev, code: true }));
            }
            if (duplicateFields.name) {
              newErrors.name = getNameDuplicateMsg();
              setTouched((prev) => ({ ...prev, name: true }));
            }
          } else {
            newErrors.code = getCodeDuplicateMsg();
            newErrors.name = getNameDuplicateMsg();
            setTouched((prev) => ({ ...prev, code: true, name: true }));
          }

          setErrors((prev) => ({ ...prev, ...newErrors }));
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

