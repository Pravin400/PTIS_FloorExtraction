import type { IBackendRateMaster, RatePayload, RateCategory } from "@/types/RVRateMaster";

interface BuildPayloadConfig {
  selectedZone: string;
  selectedUseGroup: string;
  assessmentYear: string;
  rateFrequency: "Monthly" | "Yearly";
  rateUnit: "SqMeter" | "SqFeet";
  rateCategories: RateCategory[];
  isOpenPlot?: boolean;
}

interface PayloadResult {
  updates: RatePayload[];
  inserts: RatePayload[];
}

/**
 * Find an existing rate in backend rates by zone, construction, use group, year, and section
 */
function findExistingRate(
  existingBackendRates: IBackendRateMaster[],
  taxZoneId: number,
  constructionId: string,
  useGroupForPayload: string,
  assessmentYear: string,
  selectedZone: string,
  isOpenPlot: boolean = false,
  typeOfUseGroupId?: number
): IBackendRateMaster | undefined {
  return existingBackendRates.find(r => {
    const matchUseGroup = isOpenPlot
      ? Number(r.typeOfUseGroupId) === Number(typeOfUseGroupId)
      : Number(r.typeOfUseGroupId) === Number(useGroupForPayload);

    const matchConstruction = isOpenPlot
      ? true
      : Number(r.constructionTypeId) === Number(constructionId);

    return (
      Number(r.taxZoneId) === taxZoneId &&
      matchConstruction &&
      matchUseGroup &&
      Number(r.yearRangeRVId ?? r.yearRangeId) === Number(assessmentYear) &&
      Number(r.rateSectionId) === Number(selectedZone)
    );
  });
}

/**
 * Build create/update payloads from matrix data
 */
export function buildPayloadFromMatrix(
  matrixData: Array<Record<string, unknown>>,
  existingBackendRates: IBackendRateMaster[],
  config: BuildPayloadConfig,
  targetUseGroup?: string
): PayloadResult {
  const { selectedZone, selectedUseGroup, assessmentYear, rateFrequency, rateUnit, rateCategories } = config;
  const updates: RatePayload[] = [];
  const inserts: RatePayload[] = [];
  const useGroupForPayload = targetUseGroup || selectedUseGroup;

  matrixData.forEach(row => {
    rateCategories.forEach(cat => {
      const constructionId = typeof cat === 'string' ? cat : cat.constructionId;
      if (!constructionId) return;

      const rowKey = typeof cat === 'string' ? cat : (cat.constructionCode || cat.constructionId);
      const val = row[rowKey];

      const zoneNoVal = String(row.zoneNo ?? row.zone ?? '');
      const taxZoneIdVal = row.taxZoneId || Number(zoneNoVal);

      const catGroupVal = typeof cat === 'object' && cat && 'typeOfUseGroupId' in cat
        ? Number(cat.typeOfUseGroupId)
        : NaN;
      const finalUseGroupId = (!isNaN(catGroupVal) && catGroupVal > 0)
        ? catGroupVal
        : Number(useGroupForPayload);

      const existing = findExistingRate(
        existingBackendRates,
        Number(taxZoneIdVal),
        constructionId,
        useGroupForPayload,
        assessmentYear,
        selectedZone,
        config.isOpenPlot,
        finalUseGroupId
      );

      const isValEmpty = val === undefined || val === null || val === '' || isNaN(Number(val));
      if (isValEmpty && !existing) return;

      const enteredValue = isValEmpty ? 0 : Number(val);
      if (enteredValue < 0) return;
      const SQM_TO_SQFT = 10.7639104;
      const rateSquareMeterValue = rateUnit === 'SqMeter'
        ? enteredValue
        : Number((enteredValue * SQM_TO_SQFT).toFixed(2));
      const rateSquareFeetValue = rateUnit === 'SqFeet'
        ? enteredValue
        : Number((enteredValue / SQM_TO_SQFT).toFixed(2));

      const payload: RatePayload = {
        taxZoneId: Number(row.taxZoneId) || Number(zoneNoVal),
        constructionTypeId: existing ? existing.constructionTypeId : Number(constructionId),
        typeOfUseGroupId: finalUseGroupId,
        YearRangeRVId: Number(assessmentYear),
        rateSectionId: Number(selectedZone),
        rateSquareMeter: rateSquareMeterValue,
        rateSquareFeet: rateSquareFeetValue,
        rateRemark: rateFrequency === "Yearly" ? "YearWise Rate" : "MonthWise Rate",
        createdBy: 1,
        floorId: existing ? existing.floorId : Number(row.floorID ?? 0),
        isActive: true,
      };

      const rowRates = (row as { rates?: Array<Record<string, unknown>> }).rates;
      const rateCellInRow = Array.isArray(rowRates) ? rowRates.find((r) =>
        r.rateCategory === rowKey || Number(r.constructionTypeId) === Number(constructionId)
      ) : undefined;
      const rateIdInRow = rateCellInRow?.id;
      const existingId = rateIdInRow || existing?.id;

      if (existingId) {
        // Compare with the appropriate original value based on rate unit
        const originalValue = rateUnit === 'SqMeter'
          ? (existing?.rateSquareMeter ?? 0)
          : (existing?.rateSquareFeet ?? 0);
        if (enteredValue !== Number(originalValue)) {
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

/**
 * Apply multiplier to matrix data
 */
export function applyMultiplierToMatrix(
  matrixData: Array<Record<string, unknown>>,
  multiplier: number,
  rateCategories: RateCategory[]
): Array<Record<string, unknown>> {
  if (multiplier === 1.0 || multiplier <= 0) {
    return matrixData;
  }

  return matrixData.map(row => {
    const multipliedRow = { ...row };
    rateCategories.forEach(cat => {
      const key = cat.constructionCode || cat.constructionId;
      const originalValue = row[key] as number;
      multipliedRow[key] = originalValue > 0 ? Number((originalValue * multiplier).toFixed(2)) : 0;
    });
    return multipliedRow;
  });
}

/**
 * Build bulk update payload for API
 */
export function buildBulkUpdatePayload(updates: RatePayload[]): Array<{ id: number; data: Record<string, unknown> }> {
  return updates.map(rate => ({
    id: rate.Id!,
    data: {
      IsActive: rate.isActive,
      UpdatedBy: 1,
      TaxZoneId: rate.taxZoneId,
      FloorId: rate.floorId,
      ConstructionTypeId: rate.constructionTypeId,
      TypeOfUseGroupId: rate.typeOfUseGroupId,
      YearRangeRVId: rate.YearRangeRVId,
      RateSquareMeter: rate.rateSquareMeter,
      RateSquareFeet: rate.rateSquareFeet,
      RateSectionId: rate.rateSectionId,
      RateRemark: rate.rateRemark,
    }
  }));
}

/**
 * Build bulk create payload for API
 */
export function buildBulkCreatePayload(inserts: RatePayload[]): Array<{
  isActive: boolean;
  createdBy: number;
  taxZoneId: number;
  floorId: number;
  constructionTypeId: number;
  typeOfUseGroupId: number;
  yearRangeRVId: number;
  rateSquareMeter: number;
  rateSquareFeet: number;
  rateSectionId: number;
  rateRemark: string;
}> {
  return inserts.map(rate => ({
    isActive: rate.isActive,
    createdBy: 1,
    taxZoneId: rate.taxZoneId,
    floorId: rate.floorId,
    constructionTypeId: rate.constructionTypeId,
    typeOfUseGroupId: rate.typeOfUseGroupId,
    yearRangeRVId: rate.YearRangeRVId,
    rateSquareMeter: rate.rateSquareMeter,
    rateSquareFeet: rate.rateSquareFeet,
    rateSectionId: rate.rateSectionId,
    rateRemark: rate.rateRemark || "",
  }));
}
