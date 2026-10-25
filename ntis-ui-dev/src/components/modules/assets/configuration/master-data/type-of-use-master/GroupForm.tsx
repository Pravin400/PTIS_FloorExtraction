"use client";

import { useRef, useEffect } from "react";
import { Layers, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Card, Input, CancelButton, SaveButton, ToggleSwitch, ValidationMessage, PageContainer } from "@/components/common";
import TableHeader from "@/components/common/TableHeader";
import { cn } from "@/lib/utils/cn";
import type { TypeOfUseGroup } from "@/types/asset-masters/type-of-use.types";
import { useGroupForm } from "@/hooks/asset-masters/type-of-use/useGroupForm";
import { GroupIconSelector } from "./GroupIconSelector";

interface GroupFormProps {
  id: number | null;
  initialData?: TypeOfUseGroup;
}

export default function GroupForm({ id, initialData }: GroupFormProps) {
  const {
    formData,
    errors,
    isSubmitting,
    isActive,
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
  });

  const codeRef = useRef<HTMLInputElement>(null);
  const statusToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setTimeout(() => {
      if (isEdit && statusToggleRef.current) {
        statusToggleRef.current.focus();
      } else if (!isEdit && codeRef.current) {
        codeRef.current.focus();
      }
    }, 150);
  }, [isEdit]);

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto space-y-6">
        <TableHeader
          title={isEdit ? t("group.form.editTitle", { default: "Edit Group" }) : t("group.form.addTitle", { default: "Add Group" })}
          subtitle={t("group.form.subtitle", { default: "Configure Type of Use Groups" })}
          icon={Layers}
        />

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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
              <Input
                ref={codeRef}
                name="typeOfUseGroupCode"
                label={t("group.fields.code.label", { default: "Group Code" })}
                required
                disabled={isEdit}
                placeholder={t("group.fields.code.placeholder", { default: "Enter group code" })}
                value={formData.typeOfUseGroupCode}
                onChange={handleChange}
                onBlur={handleBlur}
                fullWidth
              />
              <ValidationMessage
                message={errors.typeOfUseGroupCode}
                visible={showError("typeOfUseGroupCode")}
              />

              <Input
                name="groupName"
                label={t("group.fields.name.label", { default: "Group Name" })}
                required
                placeholder={t("group.fields.name.placeholder", { default: "Enter group name" })}
                value={formData.groupName}
                onChange={handleChange}
                onBlur={handleBlur}
                fullWidth
              />
              <ValidationMessage
                message={errors.groupName}
                visible={showError("groupName")}
              />

              <GroupIconSelector
                name="groupIcon"
                label={t("group.fields.icon.label", { default: "Group Icon" })}
                value={formData.groupIcon}
                onChange={handleValueChange}
                required
              />
              <ValidationMessage
                message={errors.groupIcon}
                visible={showError("groupIcon")}
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
