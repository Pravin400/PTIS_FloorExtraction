"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, AlertCircle, CheckCircle2, X } from "lucide-react";
import {
  CancelButton,
  SaveButton,
  ToggleSwitch,
  ValidationMessage,
} from "@/components/common";
import { Drawer } from "@/components/common/Drawer";
import { cn } from "@/lib/utils/cn";
import { useTranslations, useLocale } from "next-intl";
import { FormFieldsSection } from "./FormFieldsSection";

import type { InventoryNameFormModel, InventoryNameFormProps } from "@/types/asset-masters/inventory-name.types";
import { validateInventoryNameForm } from "@/hooks/asset-masters/inventory-name/validation";
import type { InventoryConditionCategory } from "@/types/asset-masters/inventory-condition.types";
import { useInventoryNameSubmit } from "@/hooks/asset-masters/inventory-name/useInventoryNameSubmit";
import { useInventoryNameForm } from "@/hooks/asset-masters/inventory-name/useInventoryNameForm";

export function InventoryNameForm({ id, initialData, categories }: InventoryNameFormProps) {
  const router = useRouter();
  const isEdit = id != null;

  const [open, setOpen] = useState(true);

  const t = useTranslations("inventoryName");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const statusToggleRef = useRef<HTMLButtonElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const timeoutId = setTimeout(() => {
      if (isEdit && statusToggleRef.current) {
        statusToggleRef.current.focus();
      } else if (!isEdit && codeRef.current) {
        codeRef.current.focus();
      }
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [open, isEdit]);

  const handleClose = useCallback(() => {
    setOpen(false);
    router.back();
  }, [router]);

  const validate = useCallback((data: InventoryNameFormModel) => {
    return validateInventoryNameForm(data, t, isEdit);
  }, [t, isEdit]);

  const {
    formData,
    errors,
    touched,
    submittedOnce,
    setSubmittedOnce,
    handleChange,
    handleSelectChange,
    handleBlur,
    handleToggleStatus,
    setErrors,
    setTouched,
  } = useInventoryNameForm(initialData, validate);

  const categoryOptions = useMemo(() => {
    return (categories || []).map((g: InventoryConditionCategory) => ({ label: g.categoryName, value: String(g.id) }));
  }, [categories]);

  const showError = (field: string) => (submittedOnce || touched[field]) && !!errors[field as keyof InventoryNameFormModel];

  const { handleSubmit, isSubmitting } = useInventoryNameSubmit({
    isEdit,
    locale,
    formData,
    validate,
    setErrors,
    setTouched,
    setSubmittedOnce,
    setOpen,
    t,
    tCommon,
  });

  const isActive = formData.isActive;

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
                ? t("configuration.masterData.form.editTitle", { name: t("masterNames.inventory-name-master") }) 
                : t("configuration.masterData.form.addTitle", { name: t("masterNames.inventory-name-master") })}
            </div>
            <div className="text-sm text-slate-500">
              {isEdit ? t("configuration.masterData.form.updateSubtitle") : t("configuration.masterData.form.createSubtitle")}
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <CancelButton label={t("configuration.masterData.form.buttons.cancel")} onClick={handleClose} disabled={isSubmitting} />
          <SaveButton
            label={isEdit ? t("configuration.masterData.form.buttons.update") : t("configuration.masterData.form.buttons.save")}
            type="submit"
            form="inventory-name-form"
            isLoading={isSubmitting}
          />
        </>
      }
    >
      <form id="inventory-name-form" onSubmit={handleSubmit} noValidate className="space-y-6 bg-[#F8FAFF] p-5">
        {isEdit && (
          <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-4">
            <div
              className={cn(
                "rounded-xl p-3 flex items-center justify-between",
                isActive
                  ? "border border-blue-200 bg-[#F0F6FF]"
                  : "border border-gray-200 bg-gray-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-9 w-9 flex items-center justify-center rounded-full",
                    isActive
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-200 text-gray-900"
                  )}
                >
                  {isActive ? <CheckCircle2 size={18} /> : <X size={18} />}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{tCommon("status.label")}</div>
                  <div className="text-sm text-gray-500">
                    {isActive ? ` ${tCommon("status.active")}` : ` ${tCommon("status.inactive")}`}
                  </div>
                </div>
              </div>

              <ToggleSwitch
                ref={statusToggleRef}
                checked={isActive}
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
          codeRef={codeRef}
          formData={formData}
          errors={errors}
          showError={showError}
          onChange={handleChange}
          onBlur={handleBlur}
          onSelectChange={handleSelectChange}
          t={t}
          categoryOptions={categoryOptions}
        />

        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <AlertCircle size={16} />
          <span>{tCommon("note.mandatory")}</span>
        </div>
      </form>
    </Drawer>
  );
}


