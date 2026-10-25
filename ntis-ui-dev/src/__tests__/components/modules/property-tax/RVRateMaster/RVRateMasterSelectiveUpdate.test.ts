import { describe, it, expect } from 'vitest';

type RateCategory = { constructionId: string; constructionCode?: string };
type IBackendRateMaster = {
  id: number;
  taxZoneId: number;
  constructionTypeId: number;
  typeOfUseGroupId: number;
  yearRangeRVId: number;
  rateSectionId: number;
  rateSquareMeter: number;
};

type RatePayload = {
  Id?: number;
  taxZoneId: number;
  constructionTypeId: number;
  typeOfUseGroupId: number;
  YearRangeRVId: number;
  rateSectionId: number;
  rateSquareMeter: number;
  rateSquareFeet: number;
  rateRemark: string;
  createdBy: number;
  floorId: number;
  isActive: boolean;
};

// Simulate the selective update logic from buildPayloadFromMatrix
function buildPayloadFromMatrix(
  matrixData: Array<Record<string, unknown>>,
  existingBackendRates: IBackendRateMaster[],
  rateCategories: RateCategory[],
  selectedZone: string,
  selectedUseGroup: string,
  assessmentYear: string
): { updates: RatePayload[]; inserts: RatePayload[] } {
  const updates: RatePayload[] = [];
  const inserts: RatePayload[] = [];

  function findExistingRate(taxZoneId: number, constructionId: string) {
    return existingBackendRates.find((r) => {
      const rTaxZoneId = r.taxZoneId;
      const rConstructionTypeId = r.constructionTypeId;
      const rTypeOfUseGroupId = r.typeOfUseGroupId;
      const rYearRangeRVId = r.yearRangeRVId;
      const rRateSectionId = r.rateSectionId;

      return (
        Number(rTaxZoneId) === taxZoneId &&
        Number(rConstructionTypeId) === Number(constructionId) &&
        Number(rTypeOfUseGroupId) === Number(selectedUseGroup) &&
        Number(rYearRangeRVId) === Number(assessmentYear) &&
        Number(rRateSectionId) === Number(selectedZone)
      );
    });
  }

  matrixData.forEach((row) => {
    rateCategories.forEach((cat) => {
      const constructionId = cat.constructionId;
      if (!constructionId) return;

      const rowKey = cat.constructionCode || cat.constructionId;
      const val = row[rowKey];

      if (val === undefined || val === null || val === '' || isNaN(Number(val)) || Number(val) <= 0) return;

      const zoneNoVal = String(row.zoneNo ?? row.zone ?? '');
      const taxZoneIdVal = row.taxZoneId || Number(zoneNoVal);
      const existing = findExistingRate(Number(taxZoneIdVal), constructionId);

      const payload: RatePayload = {
        taxZoneId: Number(row.taxZoneId) || Number(zoneNoVal),
        constructionTypeId: Number(constructionId),
        typeOfUseGroupId: Number(selectedUseGroup),
        YearRangeRVId: Number(assessmentYear),
        rateSectionId: Number(selectedZone),
        rateSquareMeter: Number(val),
        rateSquareFeet: Number((Number(val) * 10.7639).toFixed(2)),
        rateRemark: 'YearWise Rate',
        createdBy: 1,
        floorId: 67,
        isActive: true,
      };

      const existingId = existing?.id;

      if (existingId) {
        // Only include in updates if value actually changed
        const originalValue = existing?.rateSquareMeter ?? 0;
        if (Number(val) !== Number(originalValue)) {
          payload.Id = Number(existingId);
          updates.push(payload);
        }
      } else {
        inserts.push(payload);
      }
    });
  });

  return { updates, inserts };
}

describe('RVRateMaster selective update', () => {
  const rateCategories: RateCategory[] = [
    { constructionId: '1', constructionCode: 'A' },
    { constructionId: '2', constructionCode: 'B' },
  ];
  const selectedZone = '10';
  const selectedUseGroup = '5';
  const assessmentYear = '2024';

  it('only includes changed rates in updates', () => {
    // Existing backend rates
    const existingBackendRates: IBackendRateMaster[] = [
      {
        id: 100,
        taxZoneId: 1,
        constructionTypeId: 1,
        typeOfUseGroupId: 5,
        yearRangeRVId: 2024,
        rateSectionId: 10,
        rateSquareMeter: 500, // original value
      },
      {
        id: 101,
        taxZoneId: 1,
        constructionTypeId: 2,
        typeOfUseGroupId: 5,
        yearRangeRVId: 2024,
        rateSectionId: 10,
        rateSquareMeter: 300, // original value
      },
    ];

    // Matrix data: A is changed (500 -> 600), B is unchanged (300 -> 300)
    const matrixData = [
      { zoneNo: '1', taxZoneId: 1, A: 600, B: 300 },
    ];

    const { updates, inserts } = buildPayloadFromMatrix(
      matrixData,
      existingBackendRates,
      rateCategories,
      selectedZone,
      selectedUseGroup,
      assessmentYear
    );

    // Only A should be in updates (changed from 500 to 600)
    expect(updates.length).toBe(1);
    expect(updates[0].Id).toBe(100);
    expect(updates[0].rateSquareMeter).toBe(600);
    // No inserts
    expect(inserts.length).toBe(0);
  });

  it('does not include unchanged rates in updates', () => {
    const existingBackendRates: IBackendRateMaster[] = [
      {
        id: 100,
        taxZoneId: 1,
        constructionTypeId: 1,
        typeOfUseGroupId: 5,
        yearRangeRVId: 2024,
        rateSectionId: 10,
        rateSquareMeter: 500,
      },
    ];

    // Matrix data: A is unchanged (500 -> 500)
    const matrixData = [
      { zoneNo: '1', taxZoneId: 1, A: 500 },
    ];

    const { updates, inserts } = buildPayloadFromMatrix(
      matrixData,
      existingBackendRates,
      rateCategories,
      selectedZone,
      selectedUseGroup,
      assessmentYear
    );

    // No updates (value unchanged)
    expect(updates.length).toBe(0);
    // No inserts
    expect(inserts.length).toBe(0);
  });

  it('includes new rates in inserts', () => {
    // No existing backend rates
    const existingBackendRates: IBackendRateMaster[] = [];

    // Matrix data: A is new
    const matrixData = [
      { zoneNo: '1', taxZoneId: 1, A: 700 },
    ];

    const { updates, inserts } = buildPayloadFromMatrix(
      matrixData,
      existingBackendRates,
      rateCategories,
      selectedZone,
      selectedUseGroup,
      assessmentYear
    );

    // No updates (no existing)
    expect(updates.length).toBe(0);
    // One insert
    expect(inserts.length).toBe(1);
    expect(inserts[0].rateSquareMeter).toBe(700);
  });

  it('handles mix of changed, unchanged, and new rates', () => {
    const existingBackendRates: IBackendRateMaster[] = [
      {
        id: 100,
        taxZoneId: 1,
        constructionTypeId: 1,
        typeOfUseGroupId: 5,
        yearRangeRVId: 2024,
        rateSectionId: 10,
        rateSquareMeter: 500, // A: unchanged
      },
      {
        id: 101,
        taxZoneId: 2,
        constructionTypeId: 1,
        typeOfUseGroupId: 5,
        yearRangeRVId: 2024,
        rateSectionId: 10,
        rateSquareMeter: 400, // A in zone 2: changed
      },
    ];

    // Matrix data:
    // Zone 1: A unchanged (500), B new (200)
    // Zone 2: A changed (400 -> 450)
    const matrixData = [
      { zoneNo: '1', taxZoneId: 1, A: 500, B: 200 },
      { zoneNo: '2', taxZoneId: 2, A: 450 },
    ];

    const { updates, inserts } = buildPayloadFromMatrix(
      matrixData,
      existingBackendRates,
      rateCategories,
      selectedZone,
      selectedUseGroup,
      assessmentYear
    );

    // Updates: only zone 2 A (changed)
    expect(updates.length).toBe(1);
    expect(updates[0].Id).toBe(101);
    expect(updates[0].rateSquareMeter).toBe(450);

    // Inserts: zone 1 B (new)
    expect(inserts.length).toBe(1);
    expect(inserts[0].rateSquareMeter).toBe(200);
  });
});
