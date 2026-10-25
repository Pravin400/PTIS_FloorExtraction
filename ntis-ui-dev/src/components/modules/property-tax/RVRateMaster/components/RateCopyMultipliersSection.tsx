"use client";

import { Users, MapPin, TrendingUp, CheckCircle } from "lucide-react";
import { CloseIconButton, TabButton } from "@/components/common/ActionButtons";
import { MatrixCellInput } from "@/components/common/MatrixCellInput";
import { Button } from "@/components/common/ActionButton";
import { Label } from "@/components/common/label";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import { RateCopyUseGroupTab } from "./RateCopyUseGroupTab";
import { RateCopyRateSectionTab } from "./RateCopyRateSectionTab";
import type { ISelectOption } from "@/types/RVRateMaster";

interface RateCopySectionProps {
  // Copy Rates state
  sourceUseGroup: string;
  setSourceUseGroup: (value: string) => void;
  sourceRateSection: string;
  setSourceRateSection: (value: string) => void;
  sourceRateSectionOptions: ISelectOption[];
  copyRatesActiveTab: "useGroup" | "rateSection";
  setCopyRatesActiveTab: (tab: "useGroup" | "rateSection") => void;
  // Options
  useGroupOptions: ISelectOption[];
  selectedUseGroup: string;
  selectedZone: string;
  // Handlers
  onCopyRates: () => void;
  onCopyRatesFromRateSection: () => void;
  onClose: () => void;
  // Translations
  t: ReturnType<typeof import("next-intl").useTranslations>;
}

interface RateMultipliersSectionProps {
  // Multipliers state
  tempMultipliers: Record<string, number>;
  setTempMultipliers: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  // Options
  useGroupOptions: ISelectOption[];
  // Handlers
  onApplyMultipliers: () => void;
  onClose: () => void;
  // Translations
  t: ReturnType<typeof import("next-intl").useTranslations>;
}

export function RateCopySection({
  sourceUseGroup,
  setSourceUseGroup,
  sourceRateSection,
  setSourceRateSection,
  sourceRateSectionOptions,
  copyRatesActiveTab,
  setCopyRatesActiveTab,
  useGroupOptions,
  selectedUseGroup,
  onCopyRates,
  onCopyRatesFromRateSection,
  onClose,
  t,
}: RateCopySectionProps) {
  const useLabel = useAliasLabel("Use", t("aliasFallback.use"));
  const rateSectionLabel = useAliasLabel("Rate_Section", t("aliasFallback.rateSection"));

  return (
    <div className="flex-1 max-w-2xl">
      <div className="rounded-xl border border-blue-200 bg-white shadow-md relative h-50px flex flex-col">
        {/* Close Button */}
        <CloseIconButton onClick={onClose} />

        {/* Tabs and Content - Horizontal Layout */}
        <div className="flex h-full">
          {/* Tabs - Left Side */}
          <div className="w-32 border-r border-gray-200 bg-gray-50 p-1.5 space-y-1">
            <TabButton
              icon={Users}
              label={t('sections.useGroupTab', { use: useLabel })}
              active={copyRatesActiveTab === "useGroup"}
              onClick={() => setCopyRatesActiveTab("useGroup")}
            />
            <TabButton
              icon={MapPin}
              label={t('sections.rateSectionTab', { rateSection: rateSectionLabel })}
              active={copyRatesActiveTab === "rateSection"}
              onClick={() => setCopyRatesActiveTab("rateSection")}
            />
          </div>

          {/* Content - Right Side */}
          <div className="flex-1 p-3">
            {copyRatesActiveTab === "useGroup" && (
              <RateCopyUseGroupTab
                sourceUseGroup={sourceUseGroup}
                setSourceUseGroup={setSourceUseGroup}
                useGroupOptions={useGroupOptions}
                selectedUseGroup={selectedUseGroup}
                onCopyRates={onCopyRates}
                t={t}
              />
            )}

            {copyRatesActiveTab === "rateSection" && (
              <RateCopyRateSectionTab
                sourceRateSection={sourceRateSection}
                setSourceRateSection={setSourceRateSection}
                sourceRateSectionOptions={sourceRateSectionOptions}
                onCopyRatesFromRateSection={onCopyRatesFromRateSection}
                t={t}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RateMultipliersSection({
  tempMultipliers,
  setTempMultipliers,
  useGroupOptions,
  onApplyMultipliers,
  onClose,
  t,
}: RateMultipliersSectionProps) {
  const useLabel = useAliasLabel("Use", t("aliasFallback.use"));

  return (
    <div className="flex-1 max-w-2xl">
      <div className="rounded-xl border border-blue-200 bg-white shadow-md h-full max-h-full flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="p-2 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-800">{t('sections.multipliersTitle', { use: useLabel })}</h4>
            </div>
            <CloseIconButton onClick={onClose} className="bg-white" size={16} />
          </div>
        </div>

        {/* Multipliers List - Scrollable */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden min-h-0">
          <div className="p-2 flex flex-row gap-4 items-end min-w-full">
            {useGroupOptions.map((option) => (
              <div key={option.value} className="flex flex-col items-center gap-1 flex-1 min-w-20">
                <Label htmlFor={`multiplier-${option.value}`} className="text-xs font-medium text-gray-700 whitespace-nowrap text-center">
                  {option.label}
                </Label>
                <MatrixCellInput
                  value={Number(tempMultipliers[option.value] ?? 1.0)}
                  rowId="multiplier"
                  columnId={option.value}
                  metaLabel={option.label}
                  className="w-full px-2 text-center font-medium h-7 text-xs rounded-md border border-blue-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  onCellChange={(_row: string, col: string, val: string | number) => {
                    const numValue = Number(val);
                    if (!isNaN(numValue) && numValue >= 0) {
                      setTempMultipliers(prev => ({ ...prev, [col]: numValue }));
                    }
                  }}
                />
              </div>
            ))}

            {/* Apply Button - Inline */}
            <Button
              disabled={Object.values(tempMultipliers).every(value => value === 1.0)}
              onClick={onApplyMultipliers}
              className="h-8 ml-1.5 px-2 text-xs font-semibold rounded-lg flex items-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white transition-all min-w-30 justify-center"
            >
              <CheckCircle size={13} className="inline-block" />
              <span className="inline-block leading-none">{t('buttons.applyMultipliers')}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
