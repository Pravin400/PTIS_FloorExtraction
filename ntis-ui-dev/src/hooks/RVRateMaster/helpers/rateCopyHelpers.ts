import type { IBackendRateMaster, IZoneDescription, RateCategory } from "@/types/RVRateMaster";

type MatrixRow = {
  id: number;
  zone?: string;
  zoneNo?: string;
  taxZoneId?: number;
  [key: string]: number | string | null | undefined;
};

interface ProcessedCopyRates {
  ratesByZone: Map<string, Map<string, number>>;
}

/**
 * Process fetched rates into a zone-keyed map
 */
export function processRatesForCopy(
  fetchedRates: IBackendRateMaster[]
): ProcessedCopyRates {
  const ratesByZone = new Map<string, Map<string, number>>();

  fetchedRates.forEach((rate) => {
    const zoneId = rate.taxZoneId;
    const constructionTypeId = rate.constructionTypeId;

    if (!zoneId || !constructionTypeId) return;

    const zoneKey = String(zoneId);
    const constructionKey = String(constructionTypeId);

    if (!ratesByZone.has(zoneKey)) {
      ratesByZone.set(zoneKey, new Map());
    }
    const zoneRates = ratesByZone.get(zoneKey)!;
    const rateSqM = rate.rateSquareMeter;
    if (rateSqM !== undefined) {
      zoneRates.set(constructionKey, rateSqM);
    }
  });

  return { ratesByZone };
}

/**
 * Build zone edits from processed rates
 */
export function buildZoneEditsFromRates(
  ratesByZone: Map<string, Map<string, number>>,
  allZones: IZoneDescription[],
  rateCategories: RateCategory[]
): Record<string, Record<string, number>> {
  const newEdits: Record<string, Record<string, number>> = {};

  allZones.forEach((zone) => {
    const zoneNo = zone.zoneNo;
    let zoneRates: Map<string, number> | null = null;

    for (const [taxZoneIdKey, constructionRates] of ratesByZone.entries()) {
      if (taxZoneIdKey === String(zone.taxZoneId)) {
        zoneRates = constructionRates;
        break;
      }
    }

    const zoneEdits: Record<string, number> = {};
    if (zoneRates) {
      rateCategories.forEach((cat) => {
        const rateValue = zoneRates!.get(cat.constructionId);
        if (rateValue !== undefined) {
          const key = cat.constructionCode || cat.constructionId;
          zoneEdits[key] = rateValue;
        }
      });
    }
    // Always set the zone to clear previous edits
    newEdits[zoneNo] = zoneEdits;
  });

  return newEdits;
}

/**
 * Update matrix data with copied rates
 */
export function applyRatesToMatrix(
  matrixData: MatrixRow[],
  ratesByZone: Map<string, Map<string, number>>,
  zoneDescriptions: IZoneDescription[],
  rateCategories: RateCategory[]
): MatrixRow[] {
  // Build taxZoneId to zoneNo mapping
  const taxZoneIdToZoneNo = new Map<string, string>();
  zoneDescriptions.forEach(zd => {
    if (zd.taxZoneId && zd.zoneNo) {
      taxZoneIdToZoneNo.set(String(zd.taxZoneId), zd.zoneNo);
    }
  });

  return matrixData.map((row) => {
    const updatedRow = { ...row };

    let zoneRates: Map<string, number> | null = null;
    for (const [taxZoneIdKey, constructionRates] of ratesByZone.entries()) {
      const mappedZoneNo = taxZoneIdToZoneNo.get(taxZoneIdKey);
      if (mappedZoneNo === row.zoneNo) {
        zoneRates = constructionRates;
        break;
      }
    }

    if (zoneRates) {
      rateCategories.forEach((cat) => {
        const rateValue = zoneRates!.get(cat.constructionId);
        if (rateValue !== undefined) {
          const key = cat.constructionCode || cat.constructionId;
          updatedRow[key] = rateValue;
        }
      });
    }

    return updatedRow;
  });
}
