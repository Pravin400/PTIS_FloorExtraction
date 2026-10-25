import { useState, useMemo } from 'react';
import type { ApartmentQCDetail, FloorSubmissionRow } from '@/types/apartmentQC.types';

export function useFloorSubmissionState(initialFloorData: ApartmentQCDetail[], initialSubTab: string) {
  const [dualMethodTab, setDualMethodTab] = useState<'rateable' | 'capital'>('rateable');
  
  const mappedFloorData: FloorSubmissionRow[] = useMemo(() => {
    return initialFloorData.map((item, index) => ({
      id: `row-${item.pdnId ?? index + 1}`,
      pdnId: item.pdnId ?? null,
      floorId: String(item.floor ?? ""),
      conYear: String(item.constructionYear || ""),
      asstYear: String(item.assessmentYear || ""),
      constructionTypeId: String(item.constructionType || ""),
      typeOfUseId: String(item.typeOfUse || ""),
      subTypeOfUseId: String(item.subTypeOfUse || ""),
      noOfRooms: String(item.noOfRooms ?? ""),
      area: String(item.carpetASqMtr || item.builtupASqMtr || ""),
      taxable: 'Yes',
      subFloorId: String(item.subFloor || ""),
      renter: item.renterName ? 'Yes' : 'No',
      areaSqFt: String(item.carpetASqFt || ""),
      areaSqMtr: String(item.carpetASqMtr || ""),
      buildupAreaSqFt: String(item.builtupASqFt || ""),
      buildupAreaSqMtr: String(item.builtupASqMtr || ""),
      rentMY: `${item.rentMonthly ?? 0}/${item.rentYearly ?? 0}`,
      rateMY: `${item.monthlyRate ?? 0}/${item.yearlyRate ?? 0}`,
      monthlyRate: item.monthlyRate ?? undefined,
      yearlyRate: item.yearlyRate ?? undefined,
      rentalValue: String(item.annualRentalValue || ""),
      depreciation: String(item.depreciation || ""),
      alv: String(item.annualRentalValue || ""),
      mr: String(item.maintenance || ""),
      rv: String(item.rateableValue || item.rVorCVValue || ""),
      sdrr: String(item.sdrr || ""),
      baseValue: String(item.baseValue || ""),
      floorFactor: String(item.floorFactor || ""),
      ageFactor: String(item.ageFactor || ""),
      ntbFactor: String(item.natureFactor || ""),
      useFactor: String(item.useFactor || ""),
      capitalValue: String(item.capitalValue || item.rVorCVValue || ""),
    }));
  }, [initialFloorData]);

  return {
    subTab: initialSubTab,
    dualMethodTab,
    setDualMethodTab,
    floorData: mappedFloorData,
    isLoadingFloorQCData: false,
  };
}
