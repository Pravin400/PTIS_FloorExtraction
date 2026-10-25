"use client";

import { useRef, useEffect } from "react";
import { Layers, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Card, Input, CancelButton, SaveButton, ToggleSwitch, ValidationMessage, PageContainer, SearchSelect } from "@/components/common";
import TableHeader from "@/components/common/TableHeader";
import { cn } from "@/lib/utils/cn";
import type { AssetSubTypeOfUse } from "@/types/asset-masters/type-of-use.types";
import { useSubTypeOfUseForm } from "@/hooks/asset-masters/type-of-use/useSubTypeOfUseForm";

interface SubTypeOfUseFormProps {
  id: number | null;
  initialData?: AssetSubTypeOfUse;
  typeOfUses: { id: number; name: string }[];
}

export default function SubTypeOfUseForm({ id, initialData, typeOfUses }: SubTypeOfUseFormProps) {
  const {
    formData,
    errors,
    isSubmitting,
    isActive,
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
  });

  const descRef = useRef<HTMLInputElement>(null);
  const statusToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setTimeout(() => {
      if (isEdit && statusToggleRef.current) {
        statusToggleRef.current.focus();
      } else if (!isEdit && descRef.current) {
        descRef.current.focus();
      }
    }, 150);
  }, [isEdit]);

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto space-y-6">
        <TableHeader
          title={isEdit ? t("subtype.edit", { default: "Edit Sub-Type of Use" }) : t("subtype.add", { default: "Add Sub-Type of Use" })}
          subtitle={t("subtype.addSubtitle", { default: "Configure Sub-Types of Use" })}
          icon={Layers}
        />

        <Card className="p-6">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {isEdit && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
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
                      <div className="text-sm text-slate-500">
                        {t("status.toggleDescription", { default: "Toggle status" })}
                        {isActive ? ` ${t("status.active")}` : ` ${t("status.inactive")}`}
                      </div>
                    </div>
                  </div>

                  <ToggleSwitch
                    ref={statusToggleRef}
                    checked={isActive}
                    onChange={handleToggleStatus}
                    showPopup={false}
                    activeLabel={t("status.active")}
                    inactiveLabel={t("status.inactive")}
                  />
                </div>
              </div>
            )}

            <div className="space-y-4">
              <SearchSelect
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
                value={formData.searchSequence === "" ? "" : formData.searchSequence}
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

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <CancelButton
                label={tCommon("buttons.cancel")}
                onClick={handleCancel}
                disabled={isSubmitting}
              />
              <SaveButton
                label={isEdit ? tCommon("actions.update", { default: "Update" }) : tCommon("buttons.save", { default: "Save" })}
                type="submit"
                isLoading={isSubmitting}
              />
            </div>
          </form>
        </Card>
      </div>
    </PageContainer>
  );
}
