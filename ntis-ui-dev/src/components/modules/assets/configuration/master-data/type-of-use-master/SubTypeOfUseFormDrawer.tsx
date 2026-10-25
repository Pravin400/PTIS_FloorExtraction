"use client";

import { useEffect, useRef } from "react";
import { Layers, CheckCircle2, X, AlertCircle } from "lucide-react";
import { Drawer } from "@/components/common/Drawer";
import { CancelButton, SaveButton, ToggleSwitch, ValidationMessage, SearchSelect, Input } from "@/components/common";
import { cn } from "@/lib/utils/cn";
import type { AssetSubTypeOfUse } from "@/types/asset-masters/type-of-use.types";
import { useSubTypeOfUseForm } from "@/hooks/asset-masters/type-of-use/useSubTypeOfUseForm";

export interface SubTypeOfUseFormDrawerProps {
  id: number | null;
  initialData?: AssetSubTypeOfUse;
  typeOfUses: { id: number; name: string }[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function SubTypeOfUseFormDrawer({
  id,
  initialData,
  typeOfUses,
  onSuccess,
  onCancel,
}: SubTypeOfUseFormDrawerProps) {
  const {
    formData,
    errors,
    isSubmitting,
    isActive,
    open,
    handleChange,
    handleBlur,
    handleSubmit,
    handleToggleStatus,
    handleCancel,
    showError,
    t,
    tCommon,
    isEdit,
  } = useSubTypeOfUseForm({
    id,
    initialData,
    onSuccess,
    onCancel,
  });

  const statusToggleRef = useRef<HTMLButtonElement>(null);
  const descRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (isEdit && statusToggleRef.current) {
          statusToggleRef.current.focus();
        } else if (!isEdit && descRef.current) {
          descRef.current.focus();
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
              {isEdit ? t("subtype.edit", { default: "Edit Sub-Type of Use" }) : t("subtype.add", { default: "Add Sub-Type of Use" })}
            </div>
            <div className="text-sm text-slate-500">
              {!isEdit && formData.typeOfUseId > 0 && typeOfUses.find((t) => t.id === formData.typeOfUseId)
                ? t("messages.addingTo", { name: typeOfUses.find((t) => t.id === formData.typeOfUseId)?.name || "" })
                : t("subtype.addSubtitle", { default: "Configure Sub-Types of Use" })}
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
            form="subtypeofuse-form"
            isLoading={isSubmitting}
          />
        </>
      }
    >
      <form id="subtypeofuse-form" onSubmit={handleSubmit} className="space-y-6 bg-[#F8FAFF] p-5">
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

        <div className="space-y-4">
          <SearchSelect
            key={`typeofuse-select-${formData.typeOfUseId}`}
            name="typeOfUseId"
            label={t("type.title", { default: "Type of Use" })}
            required
            disabled={Boolean(initialData?.typeOfUseId) || isEdit}
            value={String(formData.typeOfUseId || "")}
            onChange={(name, val) => {
              handleChange({
                target: { name, value: val }
              } as React.ChangeEvent<HTMLSelectElement>);
            }}
            onBlur={() => {
              handleBlur({
                target: { name: "typeOfUseId", value: String(formData.typeOfUseId || "") }
              } as React.FocusEvent<HTMLSelectElement>);
            }}
            options={typeOfUses.map((x) => ({ value: String(x.id), label: x.name }))}
          />
          <ValidationMessage
            message={errors.typeOfUseId}
            visible={showError("typeOfUseId")}
          />

          <Input
            ref={descRef}
            name="description"
            label={t("messages.subTypeNameLabel", { default: "Sub-Type Name" })}
            required
            placeholder={t("subtype.placeholders.subTypeEnglish", { default: "Enter sub-type name" })}
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            fullWidth
          />
          <ValidationMessage
            message={errors.description}
            visible={showError("description")}
          />

          <Input
            type="number"
            name="searchSequence"
            label={t("subtype.fields.sequence.label", { default: "Sequence" })}
            required
            min={0}
            max={999}
            value={formData.searchSequence}
            onChange={handleChange}
            onBlur={handleBlur}
            fullWidth
          />
          <ValidationMessage
            message={errors.searchSequence}
            visible={showError("searchSequence")}
          />
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <AlertCircle size={16} />
          <span>{tCommon("note.mandatory")}</span>
        </div>
      </form>
    </Drawer>
  );
}
