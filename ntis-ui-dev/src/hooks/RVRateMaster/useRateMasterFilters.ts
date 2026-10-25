import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { IBackendRateMaster } from "@/types/RVRateMaster";

interface UseRateMasterFiltersProps {
  mode: "add" | "edit" | "delete";
  backendRates?: IBackendRateMaster[];
  filterValues?: {
    zone?: string;
    useGroup?: string;
    year?: string;
  };
  useGroupOptions: Array<{ label: string; value: string }>;
  // Policy-configured rate frequency (from PolicyConfiguration table)
  rateFrequencyPolicy?: {
    value: 'Monthly' | 'Yearly';
    isConfigured: boolean;
  };
  // Policy-configured rate unit (from PolicyConfiguration table)
  rateUnitPolicy?: {
    value: 'SqMeter' | 'SqFeet';
    isConfigured: boolean;
  };
}

export function useRateMasterFilters({
  mode: _mode, // Kept for interface compatibility
  backendRates = [],
  filterValues,
  useGroupOptions,
  rateFrequencyPolicy,
  rateUnitPolicy,
}: UseRateMasterFiltersProps) {
  const router = useRouter();

  // Filter states - store both value and label
  const [selectedZone, setSelectedZone] = useState<string>(filterValues?.zone || "");
  const [selectedZoneLabel, setSelectedZoneLabel] = useState<string>("");
  const [selectedUseGroup, setSelectedUseGroup] = useState(filterValues?.useGroup || "");
  const [selectedUseGroupLabel, setSelectedUseGroupLabel] = useState<string>("");
  const [assessmentYear, setAssessmentYear] = useState(filterValues?.year || "");
  const [assessmentYearLabel, setAssessmentYearLabel] = useState<string>("");

  // Sync state when filterValues change (e.g. on URL navigation / SSR re-render)
  useEffect(() => {
    if (filterValues?.zone !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedZone(filterValues.zone);
    }
  }, [filterValues?.zone]);

  useEffect(() => {
    if (filterValues?.useGroup !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedUseGroup(filterValues.useGroup);
    }
  }, [filterValues?.useGroup]);

  useEffect(() => {
    if (filterValues?.year !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAssessmentYear(filterValues.year);
    }
  }, [filterValues?.year]);
  
  // Data states - backendRates are passed from server component
  const [fetchedBackendRates, setFetchedBackendRates] = useState<IBackendRateMaster[]>(backendRates || []);
  
  // Rate frequency state - ALWAYS use policy value if configured
  const [rateFrequency, setRateFrequency] = useState<"Monthly" | "Yearly">(() => {
    if (rateFrequencyPolicy?.isConfigured) {
      return rateFrequencyPolicy.value;
    }
    return "Yearly";
  });

  // Rate unit state - ALWAYS use policy value if configured
  const [rateUnit, setRateUnit] = useState<"SqMeter" | "SqFeet">(() => {
    if (rateUnitPolicy?.isConfigured) {
      return rateUnitPolicy.value;
    }
    return "SqMeter";
  });

  // Multipliers state
  const [multipliers, setMultipliers] = useState<Record<string, number>>(() => 
    useGroupOptions.reduce((acc, option) => {
      acc[option.value] = 1.0;
      return acc;
    }, {} as Record<string, number>)
  );

  // Enforce policy configuration values - always sync from policy when configured
  useEffect(() => {
    if (rateFrequencyPolicy?.isConfigured) {  
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRateFrequency(rateFrequencyPolicy.value);
    }
  }, [rateFrequencyPolicy]);

  useEffect(() => {
    if (rateUnitPolicy?.isConfigured) {    
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRateUnit(rateUnitPolicy.value);
    }
  }, [rateUnitPolicy]);

  // Set rateFrequency from backendRates ONLY if policy is not configured
  // If policy is configured, always use policy value (user cannot change it)
  useEffect(() => {
    // CRITICAL: If policy is configured, don't even try to detect from backend
    if (rateFrequencyPolicy?.isConfigured) {
      return; // Skip detection from backend rates entirely
    }

    // If policy is NOT configured, detect from backend rates
    if (backendRates && Array.isArray(backendRates) && backendRates.length > 0) {
      const hasMonthly = backendRates.some(r => r.rateRemark === "MonthWise Rate");
      const hasYearWise = backendRates.some(r => r.rateRemark === "YearWise Rate");
      
      // Only set if we actually detected a frequency
      if (hasMonthly || hasYearWise) {
        const newFrequency = (hasMonthly && !hasYearWise) ? "Monthly" : "Yearly";
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRateFrequency(newFrequency);
      }
    }
  }, [backendRates, rateFrequencyPolicy]);

  // Sync fetchedBackendRates with backendRates prop whenever it changes
  // Use JSON comparison to detect actual data changes (needed for filter changes in edit/delete mode)
  useEffect(() => {
    if (backendRates && Array.isArray(backendRates)) {
      const newRatesJson = JSON.stringify(backendRates);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional prop-to-state sync with deep comparison
      setFetchedBackendRates(prev => {
        const prevJson = JSON.stringify(prev);
        // Always update if the data actually changed
        if (prevJson !== newRatesJson) {
          return backendRates;
        }
        return prev;
      });
    }
  }, [backendRates]);

  // Handler for dropdown changes - uses URL navigation to trigger server re-render (SSR)
  const handleDropdownChange = useCallback((field: 'zone' | 'useGroup' | 'assessmentYear', value: string, label?: string) => {
    // Update local state for immediate UI feedback
    if (field === 'zone') {
      setSelectedZone(value);
      if (label) setSelectedZoneLabel(label);
    } else if (field === 'useGroup') {
      setSelectedUseGroup(value);
      if (label) setSelectedUseGroupLabel(label);
    } else if (field === 'assessmentYear') {
      setAssessmentYear(value);
      if (label) setAssessmentYearLabel(label);
    }
    
    // Build URL search params preserving all current filter selections
    const params = new URLSearchParams(window.location.search);
    
    const currentZone = field === 'zone' ? value : (selectedZone || filterValues?.zone || '');
    const currentUseGroup = field === 'useGroup' ? value : (selectedUseGroup || filterValues?.useGroup || '');
    const currentYear = field === 'assessmentYear' ? value : (assessmentYear || filterValues?.year || '');

    if (currentZone) {
      params.set('zone', currentZone);
    }
    if (currentUseGroup && currentUseGroup !== 'ALL') {
      params.set('useGroup', currentUseGroup);
    }
    if (currentYear) {
      params.set('assessmentYear', currentYear);
      params.set('year', currentYear);
    }

    // Reset pagination to page 1 on filter change
    if (params.has('page')) {
      params.set('page', '1');
    }
    
    const pathname = window.location.pathname;
    const newUrl = `${pathname}?${params.toString()}`;
    
    // router.push alone triggers server component re-fetch in App Router.
    // Calling router.refresh() immediately after router.push() caused a race condition
    // where the in-flight push transition was aborted, resulting in the URL not updating.
    router.push(newUrl);
  }, [router, selectedZone, selectedUseGroup, assessmentYear, filterValues]);

  // Wrapper for setRateFrequency that enforces policy
  const safeSetRateFrequency = useCallback((value: "Monthly" | "Yearly") => {
    // If policy is configured, ignore the change and keep policy value
    if (rateFrequencyPolicy?.isConfigured) {
      setRateFrequency(rateFrequencyPolicy.value);
      return;
    }
    setRateFrequency(value);
  }, [rateFrequencyPolicy]);

  // Wrapper for setRateUnit that enforces policy
  const safeSetRateUnit = useCallback((value: "SqMeter" | "SqFeet") => {
    // If policy is configured, ignore the change and keep policy value
    if (rateUnitPolicy?.isConfigured) {
      setRateUnit(rateUnitPolicy.value);
      return;
    }
    setRateUnit(value);
  }, [rateUnitPolicy]);

  return {
    // Filter states
    selectedZone,
    selectedZoneLabel,
    selectedUseGroup,
    selectedUseGroupLabel,
    assessmentYear,
    assessmentYearLabel,
    setSelectedZone,
    setSelectedUseGroup,
    setAssessmentYear,
    
    // Data states - passed from server component
    fetchedBackendRates,
    
    // Rate frequency
    rateFrequency,
    setRateFrequency: safeSetRateFrequency,
    
    // Rate unit
    rateUnit,
    setRateUnit: safeSetRateUnit,
    
    // Multipliers
    multipliers,
    setMultipliers,
    
    // Handlers
    handleDropdownChange,
  };
}
