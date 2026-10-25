"use client"

import { Input } from "@/components/common";
import { Tooltip } from "@/components/common/Tooltip";
import { Label } from "@/components/common/label";
import { TaxationMetaFieldsProps } from "@/types/OldDetails/property-old-floor-info.types";

/**
 * TaxationMetaFields Component
 * Renders assessment year and interest amount fields
 * Handles numeric validation for year input
 */
export function TaxationMetaFields({
  t,
  year,
  interest,
  onYearChange,
  onInterestChange,
}: TaxationMetaFieldsProps) {
  return (
    <>
      {/* Assessment Year */}
      <div className="group flex flex-col space-y-1">
        <Label className="text-xs font-semibold text-slate-600 transition-colors group-focus-within:text-blue-600">
          {t("assessmentYear")}
        </Label>
       
        <Tooltip content={year || ""} placement="top">
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            title="Enter a 4-digit year"
            value={year}
            onChange={(e) => onYearChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder={t("assessmentYear")}
            className="h-9 text-sm border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg transition-all duration-200 text-gray-900 bg-white"
          />
        </Tooltip>
      </div>


      {/* Interest Amount */}
      <div className="group flex flex-col space-y-1.5 pb-2">
        <Label className="text-xs font-semibold text-slate-600 transition-colors group-focus-within:text-blue-600">
          {t("interestAmount")}
        </Label>
        <Tooltip content={String(interest === 0 ? "" : interest)} placement="top">
          <Input
            type="number"
            step="0.01"
            value={interest === 0 ? "" : interest}
            onChange={(e) => onInterestChange(e.target.value)}
            placeholder={t("interestAmount")}
            className="h-9 text-sm border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-lg transition-all duration-200 text-gray-900 bg-white"
          />
        </Tooltip>
      </div>
    </>
  );
}
