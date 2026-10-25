"use client"

import { Input } from "@/components/common";
import { Tooltip } from "@/components/common/Tooltip";
import { Label } from "@/components/common/label";
import { sanitizeAlphanumeric, sanitizeAreaDecimal, preventInvalidNumericKeys, isValidDecimalField } from "../utils/inputValidation";
import { AreaDetailsFieldsProps } from "@/types/OldDetails/property-old-floor-info.types";

/**
 * AreaDetailsFields Component
 * Renders area-related fields (plot area, plot number, construction area)
 * Handles decimal input validation for area measurements
 */
export function AreaDetailsFields({
  t,
  formData,
  showError,
  onFieldChange
}: AreaDetailsFieldsProps) {
  return (
    <>
      {/* Old Plot Area */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-700">
          {t("oldDetails.plotArea")}<span className="text-red-500 ml-1">*</span>
        </Label>
        <Tooltip content={String(formData.oldPlotArea || "")} placement="top">
          <Input
            type="text"
            inputMode="decimal"
            placeholder={t("oldDetails.plotAreaPlaceholder")}
            className="h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
            value={formData.oldPlotArea}
            onChange={(e) => {
              const value = sanitizeAreaDecimal(e.target.value);
              if (value !== '' || e.target.value === '') {
                onFieldChange('oldPlotArea', value);
              }
            }}
            onKeyDown={preventInvalidNumericKeys}
          />
        </Tooltip>
        {showError('oldPlotArea', isValidDecimalField(formData.oldPlotArea)) && (
          <span className="text-xs text-red-500">{t('oldDetails.validation.plotAreaRequired')}</span>
        )}
      </div>

      {/* Old Plot No */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-700">
          {t("oldDetails.plotNo")}
        </Label>
        <Tooltip content={formData.oldPlotNo || ""} placement="top">
          <Input
            placeholder={t("oldDetails.plotNoPlaceholder")}
            className="h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
            value={formData.oldPlotNo}
            maxLength={20}
            onChange={(e) => {
              const value = sanitizeAlphanumeric(e.target.value);
              if (value.trim() || value === '') {
                onFieldChange('oldPlotNo', value);
              }
            }}
          />
        </Tooltip>
      </div>

      {/* Old Construction Area */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-700">
          {t("oldDetails.constructionArea")}
        </Label>
        <Tooltip content={String(formData.oldConstructionArea ?? "")} placement="top">
          <Input
            type="text"
            inputMode="decimal"
            placeholder={t("oldDetails.constructionAreaPlaceholder")}
            className="h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
            value={formData.oldConstructionArea ?? ""}
            onChange={(e) => {
              const value = sanitizeAreaDecimal(e.target.value);
              if (value !== '' || e.target.value === '') {
                onFieldChange("oldConstructionArea", value);
              }
            }}
            onKeyDown={preventInvalidNumericKeys}
          />
        </Tooltip>
      </div>
    </>
  );
}
