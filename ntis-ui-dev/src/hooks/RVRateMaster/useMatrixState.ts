import { useMemo } from "react";
import type { IZoneDescription, RateCategory } from "@/types/RVRateMaster";

type MatrixRow = {
  id: number;
  zone?: string;
  zoneNo?: string;
  taxZoneId?: number;
  [key: string]: number | string | null | undefined;
};

interface UseMatrixStateProps {
  allZones: IZoneDescription[];
  rateCategories: RateCategory[];
  paginatedZoneDescriptions: IZoneDescription[];
  allZoneEdits: Record<string, Record<string, number>>;
}

/**
 * Hook for managing matrix state calculations and derived data
 */
export function useMatrixState({
  allZones,
  rateCategories,
  paginatedZoneDescriptions,
  allZoneEdits,
}: UseMatrixStateProps) {
  // Calculate the number of filled rates across ALL zones
  const filledRatesCount = useMemo(() => {
    let count = 0;
    allZones.forEach((zone) => {
      const zoneEdits = allZoneEdits[zone.zoneNo];
      if (zoneEdits) {
        rateCategories.forEach((cat) => {
          const key = cat.constructionCode || cat.constructionId;
          const value = zoneEdits[key];
          if (value !== undefined && value !== null) {
            count++;
          }
        });
      }
    });
    return count;
  }, [allZones, allZoneEdits, rateCategories]);

  // Calculate total possible rates across ALL zones
  const totalPossibleRates = allZones.length * rateCategories.length;

  // Calculate completion percentage
  const completionPercentage = totalPossibleRates > 0
    ? Math.round((filledRatesCount / totalPossibleRates) * 100)
    : 0;

  // Create a map of zoneNo to remark (description) for tooltips
  const zoneRemarksMap = useMemo(() => {
    const map = new Map<string, string>();
    const zones = paginatedZoneDescriptions.length > 0 ? paginatedZoneDescriptions : allZones;
    zones.forEach(zone => {
      map.set(zone.zoneNo, zone.description || '');
    });
    return map;
  }, [paginatedZoneDescriptions, allZones]);

  // Build complete matrix for submission
  const buildCompleteMatrixForSubmission = (): MatrixRow[] => {
    if (!allZones || allZones.length === 0) {
      return [];
    }

    return allZones.map((z, idx) => {
      const baseData: MatrixRow = {
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
  };

  return {
    filledRatesCount,
    totalPossibleRates,
    completionPercentage,
    zoneRemarksMap,
    buildCompleteMatrixForSubmission,
  };
}

// Export MatrixRow type for use in components
export type { MatrixRow };
