import { useMemo } from "react";

import { RateItem, SectionItem } from "@/types/rateSectionMaster.types";

interface UseWardRateSectionLabelProps {
  selectedRateSection: string | null;
  propSelectedRateSectionLabel?: string;
  rates: RateItem[];
  sections: SectionItem[];
}

export function useWardRateSectionLabel({
  selectedRateSection,
  propSelectedRateSectionLabel,
  rates,
  sections
}: UseWardRateSectionLabelProps) {


  const rateSectionLabel = useMemo(() => {
    if (!selectedRateSection) {
      return null;
    }

    const rateIndex = rates.findIndex(r => r.rateSectionNo === selectedRateSection || r.id?.toString() === selectedRateSection);
    const rate = rateIndex !== -1 ? rates[rateIndex] : undefined;

    if (propSelectedRateSectionLabel) {
      const parts = propSelectedRateSectionLabel.split(" - ");
      if (parts.length > 1) {
        return parts.slice(1).join(" - ");
      }
      return propSelectedRateSectionLabel;
    }

    if (rate) {
      return rate.description ? rate.description : selectedRateSection;
    } else if (sections.length > 0 && sections[0]?.rateSectionNo) {
      const firstSection = sections[0];
      return firstSection.description ? firstSection.description : selectedRateSection;
    } else {
      return selectedRateSection;
    }
  }, [rates, selectedRateSection, sections, propSelectedRateSectionLabel]);

  const rateSectionExists = selectedRateSection ? (
    rates.some(r => r.rateSectionNo === selectedRateSection) || 
    sections.length > 0 || 
    !!propSelectedRateSectionLabel
  ) : false;

  const effectiveSelectedRateSection = rateSectionExists ? selectedRateSection : null;

  return { rateSectionLabel, effectiveSelectedRateSection };
}
