"use client";

import { useEffect, useRef } from "react";
import { Layers, CheckCircle2, X, AlertCircle } from "lucide-react";
import { Drawer } from "@/components/common/Drawer";
import { CancelButton, SaveButton, ToggleSwitch, ValidationMessage } from "@/components/common";
import { cn } from "@/lib/utils/cn";
import type { TypeOfUseGroup } from "@/types/asset-masters/type-of-use.types";
import { useGroupForm } from "@/hooks/asset-masters/type-of-use/useGroupForm";
import { GroupFormFields } from "./GroupFormFields";

export interface GroupFormDrawerProps {
  id: number | null;
  initialData?: TypeOfUseGroup;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function GroupFormDrawer({
  id,
  initialData,
  onSuccess,
  onCancel,
}: GroupFormDrawerProps) {
  const {
    formData,
    errors,
    isSubmitting,
    isActive,
    open,
    handleChange,
    handleValueChange,
    handleBlur,
    handleSubmit,
    handleToggleStatus,
    handleCancel,
    showError,
    t,
    tCommon,
    isEdit,
  } = useGroupForm({
    id,
    initialData,
    onSuccess,
    onCancel,
  });

  const statusToggleRef = useRef<HTMLButtonElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (isEdit && statusToggleRef.current) {
          statusToggleRef.current.focus();
        } else if (!isEdit && codeRef.current) {
          codeRef.current.focus();
        }
      }, 150);
    }
  }, [open, isEdit]);

  return (
    <Drawer
      open={open}
      onClose={handleCancel}
      className="border-l-4 border-[#4F6A94]"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-linear-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            <Layers size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {isEdit ? t("group.form.editTitle", { default: "Edit Group" }) : t("group.form.addTitle", { default: "Add Group" })}
            </div>
            <div className="text-sm text-slate-500">
              {t("group.form.subtitle", { default: "Configure Type of Use Groups" })}
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
            label={isEdit ? tCommon("actions.update", { default: "Update" }) : tCommon("buttons.save", { default: "Save" })}
            type="submit"
            form="group-form"
            isLoading={isSubmitting}
          />
        </>
      }
    >
      <form id="group-form" onSubmit={handleSubmit} className="space-y-6 bg-[#F8FAFF] p-5">
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
                  <div className="font-medium text-gray-900">{t("group.fields.status", { default: "Status" })}</div>
                  <div className="text-sm text-gray-500">
                    {t("status.toggleDescription", { default: "Toggle the status" })}
                    {isActive ? ` ${t("status.active", { default: "Active" })}` : ` ${t("status.inactive", { default: "Inactive" })}`}
                  </div>
                </div>
              </div>

              <ToggleSwitch
                ref={statusToggleRef}
                checked={isActive}
                onChange={handleToggleStatus}
                showPopup={false}
                activeLabel={t("status.active", { default: "Active" })}
                inactiveLabel={t("status.inactive", { default: "Inactive" })}
              />
            </div>
            {errors.isActive && (
              <ValidationMessage message={errors.isActive} className="mt-2" />
            )}
          </div>
        )}

        <GroupFormFields
          codeRef={codeRef}
          formData={formData}
          errors={errors}
          showError={showError}
          handleChange={handleChange}
          handleValueChange={handleValueChange}
          handleBlur={handleBlur}
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
