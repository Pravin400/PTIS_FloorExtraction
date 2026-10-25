"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2, X, Info } from "lucide-react";
import { Drawer, CancelButton, SaveButton, ToggleSwitch, ValidationMessage } from "@/components/common";
import { cn } from "@/lib/utils/cn";
import { AssetGrievanceRemarkFormFields } from "./AssetGrievanceRemarkFormFields";
import type {
  AssetGrievanceRemark,
  AssetGrievanceRemarkCategoryOption,
} from "@/types/asset-masters/asset-grievance-remark.types";
import { useAssetGrievanceRemarkForm } from "@/hooks/asset-masters/grievance-remark/useAssetGrievanceRemarkForm";

export interface AssetGrievanceRemarkFormProps {
  id: number | null;
  initialData?: AssetGrievanceRemark;
  categories: AssetGrievanceRemarkCategoryOption[];
}

export default function AssetGrievanceRemarkForm({
  id,
  initialData,
  categories,
}: AssetGrievanceRemarkFormProps) {
  const {
    formData,
    errors,
    isSubmitting,
    isActive,
    open,
    handleChange,
    handleBlur,
    handleSelectChange,
    handleSubmit,
    handleToggleStatus,
    handleCancel,
    showError,
    t,
    tCommon,
    isEdit,
  } = useAssetGrievanceRemarkForm({
    id,
    initialData,
  });

  const statusToggleRef = useRef<HTMLButtonElement>(null);
  const remarkRef = useRef<HTMLInputElement>(null);

  const categoryOptions = categories.map((c) => ({
    label: c.grievanceTypeName,
    value: String(c.id),
  }));

  useEffect(() => {
    if (!open) return;
    const timeoutId = setTimeout(() => {
      if (isEdit && statusToggleRef.current) {
        statusToggleRef.current.focus();
      } else if (!isEdit) {
        const input = document.getElementById("grievanceCategoryId");
        if (input) {
          input.focus();
        }
      }
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [open, isEdit]);

  return (
    <Drawer
      open={open}
      onClose={handleCancel}
      className="border-l-4 border-[#4F6A94]"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-linear-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            <Info size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {isEdit ? t("form.editTitle") : t("form.addTitle")}
            </div>
            <div className="text-sm text-slate-500">
              {isEdit ? t("form.editSubtitle") : t("form.addSubtitle")}
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
            label={isEdit ? tCommon("buttons.save") : tCommon("buttons.save")}
            type="submit"
            form="form"
            isLoading={isSubmitting}
          />
        </>
      }
    >
      <form id="form" onSubmit={handleSubmit} className="space-y-6 bg-[#F8FAFF] p-5">
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
                  <div className="font-medium text-gray-900">{t("form.activeStatusTitle")}</div>
                  <div className="text-sm text-gray-500">
                    {isActive ? t("form.activeStatusOn") : t("form.activeStatusOff")}
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

        <AssetGrievanceRemarkFormFields
          remarkRef={remarkRef}
          formData={formData}
          errors={errors}
          showError={showError}
          handleChange={handleChange}
          handleBlur={handleBlur}
          handleSelectChange={handleSelectChange}
          categoryOptions={categoryOptions}
          t={t}
          isEdit={isEdit}
        />

        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <AlertCircle size={16} />
          <span>{tCommon("note.mandatory")}</span>
        </div>
      </form>
    </Drawer>
  );
}
