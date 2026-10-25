"use client"

import { Input } from "@/components/common";
import { Tooltip } from "@/components/common/Tooltip";
import { Label } from "@/components/common/label";
import { useTranslations } from "next-intl";
import { getTranslatedTaxLabel } from "@/lib/utils/ptis";
import { DynamicTaxFieldsProps } from "@/types/OldDetails/property-old-floor-info.types";
import { sanitizeTaxDecimal, preventInvalidNumericKeys } from "../../OldTaxation/utils/inputValidation";

/**
 * DynamicTaxFields Component
 * Renders dynamic tax input fields based on available tax types
 * Each tax type gets its own input field for amount entry
 */
export function DynamicTaxFields({
  taxes,
  onTaxChange,
  validationErrors = {},
}: DynamicTaxFieldsProps) {
  const t = useTranslations('ptis');

  // Return null when no tax data - warning is shown at the top of the form
  if (!taxes || taxes.length === 0) {
    return null;
  }

  return (
    <>
      {taxes.map((tax) => {
        const errorMsg = validationErrors[`tax_${tax.taxId}`];
        const displayLabel = getTranslatedTaxLabel(t, tax.taxName);
        return (
          <div key={tax.taxId} className="group relative flex flex-col space-y-1">
            <Label className="text-xs font-semibold text-slate-700 transition-colors group-focus-within:text-blue-600">
              {displayLabel}
            </Label>
            <Tooltip content={tax.taxAmount === 0 || !tax.taxAmount ? "" : String(tax.taxAmount)} placement="top">
              <Input
                type="text"
                inputMode="decimal"
                value={tax.taxAmount === 0 || !tax.taxAmount ? "" : String(tax.taxAmount)}
                onChange={(e) => {
                  const value = sanitizeTaxDecimal(e.target.value);
                  if (value !== '' || e.target.value === '') {
                    onTaxChange(tax.taxId, value);
                  }
                }}
                onKeyDown={preventInvalidNumericKeys}
                placeholder={displayLabel}
                className={`h-9 text-sm rounded-lg transition-all duration-200 placeholder:text-xs ${errorMsg
                    ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 text-red-900 bg-red-50/30"
                    : "border-slate-300 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-gray-900 bg-white"
                  }`}
              />
            </Tooltip>
            {errorMsg && (
              <span className="text-[10px] font-medium text-red-500 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                {errorMsg}
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}
