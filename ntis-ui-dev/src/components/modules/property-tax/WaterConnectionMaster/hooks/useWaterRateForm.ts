import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import type { WaterRate, WaterRateFormModel } from "@/types/water-connection.types";
import {
  createWaterRateAction,
  updateWaterRateAction,
} from "@/app/[locale]/property-tax/water-connection-master/actions";

interface UseWaterRateFormProps {
  id: number | null;
  initialData?: WaterRate;
}

export function useWaterRateForm({ id, initialData }: UseWaterRateFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("waterConnectionMaster.waterRate");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(id);

  const listUrl = `/${locale}/property-tax/water-connection-master/water-rate`;

  const [open, setOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const initialRateType = initialData?.monthlyRate != null && initialData.monthlyRate > 0
    ? "monthly"
    : initialData?.quarterlyRate != null && initialData.quarterlyRate > 0
    ? "quarterly"
    : "yearly";

  const initialRateValue =
    initialRateType === "monthly"
      ? String(initialData?.monthlyRate ?? "")
      : initialRateType === "quarterly"
      ? String(initialData?.quarterlyRate ?? "")
      : initialData?.yearlyRate != null
      ? String(initialData.yearlyRate)
      : "";

  const [formData, setFormData] = useState({
    waterConnectionTypeId: initialData?.waterConnectionTypeId
      ? String(initialData.waterConnectionTypeId)
      : "",
    waterConnectionSizeId: initialData?.waterConnectionSizeId
      ? String(initialData.waterConnectionSizeId)
      : "",
    financeYearId: initialData?.financeYearId ? String(initialData.financeYearId) : "",
    rateType: initialRateType,
    rateValue: initialRateValue,
    isActive: initialData?.isActive ?? true,
  });

  const [touched, setTouched] = useState<Partial<Record<keyof typeof formData, boolean>>>({});

  const validate = useCallback(
    (data: typeof formData) => {
      const errs: Partial<Record<keyof typeof formData, string>> = {};
      if (!data.waterConnectionTypeId)
        errs.waterConnectionTypeId = t("validation.typeRequired");
      if (!data.waterConnectionSizeId)
        errs.waterConnectionSizeId = t("validation.sizeRequired");
      if (!data.financeYearId) errs.financeYearId = t("validation.yearRequired");
      if (!data.rateValue) errs.rateValue = t("validation.rateRequired");
      else {
        const rate = Number(data.rateValue);
        if (Number.isNaN(rate) || rate <= 0 || !/^\d+$/.test(data.rateValue)) {
          errs.rateValue = t("validation.rateInvalid");
        } else if (data.rateValue.length > 6) {
          errs.rateValue = t("validation.rateMaxDigits");
        }
      }
      return errs;
    },
    [t]
  );

  const errors = validate(formData);

  const showError = (field: keyof typeof formData) =>
    Boolean((submittedOnce || touched[field]) && errors[field]);

  const handleChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: keyof typeof formData) => {
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
    if (Object.keys(validate(formData)).length > 0) return;

    setIsSubmitting(true);
    try {
      const rateNum = Number(formData.rateValue);
      const payload: WaterRateFormModel = {
        waterConnectionTypeId: Number(formData.waterConnectionTypeId),
        waterConnectionSizeId: Number(formData.waterConnectionSizeId),
        financeYearId: Number(formData.financeYearId),
        yearlyRate: formData.rateType === "yearly" ? rateNum : 0,
        quarterlyRate: formData.rateType === "quarterly" ? rateNum : null,
        monthlyRate: formData.rateType === "monthly" ? rateNum : null,
        isActive: formData.isActive,
      };

      const result = isEdit && id != null
        ? await updateWaterRateAction(id, payload)
        : await createWaterRateAction(payload);

      if (result.success) {
        toast.success(isEdit ? t("messages.updateSuccess") : t("messages.createSuccess"));
        setOpen(false);
        router.push(listUrl);
      } else {
        toast.error(result.error ?? tCommon("errors.generic"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    open,
    isEdit,
    isSubmitting,
    formData,
    errors,
    showError,
    handleChange,
    handleBlur,
    handleClose,
    handleSubmit,
  };
}
