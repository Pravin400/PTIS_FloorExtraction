import type React from "react";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createOwnershipTypeAction, updateOwnershipTypeAction } from "@/app/[locale]/assets/configuration/master-data/ownership-type/actions";
import type { OwnershipTypeFormModel } from "@/types/asset-masters/ownership-type.types";
import { getSafeMessage } from "@/lib/utils/asset-utils/createSafeMasterTranslator";
import { isDeactivateBlockedMessage, mapOwnershipTypeApiError } from "./validation";

interface UseOwnershipTypeSubmitProps {
  isEdit: boolean;
  locale: string;
  formData: OwnershipTypeFormModel;
  validate: (data: OwnershipTypeFormModel) => Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setTouched: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  t?: (key: string, values?: Record<string, string | number | Date>) => string;
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string;
}

export function useOwnershipTypeSubmit({
  isEdit,
  locale,
  formData,
  validate,
  setErrors,
  setTouched,
  setOpen,
  t,
  tCommon,
}: UseOwnershipTypeSubmitProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setTouched({
      ownershipTypeName: true,
      description: true,
    });

    const v = validate(formData);
    setErrors(v);

    if (Object.keys(v).length) {
      toast.error(tCommon("errors.validationError"));
      return;
    }

    setIsSubmitting(true);

    try {
      const res = isEdit
        ? await updateOwnershipTypeAction(formData)
        : await createOwnershipTypeAction(formData);

      if (res?.success) {
        toast.success(
          isEdit
            ? tCommon("messages.updateSuccess")
            : tCommon("messages.createSuccess")
        );
        setOpen(false);
        router.push(`/${locale}/assets/configuration/master-data/ownership-type`);
        router.refresh();
        return;
      }

      if (res && !res.success) {
        const errorKey = (res as { error?: string }).error;
        if (errorKey === "duplicate") {
          const duplicateMsg =
            getSafeMessage(t, "configuration.masterData.form.errors.nameDuplicate") ||
            getSafeMessage(tCommon, "messages.duplicate") ||
            "This name already exists";
          setErrors((prev) => ({ ...prev, ownershipTypeName: duplicateMsg }));
          setTouched((prev) => ({ ...prev, ownershipTypeName: true }));
          toast.error(duplicateMsg);
        } else {
          const errorMessage = mapOwnershipTypeApiError(res, t || tCommon, tCommon);
          if (isDeactivateBlockedMessage(errorKey)) {
            setErrors((prev) => ({ ...prev, isActive: errorMessage }));
          }
          toast.error(errorMessage);
        }
      }
    } catch (error: unknown) {
      toast.error((error as Error)?.message ?? tCommon("errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleSubmit, isSubmitting };
}
