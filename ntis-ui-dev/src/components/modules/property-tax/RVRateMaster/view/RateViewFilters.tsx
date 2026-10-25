"use client";

import { MapPin, Calendar, Users } from "lucide-react";
import { SearchSelect } from "@/components/common";
import { Label } from "@/components/common/label";
import type { ISelectOption } from "@/types/RVRateMaster";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

interface RateViewFiltersProps {
  zones: ISelectOption[];
  assessmentYears: ISelectOption[];
  useGroupsFiltered: ISelectOption[];
  selectedZone: string;
  selectedYear: string;
  selectedUseGroup: string;
  onZoneChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onUseGroupChange: (value: string) => void;
  t: ReturnType<typeof import("next-intl").useTranslations>;
  disabled?: boolean;
  isOpenPlot?: boolean;
}

export function RateViewFilters({
  zones,
  assessmentYears,
  useGroupsFiltered,
  selectedZone,
  selectedYear,
  selectedUseGroup,
  onZoneChange,
  onYearChange,
  onUseGroupChange,
  t,
  disabled = false,
  isOpenPlot = false,
}: RateViewFiltersProps) {
  const rateSectionLabel = useAliasLabel("Rate_Section", t("aliasFallback.rateSection"));
  const assessmentLabel = useAliasLabel("Assessment", t("aliasFallback.assessment"));
  const typeOfUseLabel = useAliasLabel("Type_Of_Use", t("aliasFallback.typeOfUse"));

  return (
    <div className={`grid grid-cols-1 ${isOpenPlot ? 'md:grid-cols-2 w-[500px]' : 'md:grid-cols-3 w-200'} gap-1.5`}>
      {/* Rate Section */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="zone-select" className="flex items-center gap-1 text-xs font-medium text-gray-700">
          <MapPin className="w-3.5 h-3.5 text-blue-500" />
          {t('filters.rateSection', { rateSection: rateSectionLabel })}
        </Label>
        <SearchSelect
          id="zone-select"
          name="zone"
          label=""
          options={zones}
          value={selectedZone}
          onChange={(_name, value) => onZoneChange(value)}
          className="h-7 w-10 text-xs"
          disabled={disabled}
        />
      </div>

      {/* Assessment Year */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="year-select" className="flex items-center gap-1 text-xs font-medium text-gray-700">
          <Calendar className="w-3.5 h-3.5 text-blue-500" />
          {t('filters.assessmentYear', { assessment: assessmentLabel })}
        </Label>
        <SearchSelect
          id="year-select"
          name="year"
          label=""
          options={assessmentYears}
          value={selectedYear}
          onChange={(_name, value) => onYearChange(value)}
          className="h-7 w-20 text-xs"
          disabled={disabled}
        />
      </div>

      {/* Use Group */}
      {!isOpenPlot && (
        <div className="flex flex-col gap-1">
          <Label htmlFor="useGroup-select" className="flex items-center gap-1 text-xs font-medium text-gray-700">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            {t('filters.typeOfUseGroup', { typeOfUse: typeOfUseLabel })}
          </Label>
          <SearchSelect
            id="useGroup-select"
            name="useGroup"
            label=""
            options={useGroupsFiltered}
            value={selectedUseGroup ?? ""}
            onChange={(_name, value) => onUseGroupChange(value)}
            className="h-7 text-xs"
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
