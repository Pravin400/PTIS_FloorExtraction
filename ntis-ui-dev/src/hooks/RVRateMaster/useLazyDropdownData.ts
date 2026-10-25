import { useState, useCallback } from "react";
import { logger } from "@/lib/utils/logger";
import { getZoneOptions, getUseGroupOptions, getAssessmentYears } from "@/app/[locale]/property-tax/rate-master/rvratemaster/action";
import type { ISelectOption } from "@/types/RVRateMaster";
import type { AssessmentYearRangeOption } from "@/types/RVRateMaster";

interface UseLazyDropdownDataReturn {
  // Data states
  zoneOptions: ISelectOption[];
  useGroupOptions: ISelectOption[];
  assessmentYears: AssessmentYearRangeOption[];

  // Loading states
  isLoadingZones: boolean;
  isLoadingUseGroups: boolean;
  isLoadingAssessmentYears: boolean;

  // Load triggers
  loadZoneOptions: () => Promise<void>;
  loadUseGroupOptions: () => Promise<void>;
  loadAssessmentYears: () => Promise<void>;
}

/**
 * Hook for lazy loading dropdown data on demand
 * Each dropdown's data is only fetched when the dropdown is opened for the first time
 */
export function useLazyDropdownData(): UseLazyDropdownDataReturn {
  // Data states
  const [zoneOptions, setZoneOptions] = useState<ISelectOption[]>([]);
  const [useGroupOptions, setUseGroupOptions] = useState<ISelectOption[]>([]);
  const [assessmentYears, setAssessmentYears] = useState<AssessmentYearRangeOption[]>([]);

  // Loading states
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [isLoadingUseGroups, setIsLoadingUseGroups] = useState(false);
  const [isLoadingAssessmentYears, setIsLoadingAssessmentYears] = useState(false);

  // Loaded flags to prevent re-fetching
  const [zonesLoaded, setZonesLoaded] = useState(false);
  const [useGroupsLoaded, setUseGroupsLoaded] = useState(false);
  const [assessmentYearsLoaded, setAssessmentYearsLoaded] = useState(false);

  // Load zone options on demand
  const loadZoneOptions = useCallback(async () => {
    if (zonesLoaded || isLoadingZones) return;

    setIsLoadingZones(true);
    try {
      const data = await getZoneOptions();
      setZoneOptions(data);
      setZonesLoaded(true);
    } catch (error) {
      logger.error("Failed to load zone options", { error: error as Error });
      setZoneOptions([]);
    } finally {
      setIsLoadingZones(false);
    }
  }, [zonesLoaded, isLoadingZones]);

  // Load use group options on demand
  const loadUseGroupOptions = useCallback(async () => {
    if (useGroupsLoaded || isLoadingUseGroups) return;

    setIsLoadingUseGroups(true);
    try {
      const data = await getUseGroupOptions();
      setUseGroupOptions(data);
      setUseGroupsLoaded(true);
    } catch (error) {
      logger.error("Failed to load use group options", { error: error as Error });
      setUseGroupOptions([]);
    } finally {
      setIsLoadingUseGroups(false);
    }
  }, [useGroupsLoaded, isLoadingUseGroups]);

  // Load assessment years on demand
  const loadAssessmentYears = useCallback(async () => {
    if (assessmentYearsLoaded || isLoadingAssessmentYears) return;

    setIsLoadingAssessmentYears(true);
    try {
      const data = await getAssessmentYears();
      setAssessmentYears(data);
      setAssessmentYearsLoaded(true);
    } catch (error) {
      logger.error("Failed to load assessment years", { error: error as Error });
      setAssessmentYears([]);
    } finally {
      setIsLoadingAssessmentYears(false);
    }
  }, [assessmentYearsLoaded, isLoadingAssessmentYears]);

  return {
    // Data
    zoneOptions,
    useGroupOptions,
    assessmentYears,

    // Loading states
    isLoadingZones,
    isLoadingUseGroups,
    isLoadingAssessmentYears,

    // Load functions
    loadZoneOptions,
    loadUseGroupOptions,
    loadAssessmentYears,
  };
}
