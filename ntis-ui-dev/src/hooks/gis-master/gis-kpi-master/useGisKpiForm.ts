"use client";

import { useState, useCallback, useTransition } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import type { GisKpiMasterFormModel, GisKpiMaster } from "@/types/gis-master/gis-kpi-master.types";
import {
  CODE_SANITIZE,
  DESCRIPTION_SANITIZE,
  HAS_LETTER_REGEX,
  validateForm,
  commonValidations,
} from "@/lib/utils/validation";
import {
  createGisKpiAction,
  updateGisKpiAction,
} from "@/app/[locale]/configuration-settings/gis-master/gis-kpi-master/action";
import {
  KPI_CODE_MAX,
  TITLE_MAX,
  ICON_MAX,
  COLOR_MAX,
  HEX_COLOR_REGEX,
} from "@/components/modules/configuration-settings/gis-master/gis-kpi-master/constants";

export interface UseGisKpiFormProps {
  id?: number | null;
  initialData?: GisKpiMaster | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function useGisKpiForm({
  id = null,
  initialData,
  onSuccess = () => { },
  onCancel = () => { },
}: UseGisKpiFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("gisKpiMaster");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [formData, setFormData] = useState<GisKpiMasterFormModel>({
    id: id ?? initialData?.id,
    kpiCode: initialData?.kpiCode ?? "",
    defaultTitle: initialData?.defaultTitle ?? "",
    defaultIcon: initialData?.defaultIcon ?? "building",
    defaultColor: initialData?.defaultColor ?? "#2563EB",
    isActive: initialData?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof GisKpiMasterFormModel, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [prevInitialData, setPrevInitialData] = useState<GisKpiMaster | null | undefined>(initialData);
  if (initialData && initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    setFormData({
      id: id ?? initialData.id,
      kpiCode: initialData.kpiCode ?? "",
      defaultTitle: initialData.defaultTitle ?? "",
      defaultIcon: initialData.defaultIcon ?? "building",
      defaultColor: initialData.defaultColor ?? "#2563EB",
      isActive: initialData.isActive ?? true,
    });
    setIsActive(initialData.isActive ?? true);
  }

  const validate = useCallback(
    (data: GisKpiMasterFormModel): Partial<Record<keyof GisKpiMasterFormModel, string>> => {
      const tWithValues = (key: string, v?: Record<string, string | number | Date>) =>
        t(key, v);

      const schema = {
        kpiCode: commonValidations.masterCode(tWithValues, KPI_CODE_MAX, {
          required: "form.validation.kpiCodeRequired",
          format: "form.validation.kpiCodeFormat",
          maxLength: "form.validation.kpiCodeMaxLength",
        }),
        defaultTitle: commonValidations.masterDescription(tWithValues, TITLE_MAX, {
          required: "form.validation.defaultTitleRequired",
          format: "form.validation.defaultTitleFormat",
          maxLength: "form.validation.defaultTitleMaxLength",
        }),
        defaultIcon: (val: unknown) => {
          if (!val || typeof val !== "string" || !val.trim()) {
            return t("form.validation.defaultIconRequired");
          }
          if (val.trim().length > ICON_MAX) {
            return t("form.validation.defaultIconMaxLength");
          }
          return undefined;
        },
        defaultColor: (val: unknown) => {
          if (!val || typeof val !== "string" || !val.trim()) {
            return t("form.validation.defaultColorRequired");
          }
          if (!HEX_COLOR_REGEX.test(val.trim())) {
            return t("form.validation.defaultColorFormat");
          }
          return undefined;
        },
        isActive: commonValidations.masterActiveStatus(tWithValues, isEdit, "form.validation.mustBeActive"),
      };

      return validateForm(data, schema);
    },
    [t, isEdit]
  );

  const showError = useCallback(
    (field: keyof GisKpiMasterFormModel): boolean =>
      (submittedOnce || touched[field]) && !!errors[field],
    [submittedOnce, touched, errors]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;

    let sanitizedValue = value;
    if (name === "kpiCode") {
      sanitizedValue = value.replace(CODE_SANITIZE, "");
      if (sanitizedValue.length > KPI_CODE_MAX) {
        sanitizedValue = sanitizedValue.substring(0, KPI_CODE_MAX);
      }
    } else if (name === "defaultTitle") {
      sanitizedValue = value.replace(DESCRIPTION_SANITIZE, "");
      if (sanitizedValue.length > TITLE_MAX) {
        sanitizedValue = sanitizedValue.substring(0, TITLE_MAX);
      }
    } else if (name === "defaultIcon") {
      sanitizedValue = value.substring(0, ICON_MAX);
    } else if (name === "defaultColor") {
      sanitizedValue = value.substring(0, COLOR_MAX);
    }

    setFormData((p) => ({
      ...p,
      [name]: sanitizedValue,
    }));
  }, []);

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>): void => {
      const { name, value } = e.target;
      setTouched((p) => ({ ...p, [name]: true }));

      const updatedFormData = {
        ...formData,
        [name]: value.trim(),
      };

      setFormData(updatedFormData);

      const fieldErrors = validate(updatedFormData);
      setErrors((p) => {
        const newErrors = { ...p };
        const fieldName = name as keyof GisKpiMasterFormModel;

        if (fieldErrors[fieldName]) {
          newErrors[fieldName] = fieldErrors[fieldName];
        } else {
          delete newErrors[fieldName];
        }

        return newErrors;
      });
    },
    [formData, validate]
  );

  const mapApiError = useCallback(
    (result: { statusCode?: number; message?: string }) => {
      const errorMap: Record<number, string> = {
        409: t("apiErrors.duplicateRecord"),
        404: t("apiErrors.notFound"),
        401: tCommon("errors.unauthorized"),
        403: tCommon("errors.unauthorized"),
      };

      const code = result.statusCode ?? 0;
      if (errorMap[code]) return errorMap[code];

      if (code === 400) {
        const msg = result.message?.toLowerCase() || "";
        if (msg.includes("duplicate") || msg.includes("already exists")) {
          return t("apiErrors.duplicateRecord");
        }
        return result.message || t("apiErrors.invalidData");
      }

      if (code >= 500) return tCommon("errors.serverError");
      return result.message || t("apiErrors.operationFailed");
    },
    [t, tCommon]
  );

  const [open, setOpen] = useState(true);
  const [, startTransition] = useTransition();

  const closeAndRoute = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      startTransition(() => {
        router.push(`/${locale}/configuration-settings/gis-master/gis-kpi-master`);
      });
    }, 400);
  }, [router, locale]);

  const handleCancel = useCallback(() => {
    onCancel?.();
    closeAndRoute();
  }, [onCancel, closeAndRoute]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmittedOnce(true);

    const v = validate(formData);
    setErrors(v);

    if (Object.keys(v).length) return;

    if (!HAS_LETTER_REGEX.test(formData.kpiCode)) {
      toast.error(t("form.validation.kpiCodeNumbersOnlyNotAllowed"));
      return;
    }

    if (!HAS_LETTER_REGEX.test(formData.defaultTitle)) {
      toast.error(t("form.validation.defaultTitleNumbersOnlyNotAllowed"));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = isEdit
        ? await updateGisKpiAction(formData)
        : await createGisKpiAction(formData);

      if (!result.success) {
        toast.error(mapApiError(result));
        return;
      }

      toast.success(
        isEdit
          ? t("success.updated", { code: formData.kpiCode })
          : t("success.created", { code: formData.kpiCode })
      );

      onSuccess?.();
      startTransition(() => {
        router.refresh();
        closeAndRoute();
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = useCallback((): void => {
    setIsActive((prev) => {
      const newValue = !prev;
      setFormData((p) => ({ ...p, isActive: newValue }));
      return newValue;
    });
  }, []);

  return {
    formData,
    setFormData,
    errors,
    isSubmitting,
    isActive,
    open,
    setOpen,
    handleChange,
    handleBlur,
    handleSubmit,
    handleToggleStatus,
    handleCancel,
    showError,
    t,
    tCommon,
    isEdit,
  };
}
