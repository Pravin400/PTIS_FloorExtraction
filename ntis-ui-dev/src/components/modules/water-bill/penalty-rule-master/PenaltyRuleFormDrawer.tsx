"use client";

import React from "react";
import { LayoutGrid, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Drawer } from "@/components/common/Drawer";
import { SaveButton, CancelButton } from "@/components/common/ActionButtons";
import type {
  WaterPenaltyRuleDto,
  CreateWaterPenaltyRuleModel,
} from "@/types/water-bill/penalty-rule-master.types";
import type { LookupOption, FinancialYearLookupOption } from "@/types/water-bill/lookups.types";
import { PenaltyRuleFormFields } from "./PenaltyRuleFormFields";
import { StatusToggleSection } from "./StatusToggleSection";
import { usePenaltyRuleForm } from "@/hooks/water-bill/penalty-rule-master";

export interface PenaltyRuleFormDrawerProps {
  open?: boolean;
  onClose?: () => void;
  onSave?: (model: CreateWaterPenaltyRuleModel) => Promise<{ success: boolean; error?: string }>;
  initialData?: WaterPenaltyRuleDto | null;
  t?: (key: string) => string;
  financialYearOptions?: FinancialYearLookupOption[];
  connectionCategoryOptions?: LookupOption[];
  geographyOptions?: LookupOption[];
  chargeHeadOptions?: LookupOption[];
  listPath?: string;
}

export function PenaltyRuleFormDrawer({
  open = true,
  onClose,
  onSave,
  initialData,
  t: tProp,
  financialYearOptions,
  connectionCategoryOptions,
  geographyOptions,
  chargeHeadOptions,
  listPath = "/water-bill/penalty-rule-master",
}: PenaltyRuleFormDrawerProps): React.ReactElement {
  const tTranslations = useTranslations("waterPenaltyRule");
  const t = tProp || tTranslations;
  const tCommon = useTranslations("common");

  const {
    formData,
    setFormData,
    isSubmitting,
    isEdit,
    handleClose,
    handleToggleStatus,
    handleSubmit,
  } = usePenaltyRuleForm({
    open,
    onClose,
    onSave,
    initialData,
    t,
    listPath,
  });

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      className="border-l-4 border-[#4F6A94]"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-linear-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            <LayoutGrid size={20} />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {isEdit ? (t("form.editTitle") || "Edit Penalty Rule") : (t("form.addTitle") || "Add Penalty Rule")}
            </div>
            <div className="text-sm text-slate-500">
              {isEdit ? "Update Penalty Rule details" : (t("form.description") || "Configure late fee and penalty parameters")}
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <CancelButton label={tCommon("buttons.cancel") || "Cancel"} onClick={handleClose} disabled={isSubmitting} />
          <SaveButton
            label={isEdit ? (tCommon("buttons.update") || "Update") : (tCommon("buttons.save") || "Save")}
            type="submit"
            form="penalty-rule-form"
            isLoading={isSubmitting}
          />
        </div>
      }
    >
      <form
        id="penalty-rule-form"
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col justify-between h-full bg-[#F8FAFF] p-5 overflow-y-auto space-y-5"
      >
        <div className="space-y-4">
          <StatusToggleSection
            isEdit={isEdit}
            isActive={formData.isActive ?? true}
            handleToggleStatus={handleToggleStatus}
            label={t("form.status.label") || "Active Status"}
            description={t("form.status.description") || "Penalty Rule is currently"}
            t={t}
            tCommon={tCommon}
          />

          <PenaltyRuleFormFields
            formData={formData}
            onChange={setFormData}
            t={t}
            financialYearOptions={financialYearOptions}
            connectionCategoryOptions={connectionCategoryOptions}
            geographyOptions={geographyOptions}
            chargeHeadOptions={chargeHeadOptions}
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-700">
          <AlertCircle size={14} className="shrink-0" />
          <span>{tCommon("note.mandatory") || "* Mandatory fields must be filled"}</span>
        </div>
      </form>
    </Drawer>
  );
}

export default PenaltyRuleFormDrawer;
