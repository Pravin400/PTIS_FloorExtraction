"use client";

import { useEffect, useRef } from "react";
import { LayoutGrid, AlertCircle, CheckCircle2, X } from "lucide-react";

import { CancelButton, SaveButton, ToggleSwitch, ValidationMessage } from "@/components/common";
import { Drawer } from "@/components/common/Drawer";
import { cn } from "@/lib/utils/cn";
import { FormFieldsSection } from "./FormFieldsSection";
import { useAssetTypeForm } from "@/hooks/asset-masters/asset-type/useAssetTypeForm";

import type { AssetTypeFormModel, AssetTypeFormProps } from "@/types/asset-masters/asset-type.types";

export default function AssetTypeForm({ initialData, groups }: AssetTypeFormProps) {
  const {
    isEdit,
    open,
    handleClose,
    formData,
    errors,
    showError,
    handleChange,
    handleSelectChange,
    handleRadioChange,
    handleToggleSubUnit,
    handleBlur,
    handleToggleStatus,
    handleSubmit,
    isSubmitting,
    t,
    tCommon,
    tNames,
    categoryOptions,
  } = useAssetTypeForm({ initialData, groups });

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
              {isEdit ? t("editTitle", { name: tNames("asset-type-master") }) : t("addTitle", { name: tNames("asset-type-master") })}
            </div>
            <div className="text-sm text-slate-500">
              {isEdit ? t("updateSubtitle") : t("createSubtitle")}
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <CancelButton label={t("buttons.cancel")} onClick={handleClose} disabled={isSubmitting} />
          <SaveButton
            label={isEdit ? t("buttons.update") : t("buttons.save")}
            type="submit"
            form="asset-type-form"
            isLoading={isSubmitting}
          />
        </>
      }
    >
      <form id="asset-type-form" onSubmit={handleSubmit} noValidate className="space-y-6 bg-[#F8FAFF] p-5">
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
                  <div className="font-medium text-gray-900">{t("labels.activeStatus")}</div>
                  <div className="text-sm text-gray-500">
                    {isActive ? t("labels.assetTypeActiveDescription") : t("labels.assetTypeInactiveDescription")}
                  </div>
                </div>
              </div>

              <ToggleSwitch
                ref={statusToggleRef}
                checked={isActive}
                onChange={handleToggleStatus}
                showPopup={false}
                activeLabel={t("labels.active")}
                inactiveLabel={t("labels.inactive")}
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
          showError={(field) => showError(field as keyof AssetTypeFormModel)}
          onChange={handleChange}
          onBlur={handleBlur}
          onSelectChange={handleSelectChange}
          onRadioChange={handleRadioChange}
          onToggleSubUnit={handleToggleSubUnit}
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



