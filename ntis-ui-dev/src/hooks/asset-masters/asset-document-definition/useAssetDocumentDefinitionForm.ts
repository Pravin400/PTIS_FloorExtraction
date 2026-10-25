"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { parseReferenceBlockedMessage } from "@/lib/utils/asset-utils/shared-error-mapping";
import {
  createAssetDocumentDefinitionAction,
  updateAssetDocumentDefinitionAction,
} from "@/app/[locale]/assets/configuration/master-data/asset-document-definition/action";
import {
  AssetDocumentDefinitionFormModel,
  AssetDocumentDefinition,
} from "@/types/asset-masters/asset-document-definition.types";
import {
  sanitizeFieldValue,
  validateAssetDocumentDefinitionForm,
  resolveDocumentDefinitionBackendError,
} from "./validation";

interface UseAssetDocumentDefinitionFormProps {
  id: number | null;
  initialData?: AssetDocumentDefinition;
  categories: { id: number; name: string }[];
  types: { id: number; name: string }[];
}

export function useAssetDocumentDefinitionForm({
  id,
  initialData,
  categories,
  types,
}: UseAssetDocumentDefinitionFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("assetDocumentDefinition");
  const tCommon = useTranslations("common");
  const isEdit = Boolean(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [open, setOpen] = useState(true);

  const [formData, setFormData] = useState<AssetDocumentDefinitionFormModel>({
    id: id ?? initialData?.id,
    assetCategoryId: initialData?.assetCategoryId ?? null,
    assetTypeId: initialData?.assetTypeId ?? null,
    documentCode: initialData?.documentCode ?? "",
    documentName: initialData?.documentName ?? "",
    description: initialData?.description ?? "",
    isRequired: initialData?.isRequired ?? false,
    displayOrder: initialData?.displayOrder ?? "",
    isActive: initialData?.isActive ?? true,
  });

  const [displayOrderValue, setDisplayOrderValue] = useState<string>(
    initialData?.displayOrder?.toString() ?? ""
  );
  const [errors, setErrors] = useState<Partial<Record<keyof AssetDocumentDefinitionFormModel, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const documentCodeRef = useRef<HTMLInputElement>(null);
  const statusToggleRef = useRef<HTMLButtonElement>(null);

  const categoryOptions = categories.map((c) => ({ label: c.name, value: String(c.id) }));
  const typeOptions = types.map((type) => ({ label: type.name, value: String(type.id) }));

  useEffect(() => {
    if (!open) return;
    const timeoutId = setTimeout(() => {
      if (isEdit && statusToggleRef.current) {
        statusToggleRef.current.focus();
      } else if (!isEdit && documentCodeRef.current) {
        documentCodeRef.current.focus();
      }
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [open, isEdit]);

  const validate = useCallback(
    (data: AssetDocumentDefinitionFormModel): Partial<Record<keyof AssetDocumentDefinitionFormModel, string>> => {
      return validateAssetDocumentDefinitionForm(data, t, isEdit);
    },
    [t, isEdit]
  );

  const showError = useCallback(
    (field: keyof AssetDocumentDefinitionFormModel): boolean =>
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
      const sanitized = sanitizeFieldValue(name, value);
      setFormData((p) => ({ ...p, [name]: sanitized }));
    }
  }, []);

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setTouched((p) => ({ ...p, [name]: true }));
      let sanitized = sanitizeFieldValue(name, value).trim();
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
        const field = name as keyof AssetDocumentDefinitionFormModel;
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
      router.push(`/${locale}/assets/configuration/master-data/asset-document-definition`);
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
    if (Object.keys(v).length) return;
    setIsSubmitting(true);
    try {
      const payload = { ...formData };
      const res = isEdit
        ? await updateAssetDocumentDefinitionAction(payload)
        : await createAssetDocumentDefinitionAction(payload);
      if (!res.success) {
        const { toastMessage, fieldError } = resolveDocumentDefinitionBackendError(
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
        t(isEdit ? "success.updated" : "success.created", { code: payload.documentCode })
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
      const parsed = Number(value);
      const numVal = value && Number.isInteger(parsed) && parsed > 0 ? parsed : null;
      setFormData((p) => {
        const updated =
          name === "assetCategoryId"
            ? { ...p, assetCategoryId: numVal, assetTypeId: null }
            : { ...p, [name]: numVal };

        const errs = validate(updated);
        setErrors((prev) => {
          const err = { ...prev };
          if (name === "assetCategoryId") {
            err.assetCategoryId = errs.assetCategoryId;
            err.assetTypeId = errs.assetTypeId;
          } else {
            const field = name as keyof AssetDocumentDefinitionFormModel;
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
    documentCodeRef,
    statusToggleRef,
    categoryOptions,
    typeOptions,
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
