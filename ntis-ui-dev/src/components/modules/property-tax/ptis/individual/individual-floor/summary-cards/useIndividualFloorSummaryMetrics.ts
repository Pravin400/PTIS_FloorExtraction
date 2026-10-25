import { useMemo } from 'react';
import type { CapitalValueItem } from '@/types/capitalValue.types';
import type { IndividualFloorSummaryCardsProps, FloorSummaryMetrics } from '@/types/summaryCard.types';
import { findUseName, formatRupeeShort } from '@/lib/utils/summaryCard.utils';

export const useIndividualFloorSummaryMetrics = ({
  rateableData,
  capitalData,
  comparisonData,
  oldDetailsData,
  taxMode = 'rateable',
}: IndividualFloorSummaryCardsProps): FloorSummaryMetrics => {
  const isCapitalMode = taxMode === 'capital';
  const isDualMode = taxMode === 'dual';

  const capitalItems: CapitalValueItem[] = useMemo(() => {
    if (!capitalData) return [];
    if (Array.isArray(capitalData)) return capitalData;
    if (Array.isArray(capitalData.items)) return capitalData.items;
    if (Array.isArray(capitalData.details)) return capitalData.details;
    return [];
  }, [capitalData]);

  const totalCapitalValue = useMemo(() => {
    if (!capitalData) return 0;
    if (!Array.isArray(capitalData) && capitalData.totalCapitalValue != null) {
      return Number(capitalData.totalCapitalValue);
    }
    return capitalItems.reduce((sum, item) => sum + (Number(item.capitalValue) || 0), 0);
  }, [capitalData, capitalItems]);

  const totalCapitalTax = useMemo(() => {
    if (!capitalData) return 0;
    if (!Array.isArray(capitalData) && capitalData.totalTax != null) {
      return Number(capitalData.totalTax);
    }
    return capitalItems.reduce((sum, item) => sum + (Number(item.taxTotal) || 0), 0);
  }, [capitalData, capitalItems]);

  const rateableDetails = useMemo(() => {
    if (!rateableData) return [];
    return (
      rateableData.details ??
      rateableData.items ??
      (rateableData as unknown as { rateableValueDetails?: Array<{ use?: string; annualRentalValue?: number; rateableValue?: number; taxTotal?: number }> })?.rateableValueDetails ??
      []
    );
  }, [rateableData]);

  const sumRateableAlv = useMemo(() => {
    return rateableDetails.reduce((sum, item) => sum + (Number(item.annualRentalValue) || 0), 0);
  }, [rateableDetails]);

  const sumRateableRv = useMemo(() => {
    return rateableDetails.reduce((sum, item) => sum + (Number(item.rateableValue) || 0), 0);
  }, [rateableDetails]);

  const sumRateableTax = useMemo(() => {
    return rateableDetails.reduce((sum, item) => sum + (Number(item.taxTotal) || 0), 0);
  }, [rateableDetails]);

  // Area metrics
  const compArea = comparisonData?.area;
  const hasCompArea = compArea != null;
  const oldArea = hasCompArea ? compArea.old : (oldDetailsData?.oldPlotArea ? Number(oldDetailsData.oldPlotArea) : 0);
  const newArea = hasCompArea ? compArea.new : 0;
  const changeArea = hasCompArea ? compArea.change : (newArea - oldArea);

  // Changes of use
  const oldUse =
    comparisonData?.changeOfUse?.oldUse ||
    oldDetailsData?.oldTypeOfUseId ||
    (oldDetailsData as unknown as { oldUse?: string })?.oldUse ||
    (oldDetailsData as unknown as { oldTypeOfUseDescription?: string })?.oldTypeOfUseDescription ||
    '-';

  const newUse =
    comparisonData?.changeOfUse?.newUse ||
    (isCapitalMode
      ? findUseName(capitalItems) || findUseName(rateableDetails)
      : findUseName(rateableDetails) || findUseName(capitalItems)) ||
    '-';

  const isUseUpdated =
    comparisonData?.changeOfUse != null
      ? Boolean(comparisonData.changeOfUse.hasChanged)
      : (oldUse !== '-' && newUse !== '-' && oldUse.trim().toLowerCase() !== newUse.trim().toLowerCase());

  // ALV metrics
  const compAlv = comparisonData?.alv;
  const hasCompAlv = compAlv != null;
  const oldAlv = hasCompAlv ? compAlv.old : (oldDetailsData?.oldALV ? Number(oldDetailsData.oldALV) : 0);
  const newAlv = hasCompAlv
    ? compAlv.new
    : (rateableData as unknown as { totalAnnualRentalValue?: number })?.totalAnnualRentalValue ??
    (rateableData?.totalRateableValue != null && sumRateableAlv === 0 ? rateableData.totalRateableValue : sumRateableAlv);
  const alvPercent =
    hasCompAlv && compAlv.changePercent != null
      ? compAlv.changePercent
      : oldAlv > 0
        ? ((newAlv - oldAlv) / oldAlv) * 100
        : newAlv > 0 ? 100 : 0;
  const formattedAlvDelta = `${alvPercent >= 0 ? '+' : ''}${alvPercent.toFixed(2)}%`;

  // RV metrics
  const compRv = comparisonData?.rv;
  const hasCompRv = compRv != null;
  const oldRv = hasCompRv ? compRv.old : (oldDetailsData?.oldRV ? Number(oldDetailsData.oldRV) : 0);
  const newRv = hasCompRv ? compRv.new : (rateableData?.totalRateableValue ?? sumRateableRv);
  const rvPercent =
    hasCompRv && compRv.changePercent != null
      ? compRv.changePercent
      : oldRv > 0
        ? ((newRv - oldRv) / oldRv) * 100
        : newRv > 0 ? 100 : 0;
  const formattedRvDelta = `${rvPercent >= 0 ? '+' : ''}${rvPercent.toFixed(2)}%`;

  // CV metrics
  const compCv = comparisonData?.cv;
  const hasCompCv = compCv != null;
  const oldCv = hasCompCv ? compCv.old : (oldDetailsData?.oldCV ? Number(oldDetailsData.oldCV) : 0);
  const newCv = hasCompCv ? compCv.new : totalCapitalValue;
  const cvPercent =
    hasCompCv && compCv.changePercent != null
      ? compCv.changePercent
      : oldCv > 0
        ? ((newCv - oldCv) / oldCv) * 100
        : newCv > 0 ? 100 : 0;
  const formattedCvDelta = `${cvPercent >= 0 ? '+' : ''}${cvPercent.toFixed(2)}%`;

  // Tax metrics
  const compTax = comparisonData?.tax;
  const hasCompTax = compTax != null;
  const oldTax = hasCompTax ? compTax.old : (oldDetailsData?.oldTotalTax ? Number(oldDetailsData.oldTotalTax) : 0);
  const newTax = hasCompTax
    ? compTax.new
    : isCapitalMode ? totalCapitalTax : (rateableData?.totalTax ?? sumRateableTax);
  const taxPercent =
    hasCompTax && compTax.changePercent != null
      ? compTax.changePercent
      : oldTax > 0
        ? ((newTax - oldTax) / oldTax) * 100
        : newTax > 0 ? 100 : 0;
  const formattedTaxDelta = `${taxPercent >= 0 ? '+' : ''}${taxPercent.toFixed(2)}%`;

  return {
    isCapitalMode,
    isDualMode,
    hasCompArea,
    oldArea,
    newArea,
    changeArea,
    oldUse,
    newUse,
    isUseUpdated,
    oldAlv,
    newAlv,
    formattedAlvDelta,
    hasCompAlv,
    oldRv,
    newRv,
    rvPercent,
    formattedRvDelta,
    hasCompRv,
    oldCv,
    newCv,
    cvPercent,
    formattedCvDelta,
    hasCompCv,
    oldTax,
    newTax,
    formattedTaxDelta,
    hasCompTax,
    formatRupeeShort,
  };
};
