"use client";

import React from "react";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/select";
import { ToggleSwitch } from "@/components/common/ToggleSwitch";
import type { CreateWaterPenaltyRuleModel } from "@/types/water-bill/penalty-rule-master.types";
import type { LookupOption, FinancialYearLookupOption } from "@/types/water-bill/lookups.types";
import {
  STATIC_FINANCIAL_YEARS,
  STATIC_CONNECTION_CATEGORIES,
  STATIC_GEOGRAPHY_UNITS,
  STATIC_CHARGE_HEADS,
  PENALTY_TYPE_OPTIONS,
} from "@/lib/constants/water-masters.constants";

export interface PenaltyRuleFormFieldsProps {
  formData: CreateWaterPenaltyRuleModel;
  onChange: (updated: CreateWaterPenaltyRuleModel) => void;
  t: (key: string) => string;
  financialYearOptions?: FinancialYearLookupOption[];
  connectionCategoryOptions?: LookupOption[];
  geographyOptions?: LookupOption[];
  chargeHeadOptions?: LookupOption[];
}

export function PenaltyRuleFormFields({
  formData,
  onChange,
  t,
  financialYearOptions = STATIC_FINANCIAL_YEARS,
  connectionCategoryOptions = STATIC_CONNECTION_CATEGORIES,
  geographyOptions = STATIC_GEOGRAPHY_UNITS,
  chargeHeadOptions = STATIC_CHARGE_HEADS,
}: PenaltyRuleFormFieldsProps): React.ReactElement {
  const isPercentage =
    formData.penaltyType === "Percentage" || formData.penaltyType === "MonthlyPercentage";

  return (
    <div className="space-y-3">
      {/* Row 1: Financial Year & Connection Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          selectSize="sm"
          label={t("form.financialYear") || "Financial Year"}
          required
          value={formData.financialYearId ? String(formData.financialYearId) : ""}
          onChange={(_e, val) => {
            const fyId = val ? Number(val) : (undefined as unknown as number);
            const match = financialYearOptions.find((x) => x.value === val);
            onChange({
              ...formData,
              financialYearId: fyId,
              effectiveFrom: match?.startDate || formData.effectiveFrom,
              effectiveTo: match?.endDate || formData.effectiveTo,
            });
          }}
          options={financialYearOptions}
          placeholder={t("form.financialYearPlaceholder") || "Select Financial Year"}
        />
        <Select
          selectSize="sm"
          label={t("form.connectionCategory") || "Connection Category"}
          value={
            formData.connectionCategoryId === null || formData.connectionCategoryId === 0
              ? "0"
              : formData.connectionCategoryId !== undefined
                ? String(formData.connectionCategoryId)
                : ""
          }
          onChange={(_e, val) =>
            onChange({
              ...formData,
              connectionCategoryId: val === "0" || val === "" ? null : Number(val),
            })
          }
          options={[{ value: "0", label: "All Categories (General)" }, ...connectionCategoryOptions]}
          placeholder={t("form.connectionCategoryPlaceholder") || "Select Connection Category"}
        />
      </div>

      {/* Row 2: Geography Unit & Charge Head */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          selectSize="sm"
          label={t("form.geography") || "Geography Unit"}
          value={
            formData.geographyUnitId !== undefined && formData.geographyUnitId !== null
              ? String(formData.geographyUnitId)
              : ""
          }
          onChange={(_e, val) =>
            onChange({ ...formData, geographyUnitId: val !== "" && val !== "0" ? Number(val) : undefined })
          }
          options={[{ value: "0", label: "All Geographies" }, ...geographyOptions]}
          placeholder={t("form.geographyPlaceholder") || "Select Geography Unit"}
        />
        <Select
          selectSize="sm"
          label={t("form.chargeHead") || "Charge Head"}
          value={
            formData.chargeHeadId !== undefined && formData.chargeHeadId !== null
              ? String(formData.chargeHeadId)
              : ""
          }
          onChange={(_e, val) =>
            onChange({ ...formData, chargeHeadId: val !== "" && val !== "0" ? Number(val) : undefined })
          }
          options={[{ value: "0", label: "None / General" }, ...chargeHeadOptions]}
          placeholder={t("form.chargeHeadPlaceholder") || "Select Charge Head"}
        />
      </div>

      {/* Row 3: Penalty Calculation Type & Rate / Flat Amount */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          selectSize="sm"
          label={t("form.penaltyType") || "Penalty Calculation Type"}
          required
          value={formData.penaltyType || ""}
          onChange={(_e, val) => {
            const isNowPercentage = val === "Percentage" || val === "MonthlyPercentage";
            onChange({
              ...formData,
              penaltyType: val,
              percentageRate: isNowPercentage ? formData.percentageRate : null,
              flatAmount: isNowPercentage ? null : formData.flatAmount,
              maximumAmount: isNowPercentage ? formData.maximumAmount : null,
            });
          }}
          options={PENALTY_TYPE_OPTIONS}
          placeholder={t("form.penaltyTypePlaceholder") || "Select penalty type"}
        />
        {formData.penaltyType === "Flat" ? (
          <Input
            label={t("form.flatAmount") || "Flat Amount (₹)"}
            required
            fullWidth
            type="number"
            step="0.01"
            min={0}
            className="h-8 py-1 text-sm"
            value={formData.flatAmount !== null && formData.flatAmount !== undefined ? formData.flatAmount : ""}
            onChange={(e) =>
              onChange({
                ...formData,
                flatAmount: e.target.value !== "" ? Number(e.target.value) : null,
              })
            }
            placeholder="e.g. 200"
          />
        ) : (
          <Input
            label={t("form.percentageRate") || "Percentage Rate (%)"}
            required
            fullWidth
            type="number"
            step="0.01"
            min={0}
            className="h-8 py-1 text-sm"
            value={formData.percentageRate !== null && formData.percentageRate !== undefined ? formData.percentageRate : ""}
            onChange={(e) =>
              onChange({
                ...formData,
                percentageRate: e.target.value !== "" ? Number(e.target.value) : null,
              })
            }
            placeholder="e.g. 2.0"
          />
        )}
      </div>

      {/* Row 4: Overdue Days */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label={t("form.fromDay") || "From Overdue Day"}
          required
          fullWidth
          type="number"
          min={0}
          className="h-8 py-1 text-sm"
          value={formData.fromDay !== null && formData.fromDay !== undefined ? formData.fromDay : ""}
          onChange={(e) =>
            onChange({
              ...formData,
              fromDay: e.target.value !== "" ? Number(e.target.value) : (undefined as unknown as number),
            })
          }
          placeholder="e.g. 1"
        />
        <Input
          label={t("form.toDay") || "To Overdue Day"}
          fullWidth
          type="number"
          min={0}
          className="h-8 py-1 text-sm"
          value={formData.toDay !== null && formData.toDay !== undefined ? formData.toDay : ""}
          onChange={(e) =>
            onChange({
              ...formData,
              toDay: e.target.value !== "" ? Number(e.target.value) : null,
            })
          }
          placeholder="Unlimited (∞)"
        />
      </div>

      {/* Row 5: Effective Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label={t("form.effectiveFrom") || "Effective From Date"}
          required
          fullWidth
          type="date"
          className="h-8 py-1 text-sm"
          value={formData.effectiveFrom || ""}
          onChange={(e) => onChange({ ...formData, effectiveFrom: e.target.value })}
        />
        <Input
          label={t("form.effectiveTo") || "Effective To Date"}
          required
          fullWidth
          type="date"
          className="h-8 py-1 text-sm"
          value={formData.effectiveTo || ""}
          onChange={(e) => onChange({ ...formData, effectiveTo: e.target.value })}
        />
      </div>

      {/* Row 6: Maximum Penalty Cap (Only for Percentage-based penalty) */}
      {isPercentage && (
        <Input
          label={t("form.maximumAmount") || "Maximum Penalty Cap (₹)"}
          fullWidth
          type="number"
          step="0.01"
          min={0}
          className="h-8 py-1 text-sm"
          value={
            formData.maximumAmount !== null && formData.maximumAmount !== undefined
              ? formData.maximumAmount
              : ""
          }
          onChange={(e) =>
            onChange({
              ...formData,
              maximumAmount: e.target.value !== "" ? Number(e.target.value) : null,
            })
          }
          placeholder="No cap"
        />
      )}

      {/* Row 7: Toggles inline on single row */}
      <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <ToggleSwitch
            id="penalty-rule-is-current"
            showPopup={false}
            checked={Boolean(formData.isCurrentBill)}
            onChange={(checked) => onChange({ ...formData, isCurrentBill: checked })}
          />
          <span className="text-xs font-medium text-slate-700">
            {t("form.isCurrentBill") || "Current Bill"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ToggleSwitch
            id="penalty-rule-is-pending"
            showPopup={false}
            checked={Boolean(formData.isPendingBill)}
            onChange={(checked) => onChange({ ...formData, isPendingBill: checked })}
          />
          <span className="text-xs font-medium text-slate-700">
            {t("form.isPendingBill") || "Pending Bill"}
          </span>
        </div>
      </div>
    </div>
  );
}
