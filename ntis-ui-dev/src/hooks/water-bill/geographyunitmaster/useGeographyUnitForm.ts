"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  createGeographyUnitAction,
  updateGeographyUnitAction,
  fetchGeographyTypeOptionsAction,
  fetchParentUnitCandidatesAction,
} from "@/app/[locale]/water-bill/geography-unit-master/action";
import { GeographyUnitFormModel, GeographyUnit, ParentGeographyUnitCandidate } from "@/types/water-bill/geographyUnit.types";
import type { GeographyType } from "@/types/water-bill/geographyType.types";
import {
  CODE_SANITIZE,
  DESCRIPTION_SANITIZE,
  HAS_LETTER_REGEX,
  validateForm,
  commonValidations,
} from "@/lib/utils/validation";
import { UNIT_CODE_MAX, UNIT_NAME_MAX } from "@/components/modules/water-bill/geography-unit-master/constants";

interface UseGeographyUnitFormProps {
  id: number | null;
  initialData?: GeographyUnit;
  onSuccess: () => void;
  onCancel: () => void;
}

export function useGeographyUnitForm({
  id,
  initialData,
  onSuccess,
  onCancel,
}: UseGeographyUnitFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("geographyUnitMaster");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [formData, setFormData] = useState<GeographyUnitFormModel>({
    id: id ?? initialData?.id,
    geographyTypeId: initialData?.geographyTypeId ? initialData.geographyTypeId : "",
    parentGeographyUnitId: initialData?.parentGeographyUnitId ?? null,
    geographyUnitCode: initialData?.geographyUnitCode ?? "",
    geographyUnitName: initialData?.geographyUnitName ?? "",
    searchSequence: initialData?.searchSequence ?? 0,
    isActive: initialData?.isActive ?? true,
  });

  const [searchSequenceValue, setSearchSequenceValue] = useState<string>(
    initialData?.searchSequence?.toString() ?? "0"
  );

  const [geographyTypeOptions, setGeographyTypeOptions] = useState<GeographyType[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [fetchedParentOptions, setFetchedParentOptions] = useState<{
    typeId: number;
    candidates: ParentGeographyUnitCandidate[];
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchGeographyTypeOptionsAction()
      .then((types) => {
        if (!isMounted) return;
        setGeographyTypeOptions(types);
      })
      .finally(() => {
        if (isMounted) setOptionsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const selfId = id ?? initialData?.id;
  const geographyTypeId = formData.geographyTypeId;
  const typeId = geographyTypeId === "" ? 0 : Number(geographyTypeId);

  useEffect(() => {
    if (typeId <= 0) return;
    let isMounted = true;
    fetchParentUnitCandidatesAction(typeId).then((candidates) => {
      if (!isMounted) return;
      setFetchedParentOptions({ typeId, candidates });
    });
    return () => {
      isMounted = false;
    };
  }, [typeId]);

  const parentOptionsLoading = typeId > 0 && fetchedParentOptions?.typeId !== typeId;
  const parentUnitOptions =
    typeId > 0 && fetchedParentOptions?.typeId === typeId
      ? fetchedParentOptions.candidates.filter((c) => c.id !== selfId) // A unit cannot be its own parent.
      : [];

  const [errors, setErrors] = useState<Partial<Record<keyof GeographyUnitFormModel, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = useCallback(
    (data: GeographyUnitFormModel): Partial<Record<keyof GeographyUnitFormModel, string>> => {
      const schema = {
        geographyUnitCode: commonValidations.masterCode(t, UNIT_CODE_MAX, {
          required: "form.validation.unitCodeRequired",
          format: "form.validation.unitCodeFormat",
          maxLength: "form.validation.unitCodeMaxLength",
        }),
        geographyUnitName: commonValidations.masterDescription(t, UNIT_NAME_MAX, {
          required: "form.validation.unitNameRequired",
          format: "form.validation.unitNameFormat",
          maxLength: "form.validation.unitNameMaxLength",
        }),
        searchSequence: commonValidations.masterSearchSequence(t, "form.validation.sequenceInvalid"),
        isActive: commonValidations.masterActiveStatus(t, isEdit, "form.validation.mustBeActive"),
      };
      const result = validateForm(data, schema);
      if (!data.geographyTypeId || Number(data.geographyTypeId) <= 0) {
        result.geographyTypeId = t("form.validation.geographyTypeRequired");
      }
      return result;
    },
    [t, isEdit]
  );

  const showError = useCallback(
    (field: keyof GeographyUnitFormModel): boolean => (submittedOnce || touched[field]) && !!errors[field],
    [submittedOnce, touched, errors]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;

    let sanitizedValue = value;
    if (name === "geographyUnitName") {
      sanitizedValue = value.replace(DESCRIPTION_SANITIZE, "");
      if (sanitizedValue.length > UNIT_NAME_MAX) {
        sanitizedValue = sanitizedValue.substring(0, UNIT_NAME_MAX);
      }
    } else if (name === "geographyUnitCode") {
      sanitizedValue = value.replace(CODE_SANITIZE, "");
      if (sanitizedValue.length > UNIT_CODE_MAX) {
        sanitizedValue = sanitizedValue.substring(0, UNIT_CODE_MAX);
      }
      sanitizedValue = sanitizedValue.toUpperCase();
    }

    if (name === "searchSequence") {
      const sanitized = value.replace(/[^0-9]/g, "").substring(0, 3);
      setSearchSequenceValue(sanitized);
      setFormData((p) => ({
        ...p,
        searchSequence: sanitized === "" ? 0 : Number(sanitized),
      }));
      return;
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

      let sanitizedValue = value;
      if (name === "searchSequence" && value === "") {
        sanitizedValue = "0";
        setSearchSequenceValue("0");
      }

      const updatedFormData = {
        ...formData,
        [name]: name === "searchSequence" ? Number(sanitizedValue || 0) : sanitizedValue,
      };

      setFormData(updatedFormData);

      const fieldErrors = validate(updatedFormData);
      setErrors((p) => {
        const newErrors = { ...p };
        const fieldName = name as keyof GeographyUnitFormModel;

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

  const handleGeographyTypeChange = useCallback((value: string) => {
    setTouched((p) => ({ ...p, geographyTypeId: true }));
    setFormData((p) => ({
      ...p,
      geographyTypeId: value === "" ? "" : Number(value),
      parentGeographyUnitId: null,
    }));
    setErrors((p) => {
      const newErrors = { ...p };
      if (value) {
        delete newErrors.geographyTypeId;
      }
      return newErrors;
    });
  }, []);

  const handleParentUnitChange = useCallback((value: string) => {
    setFormData((p) => ({ ...p, parentGeographyUnitId: value === "" ? null : Number(value) }));
  }, []);

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
  const [, startTransition] = React.useTransition();

  const closeAndRoute = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      startTransition(() => {
        router.push(`/${locale}/water-bill/geography-unit-master`);
      });
    }, 400);
  }, [router, locale]);

  const handleCancel = useCallback(() => {
    onCancel();
    closeAndRoute();
  }, [onCancel, closeAndRoute]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmittedOnce(true);

    const v = validate(formData);
    setErrors(v);

    if (Object.keys(v).length) return;

    if (!HAS_LETTER_REGEX.test(formData.geographyUnitCode)) {
      toast.error(t("form.validation.unitCodeNumbersOnlyNotAllowed"));
      return;
    }

    if (!HAS_LETTER_REGEX.test(formData.geographyUnitName)) {
      toast.error(t("form.validation.unitNameNumbersOnlyNotAllowed"));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = isEdit
        ? await updateGeographyUnitAction(formData)
        : await createGeographyUnitAction(formData);

      if (!result.success) {
        toast.error(mapApiError(result));
        return;
      }

      toast.success(
        isEdit
          ? t("success.updated", { code: formData.geographyUnitCode })
          : t("success.created", { code: formData.geographyUnitCode })
      );

      onSuccess();
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
    searchSequenceValue,
    errors,
    isSubmitting,
    isActive,
    open,
    geographyTypeOptions,
    parentUnitOptions,
    optionsLoading,
    parentOptionsLoading,
    handleChange,
    handleBlur,
    handleGeographyTypeChange,
    handleParentUnitChange,
    handleSubmit,
    handleToggleStatus,
    handleCancel,
    showError,
    t,
    tCommon,
    isEdit,
  };
}
