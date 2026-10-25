import React, { useState, useMemo, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import type { CommonRemark, CommonRemarkFormModel, RemarkCategory } from "@/types/common-remark-master/common-remark.types";
import {
  saveCommonRemarkAction,
  createRemarkCategoryAction,
} from "@/app/[locale]/configuration-settings/common-remark-master/actions";
import {
  validateRemarkType,
  validateCustomRemarkType,
  validateRemark,
  validateIsActive,
} from "@/lib/api/common-remark-master/common-remark-validation";
import { DESCRIPTION_SANITIZE } from "@/lib/utils/validation-rules";
import { getCleanErrorMessage } from "@/lib/utils/backend-error-detection";

interface UseCommonRemarkFormProps {
  id: number | null;
  initialData?: CommonRemark | null;
  categories: RemarkCategory[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function useCommonRemarkForm({
  id,
  initialData,
  categories,
  onSuccess,
  onCancel,
}: UseCommonRemarkFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const [, startTransition] = useTransition();
  const isEdit = id != null;

  const t = useTranslations("remarkMaster");
  const tCommon = useTranslations("common");

  const [addedCategories, setAddedCategories] = useState<RemarkCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CommonRemarkFormModel>({
    id: initialData?.id ?? undefined,
    remarkType: initialData?.remarkTypeId ? String(initialData.remarkTypeId) : "",
    remark: initialData?.remark ?? "",
    isActive: initialData?.isActive ?? true,
  });

  const categoryList = useMemo(() => {
    const list = [...categories];
    for (const cat of addedCategories) {
      if (!list.some((c) => c.id === cat.id)) {
        list.push(cat);
      }
    }
    return list;
  }, [categories, addedCategories]);

  const [customRemarkType, setCustomRemarkType] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState(true);

  const validate = useCallback((data: CommonRemarkFormModel, customTypeVal: string) => {
    const e: Record<string, string> = {};
    const isCustomMode = data.remarkType === "Other";

    if (isCustomMode) {
      const customRemarkTypeErr = validateCustomRemarkType(customTypeVal, data.remarkType, categoryList);
      if (customRemarkTypeErr) {
        e.customRemarkType = t(customRemarkTypeErr) || "Invalid custom remark type.";
      }
    } else {
      const remarkTypeErr = validateRemarkType(data.remarkType);
      if (remarkTypeErr) {
        e.remarkType = t(remarkTypeErr);
      }

      const remarkErr = validateRemark(data.remark);
      if (remarkErr) {
        e.remark = t(remarkErr);
      }

      const isActiveErr = validateIsActive(data.isActive, isEdit);
      if (isActiveErr) {
        e.isActive = t(isActiveErr);
      }
    }

    return e;
  }, [t, isEdit, categoryList]);

  const showError = useCallback((field: string) =>
    touched[field] && !!errors[field],
    [touched, errors]
  );

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let sanitizedValue = value;
    if (name === "remark") {
      sanitizedValue = value.replace(DESCRIPTION_SANITIZE, "");
    }
    setFormData((p) => ({ ...p, [name]: sanitizedValue }));
    setErrors((p) => ({ ...p, [name]: "" }));
  }, []);

  const handleSelectChange = useCallback((
    _e: React.ChangeEvent<HTMLSelectElement>,
    value: string
  ) => {
    setFormData((p) => ({ ...p, remarkType: value }));
    setErrors((p) => ({ ...p, remarkType: "", customRemarkType: "" }));
    if (value !== "Other") {
      setCustomRemarkType("");
    }
  }, []);

  const handleCustomTypeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const sanitizedValue = value.replace(DESCRIPTION_SANITIZE, "");
    setCustomRemarkType(sanitizedValue);
    setErrors((p) => ({ ...p, customRemarkType: "" }));
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));

    let sanitizedValue = value;
    if (name === "remark" || name === "customRemarkType") {
      sanitizedValue = value.replace(DESCRIPTION_SANITIZE, "");
    }

    const valData = { ...formData, [name]: sanitizedValue };
    const ctVal = name === "customRemarkType" ? sanitizedValue : customRemarkType;
    const fieldErrors = validate(valData, ctVal);
    setErrors((p) => ({ ...p, [name]: fieldErrors[name] }));
  }, [formData, customRemarkType, validate]);

  const closeAndRoute = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      startTransition(() => {
        const paramsStr = searchParams.toString();
        router.push(`/${locale}/configuration-settings/common-remark-master${paramsStr ? `?${paramsStr}` : ""}`);
      });
    }, 300);
  }, [router, locale, searchParams]);

  const handleCancel = useCallback(() => {
    onCancel();
    closeAndRoute();
  }, [onCancel, closeAndRoute]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isCustomMode = formData.remarkType === "Other";

    if (isCustomMode) {
      setTouched({ customRemarkType: true });
      const v = validate(formData, customRemarkType);
      setErrors(v);

      if (Object.keys(v).length) {
        toast.error(tCommon("errors.validationError") || "Please fix validation errors");
        return;
      }

      setIsSubmitting(true);

      try {
        const fd = new FormData();
        fd.append("customRemarkType", customRemarkType.trim());
        fd.append("locale", locale);

        const res = await createRemarkCategoryAction(fd);

        if (res?.ok && res.data) {
          const newCat = res.data;
          setAddedCategories((prev) => {
            if (prev.some((c) => c.id === newCat.id)) return prev;
            return [...prev, newCat];
          });
          setFormData((p) => ({ ...p, remarkType: String(newCat.id) }));
          setCustomRemarkType("");
          setTouched({});
          setErrors({});
          toast.success(t("messages.remarkTypeAddSuccess") || "Remark Type added successfully");
          return;
        }

        if (res && !res.ok) {
          if (res.error === "duplicate") {
            const dupMsg = t("form.validation.customRemarkTypeExists") || t("apiErrors.duplicateRecord") || "This remark type already exists.";
            setErrors({
              customRemarkType: dupMsg,
            });
            toast.error(dupMsg);
          } else {
            const rawMessage = res.message || "";
            const cleanMsg = getCleanErrorMessage(rawMessage);

            if (cleanMsg === "RemarkTypeName_Invalid") {
              const translated = t("form.validation.customRemarkTypeFormat") || "Invalid Custom Remark Type format.";
              setErrors((p) => ({ ...p, customRemarkType: translated }));
              toast.error(translated);
            } else {
              toast.error(cleanMsg || tCommon("errors.operationFailed"));
            }
          }
          return;
        }

        toast.error(tCommon("errors.operationFailed"));
      } catch (err: unknown) {
        const error = err as Error;
        toast.error(error?.message || tCommon("errors.operationFailed"));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setTouched({
      remarkType: true,
      remark: true,
    });

    const v = validate(formData, customRemarkType);
    setErrors(v);

    if (Object.keys(v).length) {
      toast.error(tCommon("errors.validationError") || "Please fix validation errors");
      return;
    }

    setIsSubmitting(true);

    try {
      const fd = new FormData();
      if (formData.id) {
        fd.append("id", String(formData.id));
      }
      fd.append("remarkType", formData.remarkType);
      fd.append("remark", formData.remark);
      fd.append("isActive", String(formData.isActive));
      fd.append("locale", locale);

      const res = await saveCommonRemarkAction(isEdit ? String(formData.id) : "", fd);

      if (res?.ok) {
        toast.success(
          res.mode === "update"
            ? t("messages.updateSuccess")
            : t("messages.addSuccess")
        );
        onSuccess();
        closeAndRoute();
        startTransition(() => {
          router.refresh();
        });
        return;
      }

      if (res && !res.ok) {
        if (res.error === "duplicate") {
          setErrors({
            remark: t("apiErrors.duplicateRecord"),
          });
          toast.error(t("apiErrors.duplicateRecord"));
        } else if (res.error === "invalid_remarkType") {
          setErrors({
            remarkType: t("form.validation.remarkTypeRequired"),
          });
          toast.error(t("form.validation.remarkTypeRequired"));
        } else if (res.error === "invalid_remark") {
          setErrors({
            remark: t("form.validation.remarkRequired"),
          });
          toast.error(t("form.validation.remarkRequired"));
        } else if (res.error === "invalid_id") {
          toast.error(t("apiErrors.invalidData"));
        } else {
          const rawMessage = res.message || "";
          const cleanMsg = getCleanErrorMessage(rawMessage);

          if (cleanMsg === "RemarkTypeName_Invalid") {
            const translated = t("form.validation.customRemarkTypeFormat") || "Invalid Custom Remark Type format.";
            setErrors((p) => ({ ...p, customRemarkType: translated }));
            toast.error(translated);
          } else if (cleanMsg === "Remark_Invalid") {
            const translated = t("form.validation.remarkFormat") || "Invalid Remark format.";
            setErrors((p) => ({ ...p, remark: translated }));
            toast.error(translated);
          } else {
            toast.error(cleanMsg || tCommon("errors.operationFailed"));
          }
        }
        return;
      }

      toast.error(tCommon("errors.operationFailed"));
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || tCommon("errors.operationFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = useCallback(() => {
    setFormData((p) => ({ ...p, isActive: !p.isActive }));
  }, []);

  return {
    formData,
    customRemarkType,
    categories: categoryList,
    errors,
    isSubmitting,
    open,
    isEdit,
    t,
    tCommon,
    showError,
    handleChange,
    handleSelectChange,
    handleCustomTypeChange,
    handleBlur,
    handleCancel,
    handleSubmit,
    handleToggleStatus,
  };
}
