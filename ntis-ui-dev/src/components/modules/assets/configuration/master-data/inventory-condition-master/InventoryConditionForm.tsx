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

import type {
  InventoryConditionFormModel,
  InventoryConditionCategory,
  AssetConditionCategory,
  InventoryConditionFormProps,
} from "@/types/asset-masters/inventory-condition.types";
import { validateInventoryConditionForm } from "@/hooks/asset-masters/inventory-condition/validation";
import { useInventoryConditionSubmit } from "@/hooks/asset-masters/inventory-condition/useInventoryConditionSubmit";
import { useInventoryConditionForm } from "@/hooks/asset-masters/inventory-condition/useInventoryConditionForm";

export function InventoryConditionForm({ id, initialData, inventoryCategories = [], assetCategories = [] }: InventoryConditionFormProps) {
  const router = useRouter();
  const isEdit = id != null;

  const [open, setOpen] = useState(true);

  const t = useTranslations("inventoryCondition");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const statusToggleRef = useRef<HTMLButtonElement>(null);
  const conditionCategoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const timeoutId = setTimeout(() => {
      if (isEdit && statusToggleRef.current) {
        statusToggleRef.current.focus();
      } else if (!isEdit && conditionCategoryRef.current) {
        conditionCategoryRef.current.querySelector<HTMLButtonElement>("button")?.focus();
      }
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [open, isEdit]);

  const handleClose = useCallback(() => {
    setOpen(false);
    router.back();
  }, [router]);

  const validate = useCallback((data: InventoryConditionFormModel) => {
    return validateInventoryConditionForm(data, t, isEdit);
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
  } = useInventoryConditionForm(initialData, validate);

  // Build category options based on selected conditionCategory
  const categoryOptions = useMemo(() => {
    const selectedCategory = formData.conditionCategory || formData.conditionType;
    if (selectedCategory === "Asset") {
      return (assetCategories || []).map((g: AssetConditionCategory) => ({ label: g.categoryName, value: String(g.id) }));
    }
    return (inventoryCategories || []).map((g: InventoryConditionCategory) => ({ label: g.categoryName, value: String(g.id) }));
  }, [formData.conditionCategory, formData.conditionType, inventoryCategories, assetCategories]);

  const conditionTypeOptions = useMemo(() => [
    { label: "Asset", value: "Asset" },
    { label: "Inventory", value: "Inventory" },
  ], []);

  const showError = (field: string) => (submittedOnce || touched[field]) && !!errors[field as keyof InventoryConditionFormModel];

  const { handleSubmit, isSubmitting } = useInventoryConditionSubmit({
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
                ? t("configuration.masterData.form.editTitle", { name: t("masterNames.inventory-condition-master") }) 
                : t("configuration.masterData.form.addTitle", { name: t("masterNames.inventory-condition-master") })}
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
            form="inventory-condition-form"
            isLoading={isSubmitting}
          />
        </>
      }
    >
      <form id="inventory-condition-form" onSubmit={handleSubmit} noValidate className="space-y-6 bg-[#F8FAFF] p-5">
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
          conditionCategoryRef={conditionCategoryRef}
          formData={formData}
          errors={errors as Record<string, string>}
          showError={showError}
          onChange={handleChange}
          onBlur={handleBlur}
          onSelectChange={handleSelectChange}
          t={t}
          categoryOptions={categoryOptions}
          conditionTypeOptions={conditionTypeOptions}
        />

        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <AlertCircle size={16} />
          <span>{tCommon("note.mandatory")}</span>
        </div>
      </form>
    </Drawer>
  );
}
