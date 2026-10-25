"use client";

import { Grid2X2, MapPin, Calendar, Users, CheckCircle } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SaveButton, DeleteLabelButton } from "@/components/common/ActionButtons";
import type { ISelectOption } from "@/types/RVRateMaster";

interface RateMatrixHeaderProps {
  selectedZone: string;
  selectedZoneLabel?: string;
  selectedUseGroup: string;
  selectedUseGroupLabel?: string;
  assessmentYear: string;
  assessmentYearLabel?: string;
  zoneOptions: ISelectOption[];
  useGroupOptions: ISelectOption[];
  assessmentYears: ISelectOption[];
  assessmentYearRanges?: Array<{
    label: string;
    value: string;
    fromYear: string | number;
    toYear: string | number;
  }>;
  filledRatesCount: number;
  mode: "edit" | "delete" | "add";
  id?: string | null;
  onAddRates: () => void;
  onUpdateRates: () => void;
  onDeleteRates: () => void;
  t: ReturnType<typeof import("next-intl").useTranslations>;
  existingRateFound: boolean;
  isCheckingRates?: boolean;
}

export function RateMatrixHeader({
  selectedZone,
  selectedZoneLabel,
  selectedUseGroup,
  selectedUseGroupLabel,
  assessmentYear,
  assessmentYearLabel,
  zoneOptions,
  useGroupOptions,
  assessmentYears,
  assessmentYearRanges,
  filledRatesCount,
  mode,
  id,
  onAddRates,
  onUpdateRates,
  onDeleteRates,
  t,
  isCheckingRates,
}: RateMatrixHeaderProps) {
  return (
    <div className="bg-white border-b border-[#e0e7ef] px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded bg-[#e3eafc] text-blue-600 flex items-center justify-center">
          <Grid2X2 className="w-4 h-4" />
        </div>
        <span className="text-base font-semibold text-gray-700">{t('sections.rateEntryMatrix')}</span>
        <span className="ml-2 px-2 py-0.5 bg-[#e3eafc] text-blue-700 text-xs font-semibold rounded">{t('messages.active')}</span>
        
        {selectedZone && (
          <StatusBadge
            variant="info"
            icon={<MapPin className="w-4 h-4" />}
            label={selectedZoneLabel || zoneOptions.find(z => z.value === selectedZone)?.label || selectedZone}
          />
        )}
        {assessmentYear && (
          <StatusBadge
            variant="info"
            icon={<Calendar className="w-4 h-4" />}
            label={
              assessmentYearLabel ||
              assessmentYearRanges?.find(ay => String(ay.value) === String(assessmentYear))?.label ||
              assessmentYears?.find(ay => String(ay.value) === String(assessmentYear))?.label ||
              String(assessmentYear)
            }
          />
        )}
        {selectedUseGroup && (
          <StatusBadge
            variant="info"
            icon={<Users className="w-4 h-4" />}
            label={
              selectedUseGroupLabel ||
              selectedUseGroup
                .split(",")
                .map(id => useGroupOptions.find(u => String(u.value) === String(id.trim()))?.label || id.trim())
                .join(", ")
            }
          />
        )}
        <StatusBadge
          variant="info"
          icon={<CheckCircle className="w-4 h-4" />}
          label={t('messages.ratesConfigured', { count: filledRatesCount })}
        />
      </div>
      
      <div>
        {mode !== "delete" && (
          <SaveButton
            label={id ? t('buttons.updateRates') : t('buttons.addRates')}
            onClick={id ? onUpdateRates : onAddRates}
            size="md"
            className="px-4 py-2"
            disabled={isCheckingRates}
          />
        )}
        {mode === "delete" && (
          <DeleteLabelButton
            label={t('buttons.deleteRates')}
            onClick={onDeleteRates}
            size="md"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
          />
        )}
      </div>
    </div>
  );
}
