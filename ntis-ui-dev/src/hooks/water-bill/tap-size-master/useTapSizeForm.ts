import { useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import type { TapSizeFormModel, TapSize } from "@/types/waterBill/tapSizeMaster.types";
import { formatNominalSize, parseNominalSizeFromTapSize } from "@/lib/utils/water-bill/tapSizeMaster.utils";
import { TAP_SIZE_CODE_SANITIZE, TAP_SIZE_CODE_REGEX, TAP_SIZE_SANITIZE, TAP_SIZE_REGEX } from "@/lib/utils/validation-rules";
import {
  createTapSizeAction,
  updateTapSizeAction,
  getTapSizePagedAction
} from "@/app/[locale]/water-bill/tap-size-master/actions";

export function useTapSizeForm(id: number | null, initialData?: TapSize) {
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname() || "";
  const isUnified = pathname.includes("/water-bill/connection-type-master/tap-size");
  const listUrl = isUnified
    ? `/${locale}/water-bill/connection-type-master/tap-size`
    : `/${locale}/water-bill/tap-size-master`;
  const t = useTranslations("tapSizeMaster.tapSize");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(id);

  const [open, setOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);

  // For edit mode, clean up old data that might have had "Inch" in the tapSize string
  const initialTapSize = (initialData?.tapSize ?? "").replace(TAP_SIZE_SANITIZE, "");

  const [formData, setFormData] = useState<TapSizeFormModel>({
    tapSizeCode: initialData?.tapSizeCode ?? "",
    tapSize: initialTapSize,
    nominalSizeValue:
      initialData?.nominalSizeValue != null
        ? formatNominalSize(initialData.nominalSizeValue, "")
        : "",
    sizeUnit: initialData?.sizeUnit || "Inch",
    isActive: initialData?.isActive ?? true,
  });
  
  const [touched, setTouched] = useState<Partial<Record<keyof TapSizeFormModel, boolean>>>({});
  const isUnitUserEdited = useRef(Boolean(initialData?.sizeUnit));

  const validate = useCallback(
    (data: TapSizeFormModel) => {
      const errs: Partial<Record<keyof TapSizeFormModel, string>> = {};
      if (!data.tapSizeCode?.trim()) {
        errs.tapSizeCode = t("validation.tapSizeCodeRequired");
      } else if (data.tapSizeCode.trim().length > 20) {
        errs.tapSizeCode = t("validation.tapSizeCodeLength");
      } else if (!TAP_SIZE_CODE_REGEX.test(data.tapSizeCode)) {
        errs.tapSizeCode = t("validation.codeFormat");
      }
      if (!data.tapSize?.trim()) {
        errs.tapSize = t("validation.tapSizeRequired");
      } else if (data.tapSize.trim().length > 5) {
        errs.tapSize = t("validation.tapSizeLength");
      } else if (!TAP_SIZE_REGEX.test(data.tapSize)) {
        errs.tapSize = t("validation.tapSizeInvalid");
      }
      
      // Removed nominalSizeValue validation since it's disabled/auto-calculated

      if (!data.sizeUnit?.trim()) {
        errs.sizeUnit = t("validation.sizeUnitRequired");
      } else if (data.sizeUnit.length > 20) {
        errs.sizeUnit = t("validation.sizeUnitLength");
      }
      return errs;
    },
    [t]
  );

  const errors = validate(formData);

  const showError = (field: keyof TapSizeFormModel) =>
    Boolean((submittedOnce || touched[field]) && errors[field]);

  const handleChange = (field: keyof TapSizeFormModel, value: string | number | boolean) => {
    let sanitizedValue = value;
    if (typeof value === "string") {
      if (field === "tapSizeCode") {
        sanitizedValue = value.replace(TAP_SIZE_CODE_SANITIZE, "").toUpperCase();
      } else if (field === "tapSize") {
        sanitizedValue = value.replace(TAP_SIZE_SANITIZE, "").replace(/\s{2,}/g, " ");
      } else {
        // Only sizeUnit and description (if added later) fall here
        sanitizedValue = value.normalize("NFC").replace(/\s{2,}/g, " ");
      }
    }

    if (field === "tapSize") {
      const strVal = String(sanitizedValue);
      const parsed = parseNominalSizeFromTapSize(strVal);

      setFormData((prev) => ({
        ...prev,
        tapSize: strVal,
        ...(parsed.nominalSizeValue !== undefined
          ? { nominalSizeValue: parsed.nominalSizeValue }
          : { nominalSizeValue: "" }),
        ...(!isUnitUserEdited.current && parsed.sizeUnit ? { sizeUnit: parsed.sizeUnit } : {}),
      }));
      return;
    }

    if (field === "sizeUnit") {
      isUnitUserEdited.current = sanitizedValue !== "";
    }

    setFormData((prev) => ({ ...prev, [field]: sanitizedValue }));
  };

  const handleBlur = (field: keyof TapSizeFormModel) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === "tapSize") {
      const parsed = parseNominalSizeFromTapSize(formData.tapSize);
      if (parsed.nominalSizeValue !== undefined) {
        setFormData((prev) => ({ ...prev, nominalSizeValue: parsed.nominalSizeValue! }));
      }
      if (!isUnitUserEdited.current && parsed.sizeUnit) {
        setFormData((prev) => ({ ...prev, sizeUnit: parsed.sizeUnit! }));
      }
    } else if (
      field === "nominalSizeValue" &&
      formData.nominalSizeValue !== "" &&
      formData.nominalSizeValue !== null &&
      formData.nominalSizeValue !== undefined
    ) {
      const formatted = formatNominalSize(formData.nominalSizeValue, "");
      if (formatted !== formData.nominalSizeValue) {
        setFormData((prev) => ({ ...prev, nominalSizeValue: formatted }));
      }
    }
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

    setIsSubmitting(true);
    try {
      const code = (formData.tapSizeCode || "").trim().toUpperCase().slice(0, 30);
      const tapSizeName = formData.tapSize.trim();

      const allRecords = await getTapSizePagedAction(1, 10000);
      const isCodeDup = allRecords.items.some(x => x.tapSizeCode?.trim().toLowerCase() === code.toLowerCase() && x.id !== id);
      const isNameDup = allRecords.items.some(x => x.tapSize.trim().toLowerCase() === tapSizeName.toLowerCase() && x.id !== id);

      if (isCodeDup || isNameDup) {
        if (isCodeDup) toast.error(t("messages.duplicateCodeError") || "Tap Size Code already exists.");
        if (isNameDup) toast.error(t("messages.duplicateNameError") || "Tap Size already exists.");
        setIsSubmitting(false);
        return;
      }

      const submitData = {
        tapSizeCode: code,
        tapSize: tapSizeName,
        nominalSizeValue: formData.nominalSizeValue,
        sizeUnit: formData.sizeUnit?.trim() || null,
        isActive: formData.isActive,
      };

      const result = isEdit
        ? await updateTapSizeAction(id!, submitData)
        : await createTapSizeAction(submitData);

      if (result.success) {
        toast.success(isEdit ? t("messages.updateSuccess") : t("messages.createSuccess"));
        setOpen(false);
        router.push(listUrl);
      } else {
        const rawError = result.error ?? tCommon("errors.generic");
        // Strip any function name prefix like "createTapSize: "
        const cleanError = rawError.replace(/^([a-zA-Z0-9_]+:\s*)+/, "").trim();
        const isDuplicate = result.statusCode === 409 || /already exists|duplicate/i.test(cleanError);
        const finalMessage = isDuplicate
          ? t("messages.duplicateError")
          : cleanError;

        toast.error(finalMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isEdit,
    open,
    isSubmitting,
    formData,
    errors,
    showError,
    handleChange,
    handleBlur,
    handleClose,
    handleSubmit,
    t,
    tCommon
  };
}
