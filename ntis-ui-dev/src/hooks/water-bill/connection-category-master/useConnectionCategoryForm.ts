import { useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import type {
  ConnectionCategoryFormModel,
  ConnectionCategory,
  BillingFrequencyOption,
} from "@/types/waterBill/connectionCategoryMaster.types";
import { ALPHANUMERIC_WITH_SPACES_SANITIZE, NAME_ONLY_SANITIZE } from "@/lib/utils/validation-rules";
import { CODE_SANITIZE, DESCRIPTION_SANITIZE, HAS_LETTER_REGEX } from "@/lib/utils/validation";
import {
  createConnectionCategoryAction,
  updateConnectionCategoryAction,
  getConnectionCategoryPagedAction
} from "@/app/[locale]/water-bill/connection-category-master/actions";
import {
  METERED_BILLING_METHODS,
  NON_METERED_BILLING_METHODS,
} from "@/types/waterBill/connectionCategoryMaster.types";
import { validateConnectionCategoryForm } from "@/lib/validations/water-bill/connectionCategoryForm.validation";

export { METERED_BILLING_METHODS, NON_METERED_BILLING_METHODS };

export function useConnectionCategoryForm(
  id: number | null,
  initialData?: ConnectionCategory,
  billingFrequencies: BillingFrequencyOption[] = []
) {
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname() || "";
  const isUnified = pathname.includes("/water-bill/connection-type-master/connection-category");
  const listUrl = isUnified
    ? `/${locale}/water-bill/connection-type-master/connection-category`
    : `/${locale}/water-bill/connection-category-master`;
  const t = useTranslations("connectionCategoryMaster.connectionCategory");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(id);

  const [open, setOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const initialIsMetered = initialData?.isMetered ?? true;
  const initialBillingMethod = initialData?.billingMethod ?? (initialIsMetered ? "Metered" : "Flat");

  const [formData, setFormData] = useState<ConnectionCategoryFormModel>({
    connectionCategoryCode: initialData?.connectionCategoryCode ?? "",
    connectionCategory: initialData?.connectionCategory ?? "",
    billingFrequencyId: initialData?.billingFrequencyId ?? null,
    isMetered: initialIsMetered,
    billingMethod: initialBillingMethod,
    description: initialData?.description ?? "",
    isActive: initialData?.isActive ?? true,
  });

  const [touched, setTouched] = useState<Partial<Record<keyof ConnectionCategoryFormModel, boolean>>>({});

  const validate = useCallback(
    (data: ConnectionCategoryFormModel) => validateConnectionCategoryForm(data, (k) => t(k as Parameters<typeof t>[0])),
    [t]
  );

  const errors = validate(formData);
  const showError = (field: keyof ConnectionCategoryFormModel) =>
    Boolean((submittedOnce || touched[field]) && errors[field]);

  const handleChange = (field: keyof ConnectionCategoryFormModel, value: string | boolean | number | null) => {
    let sanitizedValue: string | boolean | number | null = value;
    if (typeof value === "string") {
      if (field === "connectionCategoryCode") {
        sanitizedValue = value.replace(CODE_SANITIZE, "").toUpperCase();
        if (sanitizedValue.length > 20) {
          sanitizedValue = sanitizedValue.substring(0, 20);
        }
      } else if (field === "connectionCategory") {
        sanitizedValue = value.replace(NAME_ONLY_SANITIZE, "");
        if (sanitizedValue.length > 50) {
          sanitizedValue = sanitizedValue.substring(0, 50);
        }
      } else if (field === "description") {
        sanitizedValue = value.replace(DESCRIPTION_SANITIZE, "").replace(/\s{2,}/g, " ");
      } else {
        sanitizedValue = value
          .normalize("NFC")
          .replace(ALPHANUMERIC_WITH_SPACES_SANITIZE, "")
          .replace(/\s{2,}/g, " ");
      }
    }

    setFormData((prev) => {
      const updated = { ...prev, [field]: sanitizedValue };
      if (field === "isMetered") {
        const isMeteredBool = Boolean(sanitizedValue);
        if (isMeteredBool && (NON_METERED_BILLING_METHODS as readonly string[]).includes(prev.billingMethod)) {
          updated.billingMethod = "Metered";
        } else if (!isMeteredBool && (METERED_BILLING_METHODS as readonly string[]).includes(prev.billingMethod)) {
          updated.billingMethod = "Flat";
        }
      }
      return updated;
    });
  };

  const handleBlur = (field: keyof ConnectionCategoryFormModel) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleClose = useCallback(() => {
    setOpen(false);
    router.push(listUrl);
  }, [router, listUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setSubmittedOnce(true);
    const validationErrs = validate(formData);
    if (Object.keys(validationErrs).length > 0) return;

    if (!HAS_LETTER_REGEX.test(formData.connectionCategoryCode || "")) {
      toast.error(t("validation.codeNumbersOnlyNotAllowed") || "Code cannot contain only numbers or special characters");
      return;
    }

    if (!HAS_LETTER_REGEX.test(formData.connectionCategory || "")) {
      toast.error(t("validation.connectionCategoryNumbersOnlyNotAllowed") || "Connection Category cannot contain only numbers or special characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const code = (formData.connectionCategoryCode || "").trim().toUpperCase().slice(0, 20);
      const categoryName = formData.connectionCategory.trim();

      const allRecords = await getConnectionCategoryPagedAction(1, 10000);
      const isCodeDup = allRecords.items.some(x => x.connectionCategoryCode?.trim().toLowerCase() === code.toLowerCase() && x.id !== id);
      const isComboDup = allRecords.items.some(x => 
        x.connectionCategory.trim().toLowerCase() === categoryName.toLowerCase() && 
        x.billingFrequencyId === formData.billingFrequencyId && 
        x.id !== id
      );

      if (isCodeDup || isComboDup) {
        if (isCodeDup) toast.error(t("messages.duplicateCodeError") || "Connection Category Code already exists.");
        if (isComboDup) toast.error(t("messages.duplicateComboError") || "A record with this Connection Category and Billing Frequency combination already exists.");
        setIsSubmitting(false);
        return;
      }

      const submitData = {
        connectionCategoryCode: code,
        connectionCategory: categoryName,
        billingFrequencyId: formData.billingFrequencyId,
        isMetered: formData.isMetered,
        billingMethod: formData.billingMethod.trim(),
        description: formData.description.trim() || null,
        isActive: formData.isActive,
      };

      const result = isEdit
        ? await updateConnectionCategoryAction(id!, submitData)
        : await createConnectionCategoryAction(submitData);

      if (result.success) {
        toast.success(isEdit ? t("messages.updateSuccess") : t("messages.createSuccess"));
        setOpen(false);
        router.push(listUrl);
      } else {
        const rawError = result.error ?? tCommon("errors.generic");
        const cleanError = rawError.replace(/^([a-zA-Z0-9_]+:\s*)+/, "").trim();
        const isDuplicate = result.statusCode === 409 || /already exists|duplicate/i.test(cleanError);
        toast.error(isDuplicate ? t("messages.duplicateError") || "A record with the same details already exists." : cleanError);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentBillingMethodOptions = formData.isMetered ? METERED_BILLING_METHODS : NON_METERED_BILLING_METHODS;

  return {
    isEdit, open, isSubmitting, formData, errors, showError,
    handleChange, handleBlur, handleClose, handleSubmit,
    currentBillingMethodOptions, billingFrequencies, t, tCommon,
  };
}
