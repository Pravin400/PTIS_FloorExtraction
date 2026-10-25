import { useEffect } from "react";
import { getRateMasterByFilters } from "@/app/[locale]/property-tax/rate-master/rvratemaster/action";
import type { IRateMaster, RateCategory } from "@/types/RVRateMaster";

interface ExistingRateCheckProps {
  mode: "edit" | "delete" | "add";
  id?: string | null;
  editData?: IRateMaster | null;
  bulkEditData?: IRateMaster[] | null;
  selectedZone: string;
  selectedUseGroup: string;
  assessmentYear: string;
  allFiltersSelected: boolean;
  setExistingRateFound: (found: boolean) => void;
  setIsCheckingRates: (checking: boolean) => void;
  isOpenPlot?: boolean;
  rateCategories?: RateCategory[];
}

/**
 * Hook to check for existing rates when filters are selected
 */
export function useExistingRateCheck({
  mode,
  id,
  editData,
  bulkEditData,
  selectedZone,
  selectedUseGroup,
  assessmentYear,
  allFiltersSelected,
  setExistingRateFound,
  setIsCheckingRates,
  isOpenPlot = false,
  rateCategories,
}: ExistingRateCheckProps) {
  
  useEffect(() => {
    const isEditMode = !!id || !!editData || !!bulkEditData;
    if (isEditMode) {
      setExistingRateFound(false);
      return;
    }
    if (!allFiltersSelected) {
      setExistingRateFound(false);
      return;
    }

    const checkExistingRates = async () => {
      setIsCheckingRates(true);
      setExistingRateFound(false);
      try {
        const existingRates = await getRateMasterByFilters(selectedZone, selectedUseGroup, assessmentYear);
        const ratesExist = isOpenPlot
          ? existingRates?.some(rate => 
              rateCategories?.some(cat => Number(cat.typeOfUseGroupId) === Number(rate.typeOfUseGroupId))
            )
          : existingRates && existingRates.length > 0;
        setExistingRateFound(ratesExist);
      } catch (_error) {
        setExistingRateFound(false);
      } finally {
        setIsCheckingRates(false);
      }
    };

    checkExistingRates();
  }, [mode, id, editData, bulkEditData, selectedZone, selectedUseGroup, assessmentYear, allFiltersSelected, setExistingRateFound, setIsCheckingRates, isOpenPlot, rateCategories]);
}
