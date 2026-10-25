"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import {
  createConstructionAction,
  updateConstructionAction,
  getAllConstructionTypesAction,
} from "@/app/[locale]/property-tax/constructiontype/action";
import { ConstructionTypeFormModel, ConstructionType } from "@/types/construction.types";
import {
  CODE_SANITIZE,
  DESCRIPTION_SANITIZE,
  HAS_LETTER_REGEX,
  validateForm,
  commonValidations
} from "@/lib/utils/validation";
import { CONSTRUCTION_CODE_MAX, DESCRIPTION_MAX } from "@/components/modules/property-tax/construction-type-master/constants";

const ENGLISH_SANITIZE = /[^A-Za-z0-9\s\/,.()&-]/g;

interface UseConstructionFormProps {
  id: number | null;
  initialData?: ConstructionType;
  existingItems?: ConstructionType[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function useConstructionForm({
  id,
  initialData,
  existingItems,
  onSuccess,
  onCancel,
}: UseConstructionFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("construction.constructionType");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(id);

  const constructionTypeLabel = useAliasLabel("Construction_Type", t("aliasFallback.entity"));
  const values = useMemo(
    () => ({ constructionType: constructionTypeLabel, entity: constructionTypeLabel }),
    [constructionTypeLabel]
  );

  const [fetchedItems, setFetchedItems] = useState<ConstructionType[]>([]);

  const existingList = useMemo(() => {
    if (existingItems && existingItems.length > 0) {
      return existingItems;
    }
    return fetchedItems;
  }, [existingItems, fetchedItems]);

  React.useEffect(() => {
    if ((!existingItems || existingItems.length === 0) && typeof getAllConstructionTypesAction === "function") {
      getAllConstructionTypesAction()
        .then((items) => {
          if (items && Array.isArray(items)) {
            setFetchedItems(items);
          }
        })
        .catch(() => {});
    }
  }, [existingItems]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [formData, setFormData] = useState<ConstructionTypeFormModel>({
    id: id ?? initialData?.id,
    constructionCode: initialData?.constructionCode ?? "",
    descriptionEnglish: initialData?.descriptionEnglish ?? "",
    description: initialData?.description ?? "",
    searchSequence: initialData?.searchSequence ?? 0,
    isActive: initialData?.isActive ?? true,
  });

  const [searchSequenceValue, setSearchSequenceValue] = useState<string>(
    initialData?.searchSequence?.toString() ?? "0"
  );

  const [errors, setErrors] = useState<Partial<Record<keyof ConstructionTypeFormModel, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = useCallback(
    (data: ConstructionTypeFormModel): Partial<Record<keyof ConstructionTypeFormModel, string>> => {
      const tWithValues = (key: string, v?: Record<string, string | number | Date>) => t(key, { ...values, ...v });
      const schema = {
        constructionCode: commonValidations.masterCode(tWithValues, CONSTRUCTION_CODE_MAX, {
          required: 'form.validation.constructionCodeRequired',
          format: 'form.validation.constructionCodeFormat',
          maxLength: 'form.validation.constructionCodeMaxLength',
        }),
        descriptionEnglish: commonValidations.masterDescription(tWithValues, DESCRIPTION_MAX, {
          required: 'form.validation.descriptionEnglishRequired',
          format: 'form.validation.descriptionEnglishFormat',
          maxLength: 'form.validation.descriptionEnglishMaxLength',
        }),
        description: commonValidations.masterDescription(tWithValues, DESCRIPTION_MAX, {
          required: 'form.validation.descriptionRequired',
          format: 'form.validation.descriptionFormat',
          maxLength: 'form.validation.descriptionMaxLength',
        }),
        searchSequence: commonValidations.masterSearchSequence(tWithValues, 'form.validation.sequenceInvalid'),
        isActive: commonValidations.masterActiveStatus(tWithValues, isEdit, 'form.validation.mustBeActive'),
      };
      const resultErrors = validateForm(data, schema);
      const targetId = id ? Number(id) : (data.id ? Number(data.id) : undefined);

      if (!resultErrors.constructionCode && data.constructionCode?.trim() && existingList.length > 0) {
        const codeNorm = data.constructionCode.trim().toLowerCase();
        if (existingList.some((item) => (targetId ? item.id !== targetId : true) && (item.constructionCode ?? "").trim().toLowerCase() === codeNorm)) {
          resultErrors.constructionCode = t('form.validation.constructionCodeExists', values);
        }
      }

      if (!resultErrors.descriptionEnglish && data.descriptionEnglish?.trim() && existingList.length > 0) {
        const descEngNorm = data.descriptionEnglish.trim().toLowerCase();
        if (existingList.some((item) => (targetId ? item.id !== targetId : true) && (item.descriptionEnglish ?? "").trim().toLowerCase() === descEngNorm)) {
          resultErrors.descriptionEnglish = t('form.validation.descriptionEnglishExists') || t('form.validation.descriptionExists');
        }
      }

      if (!resultErrors.description && data.description?.trim() && existingList.length > 0) {
        const descNorm = data.description.trim().toLowerCase();
        if (existingList.some((item) => (targetId ? item.id !== targetId : true) && (item.description ?? "").trim().toLowerCase() === descNorm)) {
          resultErrors.description = t('form.validation.descriptionExists');
        }
      }

      return resultErrors;
    },
    [t, isEdit, values, existingList, id]
  );

  const showError = useCallback((field: keyof ConstructionTypeFormModel): boolean =>
    (submittedOnce || touched[field]) && !!errors[field],
    [submittedOnce, touched, errors]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;

    let sanitizedValue = value;
    if (name === "descriptionEnglish") {
      sanitizedValue = value.replace(ENGLISH_SANITIZE, "");
      if (sanitizedValue.length > DESCRIPTION_MAX) {
        sanitizedValue = sanitizedValue.substring(0, DESCRIPTION_MAX);
      }
    } else if (name === "description") {
      sanitizedValue = value.replace(DESCRIPTION_SANITIZE, "");
      if (sanitizedValue.length > DESCRIPTION_MAX) {
        sanitizedValue = sanitizedValue.substring(0, DESCRIPTION_MAX);
      }
    } else if (name === "constructionCode") {
      sanitizedValue = value.replace(CODE_SANITIZE, "");
      if (sanitizedValue.length > CONSTRUCTION_CODE_MAX) {
        sanitizedValue = sanitizedValue.substring(0, CONSTRUCTION_CODE_MAX);
      }
    }

    if (name === "searchSequence") {
      // Only allow digits and limit to 3 characters
      const sanitizedValue = value.replace(/[^0-9]/g, "").substring(0, 3);
      setSearchSequenceValue(sanitizedValue);
      setFormData((p) => ({
        ...p,
        searchSequence: sanitizedValue === "" ? 0 : Number(sanitizedValue),
      }));
      return;
    }

    setFormData((p) => ({
      ...p,
      [name]: sanitizedValue,
    }));

    // Real-time duplicate error check outside setFormData
    const targetId = id ? Number(id) : (formData.id ? Number(formData.id) : undefined);
    if (existingList.length > 0) {
      const norm = sanitizedValue.trim().toLowerCase();
      if (name === "descriptionEnglish") {
        const isDup = norm && existingList.some((i) => (targetId ? i.id !== targetId : true) && (i.descriptionEnglish ?? "").trim().toLowerCase() === norm);
        if (isDup) {
          setErrors((prev) => ({ ...prev, descriptionEnglish: t("form.validation.descriptionEnglishExists") || t("form.validation.descriptionExists") }));
        }
      } else if (name === "description") {
        const isDup = norm && existingList.some((i) => (targetId ? i.id !== targetId : true) && (i.description ?? "").trim().toLowerCase() === norm);
        if (isDup) {
          setErrors((prev) => ({ ...prev, description: t("form.validation.descriptionExists") }));
        }
      } else if (name === "constructionCode") {
        const isDup = norm && existingList.some((i) => (targetId ? i.id !== targetId : true) && (i.constructionCode ?? "").trim().toLowerCase() === norm);
        if (isDup) {
          setErrors((prev) => ({ ...prev, constructionCode: t("form.validation.constructionCodeExists", values) }));
        }
      }
    }
  }, [id, formData.id, existingList, t, values]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>): void => {
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
      const fieldName = name as keyof ConstructionTypeFormModel;

      if (fieldErrors[fieldName]) {
        newErrors[fieldName] = fieldErrors[fieldName];
      } else {
        delete newErrors[fieldName];
      }

      return newErrors;
    });
  }, [formData, validate]);

  const mapApiError = useCallback((result: { statusCode?: number; message?: string }) => {
    if (result.message && (result.statusCode === 409 || result.statusCode === 400)) {
      return result.message;
    }

    const errorMap: Record<number, string> = {
      409: t("apiErrors.duplicateRecord", values),
      404: t("apiErrors.notFound", values),
      401: tCommon("errors.unauthorized"),
      403: tCommon("errors.unauthorized"),
    };

    const code = result.statusCode ?? 0;
    if (errorMap[code]) return errorMap[code];

    if (code >= 500) return tCommon("errors.serverError");
    return result.message || t("apiErrors.operationFailed", values);
  }, [t, tCommon, values]);

  const [open, setOpen] = useState(true);
  const [, startTransition] = React.useTransition();

  const closeAndRoute = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      startTransition(() => {
        router.push(`/${locale}/property-tax/constructiontype`);
      });
    }, 400); // Increased delay for smoother animation
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

    // Numbers only not allowed for constructionCode
    if (!HAS_LETTER_REGEX.test(formData.constructionCode)) {
      toast.error(t("form.validation.constructionCodeNumbersOnlyNotAllowed", values));
      return;
    }

    // Numbers only not allowed for descriptionEnglish
    if (formData.descriptionEnglish && !HAS_LETTER_REGEX.test(formData.descriptionEnglish)) {
      toast.error(t("form.validation.descriptionEnglishNumbersOnlyNotAllowed", values));
      return;
    }

    // Numbers only not allowed for description
    if (!HAS_LETTER_REGEX.test(formData.description)) {
      toast.error(t("form.validation.descriptionNumbersOnlyNotAllowed", values));
      return;
    }

    const submitPayload: ConstructionTypeFormModel = {
      id: id ? Number(id) : (formData.id ? Number(formData.id) : undefined),
      constructionCode: formData.constructionCode.trim(),
      descriptionEnglish: formData.descriptionEnglish?.trim() || "",
      description: formData.description.trim(),
      searchSequence: Number(formData.searchSequence) || 0,
      isActive: formData.isActive,
    };

    setIsSubmitting(true);
    try {
      const result = isEdit
        ? await updateConstructionAction(submitPayload)
        : await createConstructionAction(submitPayload);

      if (!result.success) {
        toast.error(mapApiError(result));
        return;
      }

      toast.success(isEdit
        ? t("success.updated", { code: formData.constructionCode, ...values })
        : t("success.created", { code: formData.constructionCode, ...values })
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
    constructionTypeLabel,
  };
}
