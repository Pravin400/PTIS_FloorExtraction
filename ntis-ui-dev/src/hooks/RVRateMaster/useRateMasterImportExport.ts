import { useState, useEffect, useRef, useMemo } from "react";
import type { ISelectOption, IZoneDescription, RateCategory } from "@/types/RVRateMaster";
import { copyRatesFromUseGroup, copyRatesFromRateSection } from "./helpers/rateCopyHandlers";
import { handleTemplateDownload, handleFileUpload } from "./helpers/rateImportExportHandlers";
import { useAliasLabel } from "@/lib/providers/AliasLabelsProvider";

type MatrixRow = {
  id: number;
  zone?: string;
  zoneNo?: string;
  taxZoneId?: number;
  [key: string]: number | string | null | undefined;
};

interface UseRateMasterImportExportProps {
  selectedZone: string;
  selectedUseGroup: string;
  assessmentYear: string;
  allZones: IZoneDescription[];
  zoneDescriptions: IZoneDescription[];
  rateCategories: RateCategory[];
  zoneOptions: ISelectOption[];
  useGroupOptions: ISelectOption[];
  assessmentYears: ISelectOption[];
  assessmentYearRanges?: Array<{
    label: string;
    value: string;
    fromYear: string | number;
    toYear: string | number;
  }>;
  matrixData: MatrixRow[];
  setMatrixData: (data: MatrixRow[]) => void;
  allZoneEdits: Record<string, Record<string, number>>;
  setAllZoneEdits: (edits: Record<string, Record<string, number>>) => void;
  setShowMatrix: (show: boolean) => void;
  showMatrix: boolean;
  showCopyRateSection?: boolean;
  t: ReturnType<typeof import("next-intl").useTranslations>;
  multipliers: Record<string, number>;
  setMultipliers: (multipliers: Record<string, number>) => void;
  rateUnit: "SqMeter" | "SqFeet";
}

export function useRateMasterImportExport({
  selectedZone,
  selectedUseGroup,
  assessmentYear,
  allZones,
  zoneDescriptions,
  rateCategories,
  zoneOptions,
  useGroupOptions,
  assessmentYears,
  assessmentYearRanges,
  matrixData,
  setMatrixData,
  allZoneEdits,
  setAllZoneEdits,
  setShowMatrix,
  showMatrix,
  showCopyRateSection,
  t,
  multipliers,
  rateUnit,
}: UseRateMasterImportExportProps) {
  const rateSectionLabel = useAliasLabel("Rate_Section", t("aliasFallback.rateSection"));
  const typeOfUseLabel = useAliasLabel("Type_Of_Use", t("aliasFallback.typeOfUse"));
  const assessmentLabel = useAliasLabel("Assessment", t("aliasFallback.assessment"));
  const useLabel = useAliasLabel("Use", t("aliasFallback.use"));

  const aliasLabels = useMemo(() => ({
    rateSection: rateSectionLabel,
    typeOfUse: typeOfUseLabel,
    assessment: assessmentLabel,
    use: useLabel,
  }), [rateSectionLabel, typeOfUseLabel, assessmentLabel, useLabel]);
  const [sourceUseGroup, setSourceUseGroup] = useState("");
  const [sourceRateSection, setSourceRateSection] = useState("");
  const sourceRateSectionOptions = zoneOptions.filter(
    (opt) => !selectedZone || opt.value !== selectedZone
  );
  const [copySectionsExpanded, setCopySectionsExpanded] = useState(showCopyRateSection ?? false);
  const [copyRatesActiveTab, setCopyRatesActiveTab] = useState<"useGroup" | "rateSection">("useGroup");
  const [showMultipliersInline, setShowMultipliersInline] = useState(false);
  const [tempMultipliers, setTempMultipliers] = useState<Record<string, number>>(() => 
    useGroupOptions.reduce((acc, option) => {
      acc[option.value] = 1.0;
      return acc;
    }, {} as Record<string, number>)
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Initialize state from URL params (syncing with external system)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const showCopyRates = params.get('showCopyRates');
      const showMultipliersParam = params.get('showMultipliers');
      if (showCopyRates === 'true') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCopySectionsExpanded(true);
      }
      if (showMultipliersParam === 'true') {
        setShowMultipliersInline(true);
      }
    }
  }, []);
  // Sync temp multipliers when multipliers section is opened
  useEffect(() => {
    if (showMultipliersInline) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTempMultipliers({ ...multipliers });
    }
  }, [showMultipliersInline, multipliers]);
  const getOptionLabel = (options: ISelectOption[], value: string) => 
    options.find(opt => opt.value === value)?.label || value;

  const getYearLabel = (value: string) => 
    assessmentYearRanges?.find(ay => String(ay.value) === String(value))?.label ||
    assessmentYears?.find(ay => String(ay.value) === String(value))?.label || 
    value;

  const handleCopyRatesFromRateSection = async () => {
    await copyRatesFromRateSection({
      selectedZone,
      selectedUseGroup,
      assessmentYear,
      sourceValue: sourceRateSection,
      allZones,
      zoneDescriptions,
      rateCategories,
      matrixData,
      setMatrixData,
      setAllZoneEdits,
      setShowMatrix,
      getOptionLabel,
      getYearLabel,
      useGroupOptions,
      zoneOptions,
      t,
      aliasLabels,
    });
  };

  const handleCopyRates = async () => {
    await copyRatesFromUseGroup({
      selectedZone,
      selectedUseGroup,
      assessmentYear,
      sourceValue: sourceUseGroup,
      allZones,
      zoneDescriptions,
      rateCategories,
      matrixData,
      setMatrixData,
      setAllZoneEdits,
      setShowMatrix,
      getOptionLabel,
      getYearLabel,
      useGroupOptions,
      zoneOptions,
      t,
      aliasLabels,
    });
  };

  const handleDownloadTemplate = () => {
    handleTemplateDownload({
      selectedZone,
      selectedUseGroup,
      assessmentYear,
      allZones,
      rateCategories,
      rateUnit,
      t,
      aliasLabels,
    });
  };

  const handleUploadExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(event, {
      allZones,
      rateCategories,
      matrixData,
      allZoneEdits,
      showMatrix,
      setMatrixData,
      setAllZoneEdits,
      setShowMatrix,
      fileInputRef,
      t,
      rateUnit,
    });
  };

  return {
    sourceUseGroup,
    setSourceUseGroup,
    sourceRateSection,
    setSourceRateSection,
    sourceRateSectionOptions,
    copySectionsExpanded,
    setCopySectionsExpanded,
    copyRatesActiveTab,
    setCopyRatesActiveTab,
    showMultipliersInline,
    setShowMultipliersInline,
    tempMultipliers,
    setTempMultipliers,
    fileInputRef,
    handleCopyRates,
    handleCopyRatesFromRateSection,
    handleDownloadTemplate,
    handleUploadExcel,
  };
}
