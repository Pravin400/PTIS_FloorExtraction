import type { IBackendRateMaster, IZoneDescription, RateCategory, IRateMaster } from "@/types/RVRateMaster";

/**
 * Build URLSearchParams for rate API queries
 */
export function buildRateQueryParams(
  pageNumber: number,
  pageSize: number,
  filters?: {
    rateSection?: string;
    useGroup?: string;
    assessmentYear?: string;
    taxZoneIds?: number[];
  }
): URLSearchParams {
  const params = new URLSearchParams({
    PageNumber: pageNumber.toString(),
    PageSize: pageSize.toString(),
  });

  if (!filters) return params;

  const { rateSection, useGroup, assessmentYear, taxZoneIds } = filters;

  if (rateSection && rateSection !== "ALL" && rateSection !== "undefined" && !isNaN(Number(rateSection))) {
    params.append('RateSectionId', rateSection);
  }
  if (useGroup && useGroup !== "ALL" && useGroup !== "undefined" && !isNaN(Number(useGroup))) {
    params.append('TypeOfUseGroupId', useGroup);
  }
  if (assessmentYear && assessmentYear !== "ALL" && assessmentYear !== "undefined" && !isNaN(Number(assessmentYear))) {
    params.append('YearRangeRVId', assessmentYear);
  }
  if (taxZoneIds && taxZoneIds.length > 0) {
    params.append('TaxZoneIds', taxZoneIds.join(','));
  }

  return params;
}

/**
 * Extract value from string or object with value property
 */
export function extractValue(val?: string | { value: string }): string {
  if (!val) return '';
  if (typeof val === 'object' && val && 'value' in val) return val.value || '';
  return typeof val === 'string' ? val : '';
}

/**
 * Transform backend rate data to grouped IRateMaster format
 */
export function transformBackendRatesToMatrix(
  backendData: IBackendRateMaster[],
  constructionTypes: RateCategory[],
  zoneDescriptions: IZoneDescription[],
  isOpenPlot: boolean = false
): IRateMaster[] {
  if (!backendData || backendData.length === 0) {
    return [];
  }

  const taxZoneIdToNo = new Map(zoneDescriptions.map(z => [z.taxZoneId, String(z.zoneNo).trim()]));
  const groupedData = new Map<string, IRateMaster>();

  // 1. Collect all distinct combinations of (rateSection, [useGroup], assessmentYear) present in backendData
  type Combo = {
    rateSectionNo: string;
    typeOfUseGroupId: string;
    yearRangeRVId: string;
  };
  const distinctCombos = new Map<string, Combo>();

  backendData.forEach((item) => {
    const rateSectionId = item.rateSectionId;
    const rateSectionNo = item.rateSectionNo || String(rateSectionId);
    const typeOfUseGroupId = String(item.typeOfUseGroupId);
    const yearRangeRVId = String(item.yearRangeRVId ?? item.yearRangeId ?? '');
    const comboKey = isOpenPlot 
      ? [rateSectionNo, yearRangeRVId].join('|')
      : [rateSectionNo, typeOfUseGroupId, yearRangeRVId].join('|');

    if (!distinctCombos.has(comboKey)) {
      distinctCombos.set(comboKey, {
        rateSectionNo,
        typeOfUseGroupId: isOpenPlot ? "" : typeOfUseGroupId,
        yearRangeRVId,
      });
    }
  });

  // 2. Pre-populate rows for all active tax zones from zoneDescriptions for each distinct combo (preserving zoneDescriptions order)
  distinctCombos.forEach((combo) => {
    zoneDescriptions.forEach((z) => {
      const taxZoneNo = String(z.zoneNo).trim();
      const key = isOpenPlot 
        ? [taxZoneNo, combo.rateSectionNo, combo.yearRangeRVId].join('|')
        : [taxZoneNo, combo.rateSectionNo, combo.typeOfUseGroupId, combo.yearRangeRVId].join('|');

      if (!groupedData.has(key)) {
        const initialRates = constructionTypes.map(ct => ({
          rateCategory: ct.constructionCode || ct.constructionId,
          ratePerSqMtr: null,
          ratePerSqFt: null,
          rateRemark: undefined as string | undefined
        }));

        groupedData.set(key, {
          id: `zone-${z.taxZoneId}-${combo.rateSectionNo}-${combo.typeOfUseGroupId}-${combo.yearRangeRVId}`,
          rateSection: combo.rateSectionNo,
          zoneNo: taxZoneNo,
          useGroup: combo.typeOfUseGroupId,
          assessmentYear: combo.yearRangeRVId,
          rates: initialRates,
        });
      }
    });
  });

  // 3. Populate existing rates from backendData
  backendData.forEach((item) => {
    try {
      const taxZoneId = item.taxZoneId;
      const taxZoneNo = String(taxZoneIdToNo.get(taxZoneId) || item.taxZoneNo || taxZoneId).trim();
      const typeOfUseGroupId = String(item.typeOfUseGroupId);
      const rateSectionId = item.rateSectionId;
      const rateSectionNo = item.rateSectionNo || String(rateSectionId);
      const yearRangeRVId = String(item.yearRangeRVId ?? item.yearRangeId ?? '');
      // Use a composite key to avoid overwriting data for the same zone with different section/useGroup/year
      const key = isOpenPlot 
        ? [taxZoneNo, rateSectionNo, yearRangeRVId].join('|')
        : [taxZoneNo, rateSectionNo, typeOfUseGroupId, yearRangeRVId].join('|');

      if (!groupedData.has(key)) {
        const initialRates = constructionTypes.map(ct => ({
          rateCategory: ct.constructionCode || ct.constructionId,
          ratePerSqMtr: null,
          ratePerSqFt: null,
          rateRemark: undefined as string | undefined
        }));

        groupedData.set(key, {
          id: String(item.id),
          rateSection: rateSectionNo,
          zoneNo: taxZoneNo,
          useGroup: isOpenPlot ? "" : typeOfUseGroupId,
          assessmentYear: yearRangeRVId,
          rates: initialRates,
        });
      }

      const group = groupedData.get(key);
      if (group) {
        if (item.id && (!group.id || group.id.startsWith('zone-'))) {
          group.id = String(item.id);
        }
        const matchId = isOpenPlot ? Number(item.typeOfUseGroupId) : Number(item.constructionTypeId);
        const construction = constructionTypes.find(ct => {
          const ctId = isOpenPlot ? Number(ct.typeOfUseGroupId) : Number(ct.constructionId);
          return ctId === matchId;
        });

        if (construction) {
          const constructionCode = construction.constructionCode || construction.constructionId;
          const rateIndex = group.rates.findIndex(r => r.rateCategory === constructionCode);

          if (rateIndex !== -1) {
            const existingRate = group.rates[rateIndex].ratePerSqMtr;
            const newRate = item.rateSquareMeter;
            const newRateSqFt = item.rateSquareFeet;
            group.rates[rateIndex].ratePerSqMtr = existingRate && existingRate !== 0 ? existingRate : newRate;
            group.rates[rateIndex].ratePerSqFt = group.rates[rateIndex].ratePerSqFt || newRateSqFt;
            group.rates[rateIndex].id = item.id;
            // Include rateRemark for frequency mismatch detection
            group.rates[rateIndex].rateRemark = item.rateRemark;
          }
        }
      }
    } catch (_err) {
      // Skip invalid items
    }
  });

  return Array.from(groupedData.values());
}

/**
 * Filter matrix data by rate section
 */
export function filterByRateSection(
  data: IRateMaster[],
  rateSectionStr: string
): IRateMaster[] {
  if (!rateSectionStr || rateSectionStr === "ALL" || rateSectionStr === "undefined") {
    return data;
  }

  const firstSection = data[0]?.rateSection;
  if (!isNaN(Number(rateSectionStr)) && rateSectionStr.trim() !== "" && !isNaN(Number(firstSection))) {
    const selectedRateSectionId = Number(rateSectionStr);
    return data.filter(row => Number(row.rateSection) === selectedRateSectionId);
  }
  
  return data.filter(row => String(row.rateSection) === String(rateSectionStr));
}

/**
 * Filter matrix data by tax zone IDs
 */
export function filterByTaxZoneIds(
  data: IRateMaster[],
  taxZoneIds: number[] | undefined,
  zoneDescriptions: IZoneDescription[]
): IRateMaster[] {
  if (!taxZoneIds || taxZoneIds.length === 0) {
    return data;
  }

  const zoneNoSet = new Set(taxZoneIds.map(id => {
    const zoneNo = zoneDescriptions.find(z => z.taxZoneId === id)?.zoneNo;
    return zoneNo || String(id);
  }));

  return data.filter(row => zoneNoSet.has(row.zoneNo));
}
