"use client"

import { Input } from "@/components/common";
import { Tooltip } from "@/components/common/Tooltip";
import { Label } from "@/components/common/label";
import { TaxationSummaryFieldsProps } from "@/types/OldDetails/property-old-floor-info.types";

/**
 * TaxationSummaryFields Component
 * Renders read-only summary fields (aggregate tax sum and net payable total)
 * These are calculated fields that display totals
 */
export function TaxationSummaryFields({
  t,
  taxTotal,
  netTotal,
}: TaxationSummaryFieldsProps) {
  return (
    <>
      {/* Aggregate Tax Sum */}
      <div className="group flex flex-col space-y-1">
        <Label className="text-xs font-semibold text-slate-600 transition-colors">
          {t("aggregateTaxSum")}
        </Label>
        <Tooltip content={String(taxTotal === 0 ? "" : taxTotal)} placement="top">
          <Input
            readOnly
            type="number"
            value={taxTotal === 0 ? "" : taxTotal}
            placeholder={t("aggregateTaxSum")}
            className="h-9 text-sm bg-slate-50 border-slate-200 text-slate-500 font-medium cursor-not-allowed rounded-lg"
          />
        </Tooltip>
      </div>

      {/* Net Payable Total */}
      <div className="group flex flex-col space-y-1.5 pb-2">
        <Label className="text-xs font-semibold text-slate-600 transition-colors">
          {t("netPayableTotal")}
        </Label>
        <Tooltip content={String(netTotal === 0 ? "" : netTotal)} placement="top">
          <Input
            readOnly
            type="number"
            value={netTotal === 0 ? "" : netTotal}
            placeholder={t("netPayableTotal")}
            className="h-9 text-sm bg-slate-50 border-slate-200 text-slate-500 font-medium cursor-not-allowed rounded-lg"
          />
        </Tooltip>
      </div>
    </>
  );
}
