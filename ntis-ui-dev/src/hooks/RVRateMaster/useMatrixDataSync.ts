import { useEffect, useRef } from "react";
import type { IBackendRateMaster, IZoneDescription, RateCategory } from "@/types/RVRateMaster";
import type { MatrixRow } from "./useMatrixState";

interface MatrixDataSyncProps {
  mode: "edit" | "delete" | "add";
  backendRates?: IBackendRateMaster[] | null;
  fetchedBackendRates: IBackendRateMaster[];
  selectedZone: string;
  selectedUseGroup: string;
  assessmentYear: string;
  rateUnit: "SqMeter" | "SqFeet";
  paginatedZoneDescriptions: IZoneDescription[];
  zoneDescriptions: IZoneDescription[];
  rateCategories: RateCategory[];
  defaultMatrixData: MatrixRow[];
  setMatrixData: (data: MatrixRow[]) => void;
  setShowMatrix: (show: boolean) => void;
  setRateFrequency: (freq: "Monthly" | "Yearly") => void;
  setAllZoneEdits: (edits: Record<string, Record<string, number>>) => void;
  allZoneEditsInitializedRef: React.MutableRefObject<boolean>;
  isOpenPlot?: boolean;
}

/**
 * Hook to sync matrix data with backend rates and handle data transformations
 */
export function useMatrixDataSync({
  mode,
  backendRates,
  fetchedBackendRates,
  selectedZone,
  selectedUseGroup,
  assessmentYear,
  rateUnit,
  paginatedZoneDescriptions,
  zoneDescriptions,
  rateCategories,
  defaultMatrixData,
  setMatrixData,
  setShowMatrix,
  setRateFrequency,
  setAllZoneEdits,
  allZoneEditsInitializedRef,
  isOpenPlot = false,
}: MatrixDataSyncProps) {

  const hasSyncedRef = useRef(false);

  // Sync matrixData with defaultMatrixData when pagination changes
  useEffect(() => {
    if (defaultMatrixData.length > 0) {
      setMatrixData(defaultMatrixData);
    }
  }, [defaultMatrixData, setMatrixData]);

  // Process backendRates prop to populate matrix data (edit/delete mode)
  useEffect(() => {
    const isEditMode = mode === 'edit' || mode === 'delete';
    if (!isEditMode || hasSyncedRef.current) return;

    if (!selectedZone || !selectedUseGroup || !assessmentYear) {
      setMatrixData(defaultMatrixData);
      setShowMatrix(false);
      return;
    }

    const ratesToUse = (backendRates?.length) ? backendRates : fetchedBackendRates;
    if (!ratesToUse || ratesToUse.length === 0) return;

    setShowMatrix(true);

    if (ratesToUse?.length) {
      const hasMonthly = ratesToUse.some(r => r.rateRemark === "MonthWise Rate");
      const hasYearWise = ratesToUse.some(r => r.rateRemark === "YearWise Rate");
      setRateFrequency(hasMonthly && !hasYearWise ? "Monthly" : "Yearly");

      const activeZones = paginatedZoneDescriptions.length > 0 ? paginatedZoneDescriptions : zoneDescriptions;
      const updatedMatrix = activeZones.map((z, idx) => {
        const zoneRates = ratesToUse.filter(row => row.taxZoneId === z.taxZoneId || String(row.taxZoneId) === z.zoneNo);
        const rateValues: Record<string, number> = {};
        zoneRates.forEach(rate => {
          if (isOpenPlot) {
            const matchingCat = rateCategories.find(c => Number(c.typeOfUseGroupId) === Number(rate.typeOfUseGroupId));
            if (!matchingCat) return; // Ignore rates that do not belong to the visible Open Plot columns

            const rateValue = rateUnit === 'SqFeet' ? rate.rateSquareFeet : rate.rateSquareMeter;
            if (rateValue !== undefined) {
              rateValues[matchingCat.constructionId] = rateValue;
            }
          } else {
            const constructionKey = String(rate.constructionTypeId);
            const rateValue = rateUnit === 'SqFeet' ? rate.rateSquareFeet : rate.rateSquareMeter;
            if (rateValue !== undefined) {
              rateValues[constructionKey] = rateValue;
            }
          }
        });

        return {
          id: idx + 1,
          zoneNo: z.zoneNo,
          taxZoneId: z.taxZoneId,
          ...rateCategories.reduce(
            (acc, cat) => {
              const columnKey = cat.constructionCode || cat.constructionId;
              const rateValue = rateValues[cat.constructionId];
              return { ...acc, [columnKey]: rateValue };
            },
            {}
          ),
        };
      });
      setMatrixData(updatedMatrix);
      hasSyncedRef.current = true;
    } else {
      const activeZones = paginatedZoneDescriptions.length > 0 ? paginatedZoneDescriptions : zoneDescriptions;
      const zeroMatrix = activeZones.map((z, idx) => ({
        id: idx + 1,
        zoneNo: z.zoneNo,
        taxZoneId: z.taxZoneId,
        ...rateCategories.reduce((acc, cat) => ({ ...acc, [cat.constructionCode || cat.constructionId]: undefined }), {}),
      }));
      setMatrixData(zeroMatrix);
      hasSyncedRef.current = true;
    }
  }, [fetchedBackendRates, backendRates, selectedZone, selectedUseGroup, assessmentYear, rateUnit, mode, paginatedZoneDescriptions, zoneDescriptions, rateCategories, defaultMatrixData, setMatrixData, setShowMatrix, setRateFrequency, isOpenPlot]);

  // Reset initialization flag and sync flag when filters change
  useEffect(() => {
    allZoneEditsInitializedRef.current = false;
    hasSyncedRef.current = false;
    setAllZoneEdits({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedZone, selectedUseGroup, assessmentYear, backendRates, setAllZoneEdits]);

  // Initialize allZoneEdits directly from backend rates in edit mode
  useEffect(() => {
    const isEditMode = mode === 'edit' || mode === 'delete';
    if (!isEditMode || allZoneEditsInitializedRef.current) return;

    const ratesToUse = (backendRates?.length) ? backendRates : fetchedBackendRates;
    if (!ratesToUse || ratesToUse.length === 0) return;

    // VERY IMPORTANT: Prevent race condition where selectedZone changed but backendRates hasn't!
    // Verify that the backend rates actually belong to the currently selected zone
    const isMatchingZone = ratesToUse.every(r => String(r.rateSectionId) === String(selectedZone) || String(r.rateSectionNo) === String(selectedZone));
    if (!isMatchingZone) return;

    const initialEdits: Record<string, Record<string, number>> = {};

    // Initialize directly from ratesToUse (full backend data) instead of matrixData (paginated)
    zoneDescriptions.forEach(z => {
      const zoneRates = ratesToUse.filter(r => r.taxZoneId === z.taxZoneId || String(r.taxZoneId) === z.zoneNo);
      const zoneEdits: Record<string, number> = {};

      rateCategories.forEach(cat => {
        const key = cat.constructionCode || cat.constructionId;
        const matchingRate = zoneRates.find(r =>
          isOpenPlot
            ? String(r.typeOfUseGroupId) === String(cat.typeOfUseGroupId)
            : (String(r.constructionTypeId) === String(cat.constructionId) || String(r.constructionID) === String(cat.constructionId))
        );

        if (matchingRate) {
          const rateValue = rateUnit === 'SqFeet' ? matchingRate.rateSquareFeet : matchingRate.rateSquareMeter;
          if (rateValue !== undefined && rateValue !== null) {
            zoneEdits[key] = rateValue;
          }
        }
      });

      if (Object.keys(zoneEdits).length > 0) initialEdits[z.zoneNo] = zoneEdits;
    });

    setAllZoneEdits(initialEdits);
    allZoneEditsInitializedRef.current = true;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendRates, fetchedBackendRates, selectedZone, mode, rateUnit, zoneDescriptions, rateCategories, setAllZoneEdits, isOpenPlot]);
}
