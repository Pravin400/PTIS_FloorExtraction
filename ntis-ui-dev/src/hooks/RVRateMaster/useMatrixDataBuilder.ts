import { useMemo } from "react";
import type { IRateMaster, IRateValue, IZoneDescription, RateCategory } from "@/types/RVRateMaster";
import type { MatrixRow } from "./useMatrixState";

interface MatrixDataBuilderProps {
  mode: "edit" | "delete" | "add";
  id?: string | null;
  editData?: IRateMaster | null;
  bulkEditData?: IRateMaster[] | null;
  paginatedZoneDescriptions: IZoneDescription[];
  zoneDescriptions: IZoneDescription[];
  rateCategories: RateCategory[];
  matrixStorageKey: string;
  allZoneEdits: Record<string, Record<string, number>>;
}

/**
 * Hook to build default matrix data from various sources
 */
export function useMatrixDataBuilder({
  mode,
  id,
  editData,
  bulkEditData,
  paginatedZoneDescriptions,
  zoneDescriptions,
  rateCategories,
  matrixStorageKey: _matrixStorageKey,
  allZoneEdits,
}: MatrixDataBuilderProps): MatrixRow[] {

  return useMemo(() => {
    const activeZones = paginatedZoneDescriptions && paginatedZoneDescriptions.length > 0
      ? paginatedZoneDescriptions
      : zoneDescriptions;

    // In add mode, always return undefined
    if (mode === 'add' && !id && !editData && !bulkEditData) {
      return activeZones.map((z, idx) => {
        const baseData = {
          id: idx + 1,
          zoneNo: z.zoneNo,
          taxZoneId: z.taxZoneId,
          ...rateCategories
            .filter(cat => cat.constructionId !== "zoneNo" && cat.constructionId !== "zoneDescription")
            .reduce((acc, cat) => ({ ...acc, [cat.constructionCode || cat.constructionId]: undefined }), {} as Record<string, number | undefined>),
        };
        const edits = allZoneEdits[z.zoneNo] || {};
        return { ...baseData, ...edits };
      });
    }

    // Edit/delete mode: create rows for activeZones and merge with bulkEditData / editData and allZoneEdits
    return activeZones.map((z, idx) => {
      const rateValues: Record<string, number | undefined> = {};
      if (bulkEditData?.length) {
        bulkEditData.forEach((data: IRateMaster) => {
          if (data.zoneNo === z.zoneNo) {
            data.rates?.forEach((rate: IRateValue) => {
              rateValues[rate.rateCategory] = rate.ratePerSqMtr ?? undefined;
            });
          }
        });
      } else if (editData && editData.zoneNo === z.zoneNo) {
        editData.rates?.forEach((rate: IRateValue) => {
          rateValues[rate.rateCategory] = rate.ratePerSqMtr ?? undefined;
        });
      }
      const baseData = {
        id: idx + 1,
        zoneNo: z.zoneNo,
        taxZoneId: z.taxZoneId,
        ...rateCategories.reduce(
          (acc, cat) => {
            const key = cat.constructionCode || cat.constructionId;
            return { ...acc, [key]: rateValues[key] };
          },
          {} as Record<string, number | undefined>
        ),
      };
      const edits = allZoneEdits[z.zoneNo] || {};
      return { ...baseData, ...edits };
    });
  }, [mode, id, editData, bulkEditData, paginatedZoneDescriptions, zoneDescriptions, rateCategories, allZoneEdits]);
}
