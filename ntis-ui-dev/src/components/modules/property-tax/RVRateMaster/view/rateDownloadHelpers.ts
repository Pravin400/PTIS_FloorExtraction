import { toast } from "sonner";
import { getDetailedRatesAction } from "@/app/[locale]/property-tax/rate-master/rvratemaster/action";
import type { ISelectOption, RateCategory } from "@/types/RVRateMaster";
/**
 * Escape CSV value for proper formatting
 */
function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

interface RateData {
  rateSection?: string;
  taxZone?: string;
  typeOfUseGroup?: string;
  yearRangeRV?: string;
  constructionType?: string;
  constructionCode?: string;
  constructionTypeCode?: string;
  constructionTypeId?: number | string;
  rateSquareMeter?: number;
  rateSquareFeet?: number;
  rateRemark?: string;
  typeOfUseGroupId?: number;
}

interface GroupedGrid {
  yearRange: string;
  useGroup: string;
  taxZones: string[];
  constructionTypes: string[];
  rateData: Map<string, Map<string, number>>;
}

/**
 * Group rates by year range and use group or construction type, then organize into grid format
 */
function groupRatesIntoGrids(
  rates: RateData[],
  rateCategories: (string | RateCategory)[],
  rateUnit: "SqMeter" | "SqFeet",
  isOpenPlot: boolean = false,
  useGroups: ISelectOption[] = []
): GroupedGrid[] {
  // Build ordered construction type list and create mapping
  const orderedConstructionTypes: string[] = [];
  const constructionTypeMap = new Map<string, string>(); // Maps backend value to display code

  rateCategories.forEach(cat => {
    const displayCode = typeof cat === 'string' ? cat : (cat.constructionCode || cat.constructionId);
    orderedConstructionTypes.push(displayCode);

    // Map various identifiers to the display code
    if (typeof cat !== 'string') {
      if (cat.constructionId) constructionTypeMap.set(cat.constructionId, displayCode);
      if (cat.constructionCode) constructionTypeMap.set(cat.constructionCode, displayCode);
      if (cat.description) constructionTypeMap.set(cat.description, displayCode);
    }
    constructionTypeMap.set(displayCode, displayCode);
  });

  // First, group by combination key
  const combinationMap = new Map<string, RateData[]>();

  rates.forEach(rate => {
    const key = isOpenPlot
      ? `${rate.yearRangeRV || ''}`
      : `${rate.yearRangeRV || ''}|${rate.typeOfUseGroup || ''}`;

    if (!combinationMap.has(key)) {
      combinationMap.set(key, []);
    }
    combinationMap.get(key)!.push(rate);
  });

  // Convert to grid format
  const grids: GroupedGrid[] = [];

  combinationMap.forEach((groupRates, key) => {
    let yearRange = '';
    let gridUseGroup = '';

    if (isOpenPlot) {
      yearRange = key;
    } else {
      const [yr, ug] = key.split('|');
      yearRange = yr;
      gridUseGroup = ug;
    }

    // Collect unique tax zones and construction types / use groups for this group
    const taxZonesSet = new Set<string>();
    const columnValuesSet = new Set<string>();
    const rateDataMap = new Map<string, Map<string, number>>();

    groupRates.forEach(rate => {
      const taxZone = rate.taxZone || '';
      // Use rate value based on selected unit
      const rateValue = rateUnit === 'SqFeet'
        ? (rate.rateSquareFeet || 0)
        : (rate.rateSquareMeter || 0);

      if (taxZone) taxZonesSet.add(taxZone);

      if (isOpenPlot) {
        const useGroup = rate.typeOfUseGroup || '';
        if (useGroup) columnValuesSet.add(useGroup);

        if (!rateDataMap.has(taxZone)) {
          rateDataMap.set(taxZone, new Map());
        }
        rateDataMap.get(taxZone)!.set(useGroup, rateValue);
      } else {
        const backendConstructionType = rate.constructionType ||
          rate.constructionCode ||
          rate.constructionTypeCode ||
          (rate.constructionTypeId ? String(rate.constructionTypeId) : '');
        const displayConstructionType = constructionTypeMap.get(backendConstructionType) || backendConstructionType;
        if (displayConstructionType) columnValuesSet.add(displayConstructionType);

        if (!rateDataMap.has(taxZone)) {
          rateDataMap.set(taxZone, new Map());
        }
        rateDataMap.get(taxZone)!.set(displayConstructionType, rateValue);
      }
    });

    // Sort tax zones numerically
    const taxZones = Array.from(taxZonesSet).sort((a, b) => {
      const numA = parseInt(a) || 0;
      const numB = parseInt(b) || 0;
      return numA - numB;
    });

    // Filter and order columns
    let columnsList: string[] = [];
    if (isOpenPlot) {
      const orderedUseGroups = useGroups.map(ug => ug.label);
      columnsList = orderedUseGroups.filter(ug => columnValuesSet.has(ug));
      columnValuesSet.forEach(ug => {
        if (!columnsList.includes(ug)) {
          columnsList.push(ug);
        }
      });
    } else {
      columnsList = orderedConstructionTypes.filter(ct =>
        columnValuesSet.has(ct)
      );
    }

    grids.push({
      yearRange,
      useGroup: gridUseGroup,
      taxZones,
      constructionTypes: columnsList,
      rateData: rateDataMap
    });
  });

  // Sort grids by year range and key
  grids.sort((a, b) => {
    const yearCompare = a.yearRange.localeCompare(b.yearRange);
    return yearCompare !== 0 ? yearCompare : a.useGroup.localeCompare(b.useGroup);
  });

  return grids;
}

/**
 * Convert grids to CSV format with a single header row and all data rows below
 */
function gridsToCSV(
  grids: GroupedGrid[],
  rateSection: string,
  rateUnit: "SqMeter" | "SqFeet",
  t: ReturnType<typeof import("next-intl").useTranslations>,
  isOpenPlot: boolean = false,
  aliasLabels?: Record<string, string>
): string {
  const csvLines: string[] = [];

  // Collect all unique columns across all grids, maintaining order
  const allColumnsSet = new Set<string>();
  grids.forEach(grid => {
    grid.constructionTypes.forEach(ct => allColumnsSet.add(ct));
  });
  const allColumns = Array.from(allColumnsSet);

  // Add single header row at the top
  const rateUnitLabel = rateUnit === 'SqFeet'
    ? t('downloadHeaders.rateSqFt')
    : t('downloadHeaders.rateSqMtr');

  const headerRow = [
    escapeCsvValue(t('downloadHeaders.rateSection', aliasLabels)),
    escapeCsvValue(t('downloadHeaders.assessmentYearRange', aliasLabels)),
  ];

  if (!isOpenPlot) {
    headerRow.push(escapeCsvValue(t('downloadHeaders.useGroup', aliasLabels)));
  }

  headerRow.push(escapeCsvValue(t('downloadHeaders.taxZoneNo', aliasLabels)));

  allColumns.forEach(col => {
    const label = `${col} (${rateUnitLabel})`;
    headerRow.push(escapeCsvValue(label));
  });

  csvLines.push(headerRow.join(','));

  // Add data rows for all grids
  grids.forEach(grid => {
    grid.taxZones.forEach(taxZone => {
      const row = [
        escapeCsvValue(rateSection),
        escapeCsvValue(grid.yearRange),
      ];

      if (!isOpenPlot) {
        row.push(escapeCsvValue(grid.useGroup));
      }

      row.push(escapeCsvValue(taxZone));

      // Add rate for each column (use 0 if not present in this grid)
      allColumns.forEach(column => {
        const rate = grid.rateData.get(taxZone)?.get(column) || 0;
        row.push(escapeCsvValue(rate));
      });

      csvLines.push(row.join(','));
    });
  });

  return csvLines.join('\r\n');
}

/**
 * Download detailed rates as CSV file in grid format
 */
export async function downloadDetailedRates(
  selectedZone: string,
  zones: ISelectOption[],
  rateUnit: "SqMeter" | "SqFeet",
  t: ReturnType<typeof import("next-intl").useTranslations>,
  rateCategories: (string | RateCategory)[],
  useGroups: ISelectOption[] = [],
  isOpenPlot: boolean = false,
  aliasLabels?: Record<string, string>
) {
  if (!selectedZone || selectedZone === 'ALL') {
    toast.error(t('messages.selectRateSection', aliasLabels));
    return;
  }

  try {
    toast.loading(t('messages.downloadingRates'));
    const detailedRatesResponse = await getDetailedRatesAction(
      selectedZone, undefined, undefined, 1, -1
    );
    let allRates = ((detailedRatesResponse as { items?: unknown[] })?.items || []) as RateData[];

    if (!allRates || allRates.length === 0) {
      toast.dismiss();
      toast.error(t('messages.noRatesAvailable'));
      return;
    }

    if (useGroups && useGroups.length > 0) {
      const allowedGroupIds = new Set(useGroups.map(ug => Number(ug.value)));
      allRates = allRates.filter(rate =>
        rate.typeOfUseGroupId !== undefined && allowedGroupIds.has(Number(rate.typeOfUseGroupId))
      );
    }

    // Get rate section name for header
    const zoneName = zones.find(z => z.value === selectedZone)?.label || selectedZone;

    // Group rates into grids with proper ordering
    const grids = groupRatesIntoGrids(allRates, rateCategories, rateUnit, isOpenPlot, useGroups);

    // Convert grids to CSV with translations
    const csvContent = gridsToCSV(grids, zoneName, rateUnit, t, isOpenPlot, aliasLabels);

    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;

    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const fileName = `Rate_Master_${zoneName}_AllUseGroups_AllYears_Grid_${new Date().toISOString().split('T')[0]}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.dismiss();
    toast.success(t('messages.ratesDownloaded'));
  } catch (_error) {
    toast.dismiss();
    toast.error(t('messages.downloadFailed'));
  }
}
