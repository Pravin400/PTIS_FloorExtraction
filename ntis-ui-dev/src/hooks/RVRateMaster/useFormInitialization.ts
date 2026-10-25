import { useEffect } from "react";
import type { IBackendRateMaster, IRateMaster, ISelectOption } from "@/types/RVRateMaster";

interface FormInitializationProps {
  mode: "edit" | "delete" | "add";
  id?: string | null;
  editData?: IRateMaster | null;
  bulkEditData?: IRateMaster[] | null;
  filterValues?: {
    zone?: string;
    year?: string;
    useGroup?: string;
  };
  backendRates?: IBackendRateMaster[] | null;
  assessmentYears: ISelectOption[];
  zoneOptions: ISelectOption[];
  useGroupOptions: ISelectOption[];
  showCopyRateSection?: boolean;
  showMultipliersSection?: boolean;
  setSelectedZone: (zone: string) => void;
  setSelectedUseGroup: (useGroup: string) => void;
  setAssessmentYear: (year: string) => void;
  setShowMatrix: (show: boolean) => void;
}

/**
 * Hook to initialize form state from URL params, filter values, and backend data
 */
export function useFormInitialization({
  mode,
  id,
  editData,
  bulkEditData,
  filterValues,
  backendRates,
  assessmentYears,
  zoneOptions,
  useGroupOptions,
  showCopyRateSection,
  showMultipliersSection,
  setSelectedZone,
  setSelectedUseGroup,
  setAssessmentYear,
  setShowMatrix,
}: FormInitializationProps) {

  // On mount and when options change, set dropdowns from URL query params (only in add mode)
  useEffect(() => {
    if (typeof window === "undefined" || mode === 'edit' || mode === 'delete') return;
    
    const params = new URLSearchParams(window.location.search);
    const zone = params.get("zone");
    const useGroup = params.get("useGroup");
    const assessmentYearParam = params.get("assessmentYear");
    if (zone) setSelectedZone(zone);
    if (useGroup) setSelectedUseGroup(useGroup);
    if (assessmentYearParam) setAssessmentYear(assessmentYearParam);
  }, [mode, setSelectedZone, setSelectedUseGroup, setAssessmentYear]);

  // Sync state with filterValues or URL query params
  useEffect(() => {
    let urlAssessmentYear = "", urlZone = "", urlUseGroup = "";
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      urlAssessmentYear = params.get("assessmentYear") || "";
      urlZone = params.get("zone") || "";
      urlUseGroup = params.get("useGroup") || "";
    }
    
    if (mode === 'edit' || mode === 'delete') {
      if (urlZone) setSelectedZone(urlZone);
      else if (filterValues?.zone) setSelectedZone(filterValues.zone);
      else if (zoneOptions?.length) setSelectedZone(zoneOptions[0].value);

      if (urlUseGroup) setSelectedUseGroup(urlUseGroup);
      else if (filterValues?.useGroup) setSelectedUseGroup(filterValues.useGroup);
      else if (useGroupOptions?.length) setSelectedUseGroup(useGroupOptions[0].value);

      if (urlAssessmentYear) setAssessmentYear(urlAssessmentYear);
      else if (filterValues?.year) {
        const found = assessmentYears?.find(y => String(y.value) === String(filterValues.year));
        setAssessmentYear(found ? found.value : filterValues.year);
      } else if (assessmentYears?.length) setAssessmentYear(assessmentYears[0].value);
    } else {
      if (urlZone) setSelectedZone(urlZone);
      else if (filterValues?.zone) setSelectedZone(filterValues.zone);
      
      if (urlUseGroup) setSelectedUseGroup(urlUseGroup);
      else if (filterValues?.useGroup) setSelectedUseGroup(filterValues.useGroup);
      
      if (urlAssessmentYear) setAssessmentYear(urlAssessmentYear);
      else if (filterValues?.year) {
        const found = assessmentYears?.find(y => String(y.value) === String(filterValues.year));
        setAssessmentYear(found ? found.value : filterValues.year);
      }
    }
  }, [filterValues, assessmentYears, zoneOptions, useGroupOptions, mode, setSelectedZone, setSelectedUseGroup, setAssessmentYear]);

  // Show matrix when sections are expanded
  useEffect(() => {
    if (showMultipliersSection || showCopyRateSection) {
      const hasFilterValues = !!filterValues?.zone && !!filterValues?.useGroup;
      const isEditMode = !!id || !!editData || !!bulkEditData;
      if (isEditMode || hasFilterValues) {
        setShowMatrix(true);
      }
    }
  }, [showMultipliersSection, showCopyRateSection, id, editData, bulkEditData, filterValues?.zone, filterValues?.useGroup, setShowMatrix]);

  // Populate assessmentYear from backend data on edit
  useEffect(() => {
    if (backendRates?.length) {
      const yearRangeRVId = backendRates[0].yearRangeRVId || backendRates[0].yearRangeId;
      if (yearRangeRVId && assessmentYears?.length) {
        const ayOption = assessmentYears.find(opt => String(opt.value) === String(yearRangeRVId));
        if (ayOption) setAssessmentYear(ayOption.value);
      }
    } else if (editData?.assessmentYear) {
      setAssessmentYear(editData.assessmentYear);
    }
  }, [editData, backendRates, assessmentYears, setAssessmentYear]);
}
