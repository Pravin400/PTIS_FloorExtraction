import { useEffect } from "react";

interface UrlParamSyncProps {
  selectedZone: string;
  selectedUseGroup: string;
  assessmentYear: string;
  copySectionsExpanded: boolean;
  showMultipliersInline: boolean;
  isOpenPlot?: boolean;
}

/**
 * Hook to sync form state with URL parameters
 */
export function useUrlParamSync({
  selectedZone,
  selectedUseGroup,
  assessmentYear,
  copySectionsExpanded,
  showMultipliersInline,
  isOpenPlot = false,
}: UrlParamSyncProps) {

  useEffect(() => {
    if (typeof window !== 'undefined' && selectedZone && assessmentYear) {
      // For Open Plot, skip syncing useGroup/rateCategories to the URL.
      // AddRateDrawer uses useSearchParams() which re-renders on every URL change,
      // causing the lazy-loaded dropdown state to reset. Since Open Plot derives
      // useGroup from rateCategories (not a user dropdown), no need to persist it.
      if (isOpenPlot) {
        const params = new URLSearchParams(window.location.search);
        params.delete('useGroup');
        params.delete('year');
        params.set('zone', selectedZone);
        params.set('assessmentYear', assessmentYear);
        if (copySectionsExpanded) {
          params.set('showCopyRates', 'true');
        } else {
          params.delete('showCopyRates');
        }
        if (showMultipliersInline) {
          params.set('showMultipliers', 'true');
        } else {
          params.delete('showMultipliers');
        }
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
        return;
      }

      // For non-Open Plot (Construction Type), sync all params including useGroup
      if (selectedUseGroup) {
        const params = new URLSearchParams(window.location.search);
        params.set('zone', selectedZone);
        params.set('useGroup', selectedUseGroup);
        params.set('assessmentYear', assessmentYear);
        if (copySectionsExpanded) {
          params.set('showCopyRates', 'true');
        } else {
          params.delete('showCopyRates');
        }
        if (showMultipliersInline) {
          params.set('showMultipliers', 'true');
        } else {
          params.delete('showMultipliers');
        }
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [selectedZone, selectedUseGroup, assessmentYear, copySectionsExpanded, showMultipliersInline, isOpenPlot]);
}
