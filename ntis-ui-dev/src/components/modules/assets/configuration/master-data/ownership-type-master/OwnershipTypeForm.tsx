"use client";

import type React from "react";
import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, CheckCircle2, X } from "lucide-react";

import { CancelButton, SaveButton, ToggleSwitch, ValidationMessage } from "@/components/common";
import { Drawer } from "@/components/common/Drawer";
import { useTranslations, useLocale } from "next-intl";
import { MandatoryFieldsNotice } from "./MandatoryFieldsNotice";
import { FormFieldsSection } from "./FormFieldsSection";
import type { OwnershipTypeFormModel } from "@/types/asset-masters/ownership-type.types";
import { validateOwnershipTypeForm } from "@/lib/validations/ownership-type-form.validation";
import { useOwnershipTypeSubmit } from "@/hooks/asset-masters/ownership-type/useOwnershipTypeSubmit";
import { DESCRIPTION_SANITIZE, NAME_ONLY_SANITIZE } from "@/lib/utils/asset-validation-rules";
import { cn } from "@/lib/utils/cn";

export function OwnershipTypeForm({ id, initialData }: { id?: number; initialData?: import("@/types/asset-masters/ownership-type.types").OwnershipTypeFormModel | null; }) {
  const router = useRouter();
  const isEdit = id != null;

  const [open, setOpen] = useState(true);

  const t = useTranslations("ownershipType");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const statusToggleRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const timeoutId = setTimeout(() => {
      if (isEdit && statusToggleRef.current) {
        statusToggleRef.current.focus();
      } else if (!isEdit && nameRef.current) {
        nameRef.current.focus();
      }
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [open, isEdit]);

  const [formData, setFormData] = useState<OwnershipTypeFormModel>(
    initialData ?? {
      id: undefined,
      ownershipTypeName: "",
      description: "",
      isActive: true,
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleClose = useCallback(() => {
    setOpen(false);
    router.back();
  }, [router]);

  const validate = useCallback((data: OwnershipTypeFormModel) => {
    return validateOwnershipTypeForm(data, t);
  }, [t]);

  const showError = (field: string) => touched[field] && !!errors[field];

  const sanitizeField = (name: string, value: string) => {
    let newValue = value;
    if (name === "ownershipTypeName") {
      newValue = newValue.replace(NAME_ONLY_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ");
      if (newValue.length > 0) {
        newValue = newValue.charAt(0).toUpperCase() + newValue.slice(1);
      }
    }
    if (name === "description") {
      newValue = newValue.replace(DESCRIPTION_SANITIZE, "").trimStart().replace(/\s{2,}/g, " ");
      if (newValue.length > 100) {
        newValue = newValue.substring(0, 100);
      }
    }
    return newValue;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeField(name, value);

    setFormData((p) => ({ ...p, [name]: sanitizedValue }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));
    
    const sanitizedValue = sanitizeField(name, value);
    setFormData((p) => ({ ...p, [name]: sanitizedValue }));

    const fieldErrors = validate({ ...formData, [name]: sanitizedValue });
    setErrors((p) => ({ ...p, [name]: fieldErrors[name] }));
  };

  const { handleSubmit, isSubmitting } = useOwnershipTypeSubmit({
    isEdit,
    locale,
    formData,
    validate,
    setErrors,
    setTouched,
    setOpen,
    t,
    tCommon,
  });

  const handleToggleStatus = () => {
    setFormData((p) => ({ ...p, isActive: !p.isActive }));
    setErrors((p) => ({ ...p, isActive: "" }));
  };

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      className="border-l-4 border-[#4F6A94]"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md text-white">
            <LayoutGrid size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {isEdit 
                ? t("configuration.masterData.form.editTitle", { name: t("masterNames.ownership-type-master") }) 
                : t("configuration.masterData.form.addTitle", { name: t("masterNames.ownership-type-master") })}
            </div>
            <div className="text-sm text-slate-500">
              {isEdit ? t("configuration.masterData.form.updateSubtitle") : t("configuration.masterData.form.createSubtitle")}
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <CancelButton label={t("configuration.masterData.form.buttons.cancel")} onClick={handleClose} />
          <SaveButton
            label={isEdit ? t("configuration.masterData.form.buttons.update") : t("configuration.masterData.form.buttons.save")}
            type="submit"
            form="ownership-type-form"
            isLoading={isSubmitting}
          />
        </>
      }
    >
      <form id="ownership-type-form" onSubmit={handleSubmit} noValidate className="space-y-6 bg-[#F8FAFF] p-5">
        {isEdit && (
          <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-4">
            <div
              className={cn(
                "rounded-xl p-3 flex items-center justify-between",
                formData.isActive
                  ? "border border-blue-200 bg-[#F0F6FF]"
                  : "border border-gray-200 bg-gray-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-9 w-9 flex items-center justify-center rounded-full",
                    formData.isActive
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-200 text-gray-900"
                  )}
                >
                  {formData.isActive ? <CheckCircle2 size={18} /> : <X size={18} />}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{tCommon("status.label")}</div>
                  <div className="text-sm text-gray-500">
                    {formData.isActive ? ` ${tCommon("status.active")}` : ` ${tCommon("status.inactive")}`}
                  </div>
                </div>
              </div>

              <ToggleSwitch
                ref={statusToggleRef}
                checked={formData.isActive}
                onChange={handleToggleStatus}
                showPopup={false}
                activeLabel={tCommon("status.active")}
                inactiveLabel={tCommon("status.inactive")}
              />
            </div>
            {errors.isActive && (
              <ValidationMessage message={errors.isActive} className="mt-2" />
            )}
          </div>
        )}

        <FormFieldsSection
          nameRef={nameRef}
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
