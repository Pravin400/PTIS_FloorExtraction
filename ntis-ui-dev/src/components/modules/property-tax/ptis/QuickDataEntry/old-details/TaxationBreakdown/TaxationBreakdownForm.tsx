"use client"

import { useMemo } from "react";
import type { TaxationBreakdownFormProps } from "@/types/OldDetails/property-old-details.types";
import { useTaxationBreakdownForm } from "@/hooks/ptis/QuickDataEntry/Olddetails/useTaxationBreakdownForm";
import { SearchSelect, Input } from "@/components/common";
import { Tooltip } from "@/components/common/Tooltip";
import { Label } from "@/components/common/label";
import { Calculator, AlertCircle } from "lucide-react";

// Import refactored components
import { DynamicTaxFields } from "./components/DynamicTaxFields";
import { UpdateButton, AddButton } from "@/components/common/ActionButtons";

/**
 * TaxationBreakdownForm - Main Component
 * Orchestrates taxation breakdown data entry and management
 * Delegates field groups to focused sub-components for better organization
 */
export default function TaxationBreakdownForm({
  initialData = null,
  yearOptions = [],
}: TaxationBreakdownFormProps) {

  const {
    taxes,
    selectedYearId,
    setSelectedYearId,
    isSubmitting,
    handleTaxChange,
    handleSave,
    isChanged,
    hasTaxData,
    hasAppliedTaxes,
    validationErrors,
    t,
    tValidation,
  } = useTaxationBreakdownForm(initialData, yearOptions);

  const transformedYearOptions = useMemo(() => {
    return [...(yearOptions || [])]
      .sort((a, b) => (b.year || 0) - (a.year || 0))
      .map((y) => ({
        label: String(y.year),
        value: String(y.id),
      }));
  }, [yearOptions]);

  // Check if year is already set (financeYearId and year are available)
  const isYearLocked = useMemo(() => {
    return !!(initialData?.taxYears?.[0]?.financeYearId && initialData?.taxYears?.[0]?.year);
  }, [initialData]);

  // Get the selected year display value
  const selectedYearDisplay = useMemo(() => {
    if (isYearLocked && initialData?.taxYears?.[0]?.year) {
      return String(initialData.taxYears[0].year);
    }
    const selectedYear = yearOptions.find(y => String(y.id) === selectedYearId);
    return selectedYear ? String(selectedYear.year) : '';
  }, [isYearLocked, initialData, yearOptions, selectedYearId]);

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      <div className="bg-white rounded-xl border border-blue-100 shadow-xs p-5">
        {/* Card Header matching Property Information layout */}
        <div className="-mx-5 mb-5 px-5 pb-3 border-b border-blue-100 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-blue-700">
            {t("title")}
          </h3>
        </div>

        {/* Warning when no tax data is available */}
        {!hasTaxData && (
          <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-amber-50/60 border border-amber-100/80 rounded-xl transition-all duration-300">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              {t("noTaxDataAvailable")}
            </p>
          </div>
        )}

        {/* 4-column form layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-3">
          <div className="relative flex flex-col space-y-1.5 z-[100] group">
            <Label className="text-xs font-semibold text-slate-700 transition-colors group-focus-within:text-blue-600">
              {t("assessmentYear")} <span className="text-red-500 ml-0.5">*</span>
            </Label>
            {isYearLocked ? (
              <Tooltip content={selectedYearDisplay} placement="top">
                <Input
                  type="text"
                  className="h-9 text-sm rounded-lg border-slate-500 bg-slate-50 cursor-not-allowed text-slate-500 font-medium"
                  value={selectedYearDisplay}
                  disabled
                  autoFocus
                  readOnly
                />
              </Tooltip>
            ) : (
              <div className="relative">
                <Tooltip content={transformedYearOptions.find(opt => opt.value === selectedYearId)?.label || ''} placement="top">
                  <div className="w-full">
                    <SearchSelect
                      options={transformedYearOptions}
                      placeholder={t("selectYearPlaceholder")}
                      autoFocus
                      className={`h-9 text-sm rounded-lg focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 ${validationErrors.yearMaster
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10 text-red-900 bg-red-50/30'
                        : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 text-gray-900 bg-white'
                        }`}
                      name="yearMaster"
                      onChange={(_, val) => setSelectedYearId(val)}
                      value={selectedYearId}
                    />
                  </div>
                </Tooltip>
                {validationErrors.yearMaster && (
                  <span className="text-[10px] font-medium text-red-500 absolute top-full left-0 mt-1 flex items-center gap-1 bg-red-50 border border-red-100 rounded px-1.5 py-0.5 shadow-sm whitespace-nowrap z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                    {validationErrors.yearMaster}
                  </span>
                )}
              </div>
            )}
          </div>
          <DynamicTaxFields
            taxes={taxes}
            onTaxChange={handleTaxChange}
            validationErrors={validationErrors}
          />
        </div>

        {/* Action Buttons: align to bottom right without top divider */}
        <div className="flex justify-end mt-6 gap-3">
          {hasAppliedTaxes ? (
            <UpdateButton
              label={
                isSubmitting
                  ? tValidation('footer.saving')
                  : tValidation('commonbuttonmessages.UpdateChanges')
              }
              type="submit"
              onClick={handleSave}
              isLoading={isSubmitting}
              disabled={isSubmitting || !hasTaxData || !isChanged || Object.keys(validationErrors).length > 0}
            />
          ) : (
            hasTaxData && (
              <AddButton
                label={tValidation("oldDetails.oldTaxation.applyTaxes")}
                type="submit"
                onClick={handleSave}
                isLoading={isSubmitting}
                disabled={isSubmitting || !hasTaxData || !isChanged || Object.keys(validationErrors).length > 0}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
