import { describe, it, expect } from 'vitest';


type Zone = { zoneNo: string; taxZoneId: string | number };
type RateCategory = { constructionId: string; constructionCode?: string };
type RatesByZone = Map<string, Map<string, number>>;
type Edits = Record<string, Record<string, number>>;

// Simulate the core logic of the copy rates clearing behavior
function copyRatesFromSource({
  allZones,
  rateCategories,
  ratesByZone,
}: {
  allZones: Zone[];
  rateCategories: RateCategory[];
  ratesByZone: RatesByZone;
}): Edits {
  const newEdits: Edits = {};
  allZones.forEach((zone: Zone) => {
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
      rateCategories.forEach((cat: RateCategory) => {
        const rateValue = zoneRates!.get(cat.constructionId);
        if (rateValue !== undefined && rateValue > 0) {
          const key = cat.constructionCode || cat.constructionId;
          zoneEdits[key] = rateValue;
        }
      });
    }
    newEdits[zoneNo] = zoneEdits;
  });
  return newEdits;
}

describe('RVRateMaster copy rates clearing', () => {
  it('clears stale values and only keeps source data', () => {
    // Initial edits have extra values
    const allZones = [
      { zoneNo: 'Z1', taxZoneId: 1 },
      { zoneNo: 'Z2', taxZoneId: 2 },
    ];
    const rateCategories = [
      { constructionId: 'C1', constructionCode: 'A' },
      { constructionId: 'C2', constructionCode: 'B' },
    ];
    // Source only has Z1 with C1, Z2 with nothing
    const ratesByZone = new Map([
      ['1', new Map([['C1', 100]])],
      // Z2 missing or empty
    ]);
    // Simulate copy
    const result = copyRatesFromSource({ allZones, rateCategories, ratesByZone });
    expect(result).toEqual({
      Z1: { A: 100 },
      Z2: {},
    });
  });
});
