import type { ISelectOption } from "@/types/RVRateMaster";
import { RateCopySection, RateMultipliersSection } from "./RateCopyMultipliersSection";

interface RateCopyMultipliersWrapperProps {
  copySectionsExpanded: boolean;
  showMultipliersInline: boolean;
  sourceUseGroup: string;
  setSourceUseGroup: (value: string) => void;
  sourceRateSection: string;
  setSourceRateSection: (value: string) => void;
  sourceRateSectionOptions: ISelectOption[];
  copyRatesActiveTab: "useGroup" | "rateSection";
  setCopyRatesActiveTab: React.Dispatch<React.SetStateAction<"useGroup" | "rateSection">>;
  useGroupOptions: ISelectOption[];
  selectedUseGroup: string;
  selectedZone: string;
  onCopyRates: () => void;
  onCopyRatesFromRateSection: () => Promise<void>;
  onCloseCopySection: () => void;
  tempMultipliers: Record<string, number>;
  setTempMultipliers: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onApplyMultipliers: () => void;
  onCloseMultipliersSection: () => void;
  t: ReturnType<typeof import("next-intl").useTranslations>;
}

/**
 * Wrapper component for copy rates and multipliers sections
 */
export function RateCopyMultipliersWrapper(props: RateCopyMultipliersWrapperProps) {
  const {
    copySectionsExpanded,
    showMultipliersInline,
    sourceUseGroup,
    setSourceUseGroup,
    sourceRateSection,
    setSourceRateSection,
    sourceRateSectionOptions,
    copyRatesActiveTab,
    setCopyRatesActiveTab,
    useGroupOptions,
    selectedUseGroup,
    selectedZone,
    onCopyRates,
    onCopyRatesFromRateSection,
    onCloseCopySection,
    tempMultipliers,
    setTempMultipliers,
    onApplyMultipliers,
    onCloseMultipliersSection,
    t,
  } = props;

  if (!copySectionsExpanded && !showMultipliersInline) {
    return null;
  }

  return (
    <div className="mt-3">
      <div className="flex flex-row gap-3 items-stretch">
        {copySectionsExpanded && (
          <RateCopySection
            sourceUseGroup={sourceUseGroup}
            setSourceUseGroup={setSourceUseGroup}
            sourceRateSection={sourceRateSection}
            setSourceRateSection={setSourceRateSection}
            sourceRateSectionOptions={sourceRateSectionOptions}
            copyRatesActiveTab={copyRatesActiveTab}
            setCopyRatesActiveTab={setCopyRatesActiveTab}
            useGroupOptions={useGroupOptions}
            selectedUseGroup={selectedUseGroup}
            selectedZone={selectedZone}
            onCopyRates={onCopyRates}
            onCopyRatesFromRateSection={onCopyRatesFromRateSection}
            onClose={onCloseCopySection}
            t={t}
          />
        )}
        {showMultipliersInline && (
          <RateMultipliersSection
            tempMultipliers={tempMultipliers}
            setTempMultipliers={setTempMultipliers}
            useGroupOptions={useGroupOptions}
            onApplyMultipliers={onApplyMultipliers}
            onClose={onCloseMultipliersSection}
            t={t}
          />
        )}
      </div>
    </div>
  );
}
