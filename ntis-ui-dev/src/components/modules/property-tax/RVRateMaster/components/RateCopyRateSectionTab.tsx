"use client";

import { MapPin, CheckCircle } from "lucide-react";
import { SearchSelect } from "@/components/common/SearchSelect";
import { Button } from "@/components/common/ActionButton";
import { Label } from "@/components/common/label";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";
import type { ISelectOption } from "@/types/RVRateMaster";

interface RateCopyRateSectionTabProps {
  sourceRateSection: string;
  setSourceRateSection: (value: string) => void;
  sourceRateSectionOptions: ISelectOption[];
  onCopyRatesFromRateSection: () => void;
  t: ReturnType<typeof import("next-intl").useTranslations>;
}

export function RateCopyRateSectionTab({
  sourceRateSection,
  setSourceRateSection,
  sourceRateSectionOptions,
  onCopyRatesFromRateSection,
  t,
}: RateCopyRateSectionTabProps) {
  const rateSectionLabel = useAliasLabel("Rate_Section", t("aliasFallback.rateSection"));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
          <MapPin size={16} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-800">{t('sections.copyRatesRateSectionTitle', { rateSection: rateSectionLabel })}</h4>
          <p className="text-xs text-gray-500">{t('sections.copyRatesRateSectionSubtitle', { rateSection: rateSectionLabel })}</p>
        </div>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-auto">
          <Label htmlFor="source-rate-section-select" className="text-xs font-medium text-gray-700 mb-1 block">
            {t('sections.selectSourceRateSection', { rateSection: rateSectionLabel })}
          </Label>
          <SearchSelect
            id="source-rate-section-select"
            name="sourceRateSection"
            label=""
            options={sourceRateSectionOptions}
            placeholder={t('placeholders.selectRateSection', { rateSection: rateSectionLabel })}
            value={sourceRateSection}
            onChange={(_name, value) => setSourceRateSection(value)}
            className="text-black"
          />
        </div>

        <Button
          type="button"
          onClick={onCopyRatesFromRateSection}
          disabled={!sourceRateSection}
          className="h-8 ml-1.5 px-2 text-xs font-semibold rounded-lg flex items-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white transition-all min-w-30 justify-center"
        >
          <CheckCircle size={13} className="inline-block" />
          <span className="inline-block leading-none">{t('buttons.copyRatesNow')}</span>
        </Button>
      </div>
    </div>
  );
}
