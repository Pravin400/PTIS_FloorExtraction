"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { parseReferenceBlockedMessage } from "@/lib/utils/asset-utils/shared-error-mapping";
import {
  createAssetFieldDefinitionAction,
  updateAssetFieldDefinitionAction,
} from "@/app/[locale]/assets/configuration/master-data/asset-field-definition/action";
import {
  AssetFieldDefinitionFormModel,
  AssetFieldDefinition,
} from "@/types/asset-masters/asset-field-definition.types";
import {
  sanitizeFieldDefinitionValue,
  validateAssetFieldDefinitionForm,
  formatOptionsJson,
  parseOptionsJsonToDisplay,
  resolveFieldDefinitionBackendError,
} from "./validation";

interface UseAssetFieldDefinitionFormProps {
  id: number | null;
  initialData?: AssetFieldDefinition;
  categories: { id: number; name: string }[];
  types: { id: number; name: string }[];
  fieldGroups?: string[];
}

export function useAssetFieldDefinitionForm({
  id,
  initialData,
  categories,
  types,
  fieldGroups = [],
}: UseAssetFieldDefinitionFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("assetFieldDefinition");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [open, setOpen] = useState(true);

  const [formData, setFormData] = useState<AssetFieldDefinitionFormModel>({
    id: id ?? initialData?.id,
    assetCategoryId: initialData?.assetCategoryId ?? 0,
    assetTypeId: initialData?.assetTypeId ?? 0,
    fieldCode: initialData?.fieldCode ?? "",
    fieldName: initialData?.fieldName ?? "",
    fieldLabel: initialData?.fieldLabel ?? "",
    fieldType: initialData?.fieldType ?? "text",
    fieldGroup: initialData?.fieldGroup ?? "",
    optionsJson: parseOptionsJsonToDisplay(initialData?.optionsJson),
    isRequired: initialData?.isRequired ?? false,
    displayOrder: initialData?.displayOrder ?? "",
    isActive: initialData?.isActive ?? true,
  });

  const [displayOrderValue, setDisplayOrderValue] = useState<string>(
    initialData?.displayOrder?.toString() ?? ""
  );
  const [errors, setErrors] = useState<Partial<Record<keyof AssetFieldDefinitionFormModel, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const fieldCodeRef = useRef<HTMLInputElement>(null);
  const statusToggleRef = useRef<HTMLButtonElement>(null);

  const categoryOptions = categories.map((c) => ({ label: c.name, value: String(c.id) }));
  const typeOptions = types.map((type) => ({ label: type.name, value: String(type.id) }));
  const groupOptions = fieldGroups.map((g) => ({ label: g, value: g }));

  useEffect(() => {
    if (!open) return;
    const timeoutId = setTimeout(() => {
      if (isEdit && statusToggleRef.current) {
        statusToggleRef.current.focus();
      } else if (!isEdit && fieldCodeRef.current) {
        fieldCodeRef.current.focus();
      }
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [open, isEdit]);

  const validate = useCallback(
    (data: AssetFieldDefinitionFormModel): Partial<Record<keyof AssetFieldDefinitionFormModel, string>> => {
      return validateAssetFieldDefinitionForm(data, t, isEdit);
    },
    [t, isEdit]
  );

  const showError = useCallback(
    (field: keyof AssetFieldDefinitionFormModel): boolean =>
      (submittedOnce || touched[field]) && !!errors[field],
    [submittedOnce, touched, errors]
  );

  const pushCategoryQuery = useCallback(
    (assetCategoryId: number | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (assetCategoryId && assetCategoryId > 0) {
        params.set("assetCategoryId", String(assetCategoryId));
      } else {
        params.delete("assetCategoryId");
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "displayOrder") {
      const val = value.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "").substring(0, 5);
      setDisplayOrderValue(val);
      setFormData((p) => ({ ...p, displayOrder: val === "" ? Number.NaN : Number(val) }));
    } else {
      const sanitized = sanitizeFieldDefinitionValue(name, value);
      setFormData((p) => ({ ...p, [name]: sanitized }));
    }
  }, []);

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setTouched((p) => ({ ...p, [name]: true }));
      let sanitized = sanitizeFieldDefinitionValue(name, value).trim();
      if (name === "displayOrder") {
        sanitized = value.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "").substring(0, 5);
        setDisplayOrderValue(sanitized);
      }
      const updated = {
        ...formData,
        [name]: name === "displayOrder" ? (sanitized === "" ? Number.NaN : Number(sanitized)) : sanitized,
      };
      setFormData(updated);
      const fieldErrors = validate(updated);
      setErrors((p) => {
        const err = { ...p };
        const field = name as keyof AssetFieldDefinitionFormModel;
        if (fieldErrors[field]) err[field] = fieldErrors[field];
        else delete err[field];
        return err;
      });
    },
    [formData, validate]
  );

  const closeAndRoute = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      router.push(`/${locale}/assets/configuration/master-data/asset-field-definition`);
    }, 400);
  }, [router, locale]);

  const handleCancel = useCallback(() => {
    closeAndRoute();
  }, [closeAndRoute]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedOnce(true);
    const v = validate(formData);
    setErrors(v);
    if (Object.keys(v).length) {
      const FIELD_ORDER: (keyof AssetFieldDefinitionFormModel)[] = [
        "fieldCode",
        "fieldName",
        "fieldLabel",
        "fieldType",
        "optionsJson",
        "fieldGroup",
        "displayOrder",
        "assetCategoryId",
        "assetTypeId",
        "isActive",
      ];
      const firstErrorField = FIELD_ORDER.find((field) => v[field]);
      if (firstErrorField) {
        setTimeout(() => {
          if (firstErrorField === "fieldCode" && fieldCodeRef.current) {
            fieldCodeRef.current.focus();
            return;
          }
          const el =
            document.getElementById(firstErrorField) ||
            document.querySelector<HTMLElement>(`[name="${firstErrorField}"]`);
          if (el) {
            el.focus();
          }
        }, 50);
      }
      return;
    }
    setIsSubmitting(true);
    try {
      const isOptionType = ["checkbox", "radio", "select"].includes(formData.fieldType);
      const formattedOptions = isOptionType ? formatOptionsJson(formData.optionsJson) : null;

      const payload = {
        ...formData,
        fieldLabel: formData.fieldLabel.trim(),
        fieldCode: formData.fieldCode.trim(),
        fieldName: formData.fieldName.trim(),
        optionsJson: formattedOptions ?? undefined,
      };
      const res = isEdit
        ? await updateAssetFieldDefinitionAction(payload)
        : await createAssetFieldDefinitionAction(payload);
      if (!res.success) {
        const { toastMessage, fieldError } = resolveFieldDefinitionBackendError(
          res.message,
          t,
          tCommon
        );
        toast.error(toastMessage);
        if (parseReferenceBlockedMessage(res.message)?.operation === "deactivate") {
          setErrors((prev) => ({ ...prev, isActive: toastMessage }));
        }
        if (fieldError) {
          setErrors((prev) => ({ ...prev, [fieldError.field]: fieldError.message }));
          setTouched((prev) => ({ ...prev, [fieldError.field]: true }));
        }
        return;
      }
      toast.success(
        t(isEdit ? "success.updated" : "success.created", { code: payload.fieldCode })
      );
      closeAndRoute();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = useCallback((checked: boolean) => {
    setIsActive(checked);
    setFormData((p) => ({ ...p, isActive: checked }));
    setErrors((p) => ({ ...p, isActive: "" }));
  }, []);

  const handleToggleRequired = useCallback((checked: boolean) => {
    setFormData((p) => ({ ...p, isRequired: checked }));
  }, []);

  const handleSelectChange = useCallback(
    (name: string, value: string) => {
      if (name === "fieldType" || name === "fieldGroup") {
        setFormData((p) => {
          const isOptionType = ["checkbox", "radio", "select"].includes(
            name === "fieldType" ? value : p.fieldType
          );
          const updated = {
            ...p,
            [name]: value,
            ...(name === "fieldType" && !isOptionType ? { optionsJson: "" } : {}),
          };
          const errs = validate(updated);
          setErrors((prev) => {
            const err = { ...prev };
            const field = name as keyof AssetFieldDefinitionFormModel;
            if (errs[field]) err[field] = errs[field];
            else delete err[field];
            if (name === "fieldType") {
              delete err.optionsJson;
            }
            return err;
          });
          if (name === "fieldType") {
            setTouched((prev) => ({ ...prev, optionsJson: false }));
          }
          return updated;
        });
        return;
      }
      const parsed = Number(value);
      const numVal = value && Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
      setFormData((p) => {
        const updated =
          name === "assetCategoryId"
            ? { ...p, assetCategoryId: numVal, assetTypeId: 0 }
            : { ...p, [name]: numVal };

        const errs = validate(updated);
        setErrors((prev) => {
          const err = { ...prev };
          if (name === "assetCategoryId") {
            err.assetCategoryId = errs.assetCategoryId;
            err.assetTypeId = errs.assetTypeId;
          } else {
            const field = name as keyof AssetFieldDefinitionFormModel;
            if (errs[field]) err[field] = errs[field];
            else delete err[field];
          }
          return err;
        });
        return updated;
      });

      if (name === "assetCategoryId") {
        pushCategoryQuery(numVal);
      }
    },
    [pushCategoryQuery, validate]
  );

  return {
    isEdit,
    t,
    tCommon,
    open,
    isSubmitting,
    isActive,
    formData,
    displayOrderValue,
    errors,
    fieldCodeRef,
    statusToggleRef,
    categoryOptions,
    typeOptions,
    groupOptions,
    showError,
    handleChange,
    handleBlur,
    handleCancel,
    handleSubmit,
    handleToggleStatus,
    handleToggleRequired,
    handleSelectChange,
  };
}
