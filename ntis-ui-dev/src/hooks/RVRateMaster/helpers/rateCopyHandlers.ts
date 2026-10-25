import { toast } from "sonner";
import { getRateMasterByFilters } from "@/app/[locale]/property-tax/rate-master/rvratemaster/action";
import type { ISelectOption, IZoneDescription, RateCategory } from "@/types/RVRateMaster";
import { processRatesForCopy, buildZoneEditsFromRates, applyRatesToMatrix } from "./index";

type MatrixRow = {
  id: number;
  zone?: string;
  zoneNo?: string;
  taxZoneId?: number;
  [key: string]: number | string | null | undefined;
};

interface CopyRatesParams {
  selectedZone: string;
  selectedUseGroup: string;
  assessmentYear: string;
  sourceValue: string;
  allZones: IZoneDescription[];
  zoneDescriptions: IZoneDescription[];
  rateCategories: RateCategory[];
  matrixData: MatrixRow[];
  setMatrixData: (data: MatrixRow[]) => void;
  setAllZoneEdits: (edits: Record<string, Record<string, number>>) => void;
  setShowMatrix: (show: boolean) => void;
  getOptionLabel: (options: ISelectOption[], value: string) => string;
  getYearLabel: (value: string) => string;
  t: ReturnType<typeof import("next-intl").useTranslations>;
  aliasLabels?: Record<string, string>;
}

export async function copyRatesFromUseGroup(params: CopyRatesParams & {
  useGroupOptions: ISelectOption[];
  zoneOptions: ISelectOption[];
}) {
  const {
    selectedZone,
    selectedUseGroup,
    assessmentYear,
    sourceValue,
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
  } = params;

  if (!sourceValue) {
    toast.error(t('messages.selectUseGroupCopy', aliasLabels));
    return;
  }
  if (!selectedZone) {
    toast.error(t('messages.selectRateSection', aliasLabels));
    return;
  }
  if (!selectedUseGroup) {
    toast.error(t('messages.selectUseGroup', aliasLabels));
    return;
  }
  if (!assessmentYear) {
    toast.error(t('messages.selectAssessmentYearRangeFull', aliasLabels));
    return;
  }

  try {
    const fetchedRates = await getRateMasterByFilters(selectedZone, sourceValue, assessmentYear);
    
    if (!fetchedRates || fetchedRates.length === 0) {
      toast.error(t('messages.validationNoRatesAvailable', { 
        source: getOptionLabel(useGroupOptions, sourceValue), 
        group: getOptionLabel(zoneOptions, selectedZone), 
        year: getYearLabel(assessmentYear),
        assessment: aliasLabels?.assessment || "Assessment",
        ...aliasLabels,
      }));
      return;
    }

    const { ratesByZone } = processRatesForCopy(fetchedRates);

    if (ratesByZone.size === 0) {
      toast.error(t('messages.validationNoRatesAvailable', { 
        source: getOptionLabel(useGroupOptions, sourceValue), 
        group: getOptionLabel(zoneOptions, selectedZone), 
        year: getYearLabel(assessmentYear),
        assessment: aliasLabels?.assessment || "Assessment",
        ...aliasLabels,
      }));
      return;
    }

    const newEdits = buildZoneEditsFromRates(ratesByZone, allZones, rateCategories);
    setAllZoneEdits(newEdits);
    
    const updatedMatrix = applyRatesToMatrix(matrixData, ratesByZone, zoneDescriptions, rateCategories);
    setMatrixData(updatedMatrix);
    setShowMatrix(true);
    
    toast.success(t('messages.ratesCopiedSuccess', { 
      source: getOptionLabel(useGroupOptions, sourceValue), 
      group: getOptionLabel(zoneOptions, selectedZone), 
      year: getYearLabel(assessmentYear),
      ...aliasLabels,
    }));
  } catch (_error) {
    toast.error(t('messages.validationCopyFailed'));
  }
}

export async function copyRatesFromRateSection(params: CopyRatesParams & {
  useGroupOptions: ISelectOption[];
  zoneOptions: ISelectOption[];
}) {
  const {
    selectedZone,
    selectedUseGroup,
    assessmentYear,
    sourceValue,
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
  } = params;

  if (!selectedZone) {
    toast.error(t('messages.selectRateSection', aliasLabels));
    return;
  }
  if (!sourceValue) {
    toast.error(t('messages.validationSelectRateSectionToCopy', aliasLabels));
    return;
  }
  if (!selectedUseGroup) {
    toast.error(t('messages.selectUseGroup', aliasLabels));
    return;
  }
  if (!assessmentYear) {
    toast.error(t('messages.validationSelectAssessmentYear', aliasLabels));
    return;
  }
  
  try {
    const fetchedRates = await getRateMasterByFilters(sourceValue, selectedUseGroup, String(assessmentYear));
    
    if (!fetchedRates || fetchedRates.length === 0) {
      toast.error(t('messages.validationNoRatesAvailable', { 
        source: getOptionLabel(zoneOptions, sourceValue), 
        group: getOptionLabel(useGroupOptions, selectedUseGroup), 
        year: getYearLabel(assessmentYear),
        assessment: aliasLabels?.assessment || "Assessment",
        ...aliasLabels,
      }));
      return;
    }

    const { ratesByZone } = processRatesForCopy(fetchedRates);
    
    if (ratesByZone.size === 0) {
      toast.error(t('messages.validationNoRatesAvailable', { 
        source: getOptionLabel(zoneOptions, sourceValue), 
        group: getOptionLabel(useGroupOptions, selectedUseGroup), 
        year: getYearLabel(assessmentYear),
        assessment: aliasLabels?.assessment || "Assessment",
        ...aliasLabels,
      }));
      return;
    }

    const newEdits = buildZoneEditsFromRates(ratesByZone, allZones, rateCategories);
    setAllZoneEdits(newEdits);
    
    const updatedMatrix = applyRatesToMatrix(matrixData, ratesByZone, zoneDescriptions, rateCategories);
    setMatrixData(updatedMatrix);
    setShowMatrix(true);

    toast.success(t('messages.ratesCopiedSuccess', { 
      source: getOptionLabel(zoneOptions, sourceValue), 
      group: getOptionLabel(useGroupOptions, selectedUseGroup), 
      year: getYearLabel(assessmentYear),
      ...aliasLabels,
    }));
  } catch (_error) {
    toast.error(t('messages.validationCopyFailed'));
  }
}
