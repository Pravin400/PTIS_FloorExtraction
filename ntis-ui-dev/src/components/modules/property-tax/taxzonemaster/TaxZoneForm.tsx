"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { toast } from "sonner";

import { CancelButton, SaveButton } from "@/components/common";
import type { TaxZoneFormModel } from "@/types/taxzone.types";
import { saveTaxZone } from "@/app/[locale]/property-tax/taxzone-master/taxzone/action";
import { Drawer } from "@/components/common/Drawer";
import { useTranslations, useLocale } from "next-intl";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import { CODE_REGEX, CODE_SANITIZE, DESCRIPTION_REGEX, isAllZeros, sanitizeMultilingualText } from "@/lib/utils/validation-rules";
import { getUserIdFromCookie } from "@/lib/utils/cookie";
import { StatusToggleCard } from "./StatusToggleCard";
import { FormFieldsSection } from "./FormFieldsSection";
import { MandatoryFieldsNotice } from "./MandatoryFieldsNotice";



const ZONE_NO_MAX = 10;

export interface TaxZoneFormProps {
  initialData: TaxZoneFormModel | null;
}

export default function TaxZoneForm({ initialData }: TaxZoneFormProps) {
  const router = useRouter();
  const isEdit = initialData?.id != null;

  const [open, setOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = useTranslations("taxZone");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const zoneLabel = useAliasLabel("Tax Zone", t("aliasFallback.taxZone"));

  // ✅ Initialize form data from server-side props
  const [formData, setFormData] = useState<TaxZoneFormModel>(
    initialData ?? {
      id: undefined,
      taxZoneNo: "",
      taxZoneType: "",
      remark: "",
      isActive: true,
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleClose = useCallback(() => {
    setOpen(false);
    router.push(`/${locale}/property-tax/taxzone-master/taxzone`);
  }, [router, locale]);

  const validate = useCallback((data: TaxZoneFormModel) => {
    const e: Record<string, string> = {};

    // Zone No: Use CODE_REGEX (alphanumeric, underscore only in between)
    if (!data.taxZoneNo.trim()) {
      e.taxZoneNo = t("form.validation.zoneNoRequired", { zone: zoneLabel })
    } else if (isAllZeros(data.taxZoneNo)) {
      e.taxZoneNo = t("form.validation.zoneNoAllZeros", { zone: zoneLabel });
    } else if (data.taxZoneNo.length > ZONE_NO_MAX) {
      e.taxZoneNo = t("form.validation.zoneNoMax");
    } else if (!CODE_REGEX.test(data.taxZoneNo)) {
      e.taxZoneNo = t("form.validation.zoneNoFormat")
    }

    // Zone Type: Use DESCRIPTION_REGEX (special chars in between, single space only)
    if (!data.taxZoneType.trim()) {
      e.taxZoneType = t("form.validation.zoneTypeRequired", { zone: zoneLabel });
    } else if (isAllZeros(data.taxZoneType)) {
      e.taxZoneType = t("form.validation.zoneTypeAllZeros", { zone: zoneLabel });
    } else if (!DESCRIPTION_REGEX.test(data.taxZoneType)) {
      e.taxZoneType = t("form.validation.zoneTypeFormat");
    }
    else if (data.taxZoneType.length > 15) {
      e.taxZoneType = t("form.validation.zoneTypeMax");
    }

    // Remark: Use DESCRIPTION_REGEX (special chars in between, single space only)
    if (!data.remark?.trim()) {
      e.remark = t("form.validation.remarkRequired", { zone: zoneLabel });
    } else if (isAllZeros(data.remark)) {
      e.remark = t("form.validation.remarkAllZeros");
    } else if (!DESCRIPTION_REGEX.test(data.remark)) {
      e.remark = t("form.validation.remarkFormat");
    }
    else if (data.remark.length > 15) {
      e.remark = t("form.validation.remarkMax");
    }

    return e;
  }, [t, zoneLabel]);

  const showError = (field: keyof TaxZoneFormModel) =>
    touched[field] && !!errors[field];

  // ✅ No need for useEffect - data comes from server via props

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "taxZoneNo") {
      if (newValue.length > ZONE_NO_MAX) return;
      newValue = newValue.replace(CODE_SANITIZE, ""); // Sanitize Zone No (alphanumeric and underscore)
    }

    let isMaxLengthReached = false;
    if (name === "taxZoneType" || name === "remark") {
      // Remove numbers, then use the existing multilingual text sanitizer
      const noNumbers = newValue.replace(/[\p{N}]/gu, "");
      newValue = sanitizeMultilingualText(noNumbers, 15);
      
      if (newValue.length === 15) {
        isMaxLengthReached = true;
      }
    }

    setFormData((p) => ({ ...p, [name]: newValue }));

    if (isMaxLengthReached) {
      setErrors((p) => ({
        ...p,
        [name]: name === "taxZoneType" ? t("form.validation.zoneTypeMax") : t("form.validation.remarkMax")
      }));
      setTouched((p) => ({ ...p, [name]: true }));
    } else {
      // ✅ Clear existing error while typing
      setErrors((p) => ({ ...p, [name]: "" }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));

    const fieldErrors = validate({ ...formData, [name]: value });
    setErrors((p) => ({ ...p, [name]: fieldErrors[name] }));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched on submit
    setTouched({
      taxZoneNo: true,
      taxZoneType: true,
      remark: true,
    });

    // 1) basic required/regex validation
    const v = validate(formData);
    setErrors(v);

    if (Object.keys(v).length) {
      toast.error(t("form.validation.fixErrors") || "Please fix validation errors");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare FormData
      const fd = new FormData();
      fd.append("taxZoneNo", formData.taxZoneNo);
      fd.append("taxZoneType", formData.taxZoneType);
      fd.append("remark", formData.remark);
      fd.append("isActive", String(formData.isActive));
      fd.append("locale", locale);

      const userId = getUserIdFromCookie();
      if (userId) {
        if (isEdit) {
          fd.append("updatedBy", String(userId));
        } else {
          fd.append("createdBy", String(userId));
        }
      }

      const res = await saveTaxZone(isEdit ? String(formData.id) : "", fd);

      if (res?.ok) {
        toast.success(
          res.mode === "update"
            ? t("form.messages.updateSuccess", { zone: zoneLabel })
            : t("form.messages.createSuccess", { zone: zoneLabel })
        );
        setOpen(false);
        router.push(`/${locale}/property-tax/taxzone-master/taxzone`);
        router.refresh();
        return;
      }

      // Handle specific error types
      if (res && !res.ok) {
        if (res.error === "duplicate") {
          toast.error(
            t("form.validation.duplicateError", { zone: zoneLabel })
          );
        } else if (res.error === "invalid_id") {
          toast.error(t("form.messages.invalidIdError"));
        } else {
          toast.error(t("form.messages.error", { zone: zoneLabel }));
        }
        return;
      }

      toast.error(t("form.messages.error", { zone: zoneLabel }));
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message ?? t("form.messages.error", { zone: zoneLabel }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = () => {
    setFormData((p) => ({ ...p, isActive: !p.isActive }));
  };

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      className="border-l-4 border-[#4F6A94]"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md text-white shadow">
            <MapPin size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {isEdit ? t("form.editTitle", { zone: zoneLabel }) : t("form.addTitle", { zone: zoneLabel })}
            </div>
            <div className="text-sm text-slate-500">
              {isEdit ? t("form.editSubtitle", { zone: zoneLabel }) : t("form.subtitle", { zone: zoneLabel })}
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <CancelButton
            label={t("form.actions.cancel")}
            onClick={handleClose}
          />
          <SaveButton
            label={isEdit ? t("form.actions.update") : t("form.actions.save")}
            type="submit"
            form="form"
            isLoading={isSubmitting}
          />
        </>
      }
    >
      <form id="form" onSubmit={handleSubmit} className="space-y-6 bg-[#F8FAFF] p-5">
        {isEdit && (
          <StatusToggleCard
            isActive={formData.isActive}
            onToggle={handleToggleStatus}
            activeLabel={t("form.status.active", { zone: zoneLabel })}
            inactiveLabel={t("form.status.inactive", { zone: zoneLabel })}
            statusLabel={t("form.status.label")}
          />
        )}

        <FormFieldsSection
          formData={formData}
          errors={errors}
          showError={showError}
          onChange={handleChange}
          onBlur={handleBlur}
          t={t}
        />

        <MandatoryFieldsNotice message={tCommon("note.mandatory")} />
      </form>
    </Drawer>
  );
}

