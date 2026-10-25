"use client";

import { FileText, CheckCircle2, X, AlertCircle } from "lucide-react";
import { Drawer } from "@/components/common/Drawer";
import { CancelButton, SaveButton, ToggleSwitch, ValidationMessage } from "@/components/common";
import { cn } from "@/lib/utils/cn";
import { AssetDocumentDefinition } from "@/types/asset-masters/asset-document-definition.types";
import { AssetDocumentDefinitionFormFields } from "./AssetDocumentDefinitionFormFields";
import { useAssetDocumentDefinitionForm } from "@/hooks/asset-masters/asset-document-definition/useAssetDocumentDefinitionForm";

export interface AssetDocumentDefinitionFormProps {
  id: number | null;
  initialData?: AssetDocumentDefinition;
  categories: { id: number; name: string }[];
  types: { id: number; name: string }[];
}

export function AssetDocumentDefinitionForm(props: AssetDocumentDefinitionFormProps) {
  const {
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
  } = useAssetDocumentDefinitionForm(props);

  return (
    <Drawer
      open={open}
      onClose={handleCancel}
      width="md"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-[#EFF5FF] border border-[#DBEAFE] rounded-xl text-[#2563EB]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">
              {isEdit ? t("form.editTitle") : t("form.addTitle")}
            </div>
            <div className="text-xs text-slate-500 font-normal">
              {isEdit ? t("form.editSubtitle") : t("form.subtitle")}
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <CancelButton
            label={tCommon("buttons.cancel")}
            onClick={handleCancel}
            disabled={isSubmitting}
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
      <form id="form" onSubmit={handleSubmit} noValidate className="space-y-4 bg-[#F8FAFF] p-5">
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
                  <div className="font-medium text-gray-900">{t("form.status.label")}</div>
                  <div className="text-sm text-gray-500">
                    {t("form.status.description")}
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

        <AssetDocumentDefinitionFormFields
          documentCodeRef={documentCodeRef}
          formData={formData}
          displayOrderValue={displayOrderValue}
          errors={errors}
          showError={showError}
          handleChange={handleChange}
          handleBlur={handleBlur}
          handleSelectChange={handleSelectChange}
          handleToggleRequired={handleToggleRequired}
          categoryOptions={categoryOptions}
          typeOptions={typeOptions}
          t={t}
        />

        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <AlertCircle size={16} />
          <span>{tCommon("note.mandatory")}</span>
        </div>
      </form>
    </Drawer>
  );
}
