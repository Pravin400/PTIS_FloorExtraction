"use client"

import { Input } from "@/components/common";
import { Tooltip } from "@/components/common/Tooltip";
import { Label } from "@/components/common/label";
import { sanitizeTaxDecimal, preventInvalidNumericKeys } from "../utils/inputValidation";
import { TaxDetailsFieldsProps } from "@/types/OldDetails/property-old-floor-info.types";

/**
 * TaxDetailsFields Component
 * Renders tax-related fields (RV, ALV, property tax, total tax)
 * Handles decimal input validation for tax amounts
 */
export function TaxDetailsFields({
  t,
  formData,
  onFieldChange
}: TaxDetailsFieldsProps) {
  return (
    <>

      {/* Old ALV */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-700">
          {t("oldDetails.alv")}
        </Label>
        <Tooltip content={String(formData.oldALV || "")} placement="top">
          <Input
            type="text"
            inputMode="decimal"
            placeholder={t("oldDetails.alvPlaceholder")}
            className="h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
            value={formData.oldALV || ""}
            onChange={(e) => {
              const value = sanitizeTaxDecimal(e.target.value);
              if (value !== '' || e.target.value === '') {
                onFieldChange('oldALV', value);
              }
            }}
            onKeyDown={preventInvalidNumericKeys}
          />
        </Tooltip>
      </div>

      {/* Old RV */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-700">
          {t("oldDetails.rv")}
        </Label>
        <Tooltip content={String(formData.oldRV || "")} placement="top">
          <Input
            type="text"
            inputMode="decimal"
            placeholder={t("oldDetails.rvPlaceholder")}
            className="h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
            value={formData.oldRV || ""}
            onChange={(e) => {
              const value = sanitizeTaxDecimal(e.target.value);
              if (value !== '' || e.target.value === '') {
                onFieldChange('oldRV', value);
              }
            }}
            onKeyDown={preventInvalidNumericKeys}
          />
        </Tooltip>
      </div>

      {/* Old Property Tax */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-700">
          {t("oldDetails.propertyTax")}
        </Label>
        <Tooltip content={String(formData.oldGeneralTax || "")} placement="top">
          <Input
            type="text"
            inputMode="decimal"
            readOnly
            placeholder={t("oldDetails.propertyTaxPlaceholder")}
            className="h-9 text-sm border-blue-200 bg-gray-50 cursor-not-allowed focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
            value={formData.oldGeneralTax || ""}
            onChange={(e) => {
              const value = sanitizeTaxDecimal(e.target.value);
              if (value !== '' || e.target.value === '') {
                onFieldChange('oldGeneralTax', value);
              }
            }}
            onKeyDown={preventInvalidNumericKeys}
          />
        </Tooltip>
      </div>

      {/* Old Total Tax - Read Only */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-700">
          {t("oldDetails.totalTax")}
        </Label>
        <Tooltip content={String(formData.oldTotalTax || "")} placement="top">
          <Input
            readOnly
            type="text"
            inputMode="decimal"
            placeholder={t("oldDetails.totalTaxPlaceholder")}
            className="h-9 text-sm border-blue-200 bg-gray-50 cursor-not-allowed focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
            value={formData.oldTotalTax}
          />
        </Tooltip>
      </div>
    </>
  );
}
