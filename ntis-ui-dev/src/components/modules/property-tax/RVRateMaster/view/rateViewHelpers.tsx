import type { RateCategory, MatrixColumn, IRateMaster, IRateValue } from "@/types/RVRateMaster";

/**
 * Filter table data based on selected filters
 */
export function filterTableData(
  rateMasterData: IRateMaster[],
  selectedZone: string,
  selectedYear: string,
  selectedUseGroup: string | undefined,
  isPaginationEnabled: boolean,
  isOpenPlot: boolean = false
): IRateMaster[] {
  if (isPaginationEnabled) {
    return rateMasterData;
  }
  return rateMasterData.filter((row) => {
    // Use rateSection if present, fallback to zoneSection for zone filtering
    if (selectedZone !== "ALL" && (row.rateSection ?? row.zoneSection) !== selectedZone) return false;
    if (selectedYear !== "ALL" && row.assessmentYear !== selectedYear) return false;
    if (!isOpenPlot && selectedUseGroup !== "ALL" && row.useGroup !== selectedUseGroup) return false;
    return true;
  });
}

/**
 * Count configured rates in filtered data
 */
export function countConfiguredRates(filteredData: IRateMaster[]): number {
  return filteredData.reduce((count, row) => {
    const filledRates = row.rates?.filter((r: IRateValue) => r.ratePerSqMtr != null && r.ratePerSqMtr >= 0).length || 0;
    return count + filledRates;
  }, 0);
}

/**
 * Build category color map
 */
export function buildCategoryColorMap(
  rateCategories: (string | RateCategory)[],
  singleColorClass: string
): Record<string, string> {
  const map: Record<string, string> = {};
  rateCategories.forEach((cat) => {
    const catCode = typeof cat === 'string' ? cat : (cat.constructionCode || cat.constructionId);
    map[catCode.toUpperCase()] = singleColorClass;
  });
  return map;
}

/**
 * Build matrix columns from rate categories
 */
export function buildRateColumns(
  rateCategories: (string | RateCategory)[],
  singleColorClassHeader: string,
  tCommon: ReturnType<typeof import("next-intl").useTranslations>,
  t: ReturnType<typeof import("next-intl").useTranslations>,
  rateUnit: "SqMeter" | "SqFeet" = "SqMeter",
  aliasLabels?: Record<string, string>
): MatrixColumn[] {
  const seenCodes = new Set<string>();
  const rateUnitLabel = rateUnit === "SqMeter" ? tCommon('rateUnitSqMeter') : tCommon('rateUnitSqFeet');
  return rateCategories
    .map((cat) => {
      const catCode = typeof cat === 'string' ? cat : (cat.constructionCode || cat.constructionId);
      const description = typeof cat !== 'string' ? cat.description : undefined;
      const normalizedCode = catCode.trim().toUpperCase();
      if (seenCodes.has(normalizedCode)) return null;
      seenCodes.add(normalizedCode);
      const associated = typeof cat !== 'string' ? cat.associatedUseTypes : undefined;
      const hasMultiple = associated && associated.length > 1;
      const groupCode = typeof cat !== 'string' && cat.typeOfUseGroupCode ? cat.typeOfUseGroupCode.trim().toUpperCase() : normalizedCode;
      const displayCode = groupCode;

      const tooltipContent = hasMultiple ? (
        <div className="text-left whitespace-normal font-sans leading-relaxed min-w-[180px]">
          <div className="font-bold border-b border-blue-200/50 pb-1 mb-1 text-white">
            {t('tooltips.associatedTypesOfUse', aliasLabels)}
          </div>
          <div className="space-y-1 mt-1">
            {associated.map((u, i) => (
              <div key={i} className="flex gap-1 items-start text-white">
                <span className="font-bold shrink-0">• {u.code}:</span>
                <span className="text-blue-50">{u.description}</span>
              </div>
            ))}
          </div>
        </div>
      ) : description;

      const col: MatrixColumn = {
        id: catCode,
        label: (
          <span className={`inline-block font-bold rounded-lg px-2 py-0.5 ${singleColorClassHeader}`}>
            {displayCode} <span className="text-[10px] font-normal">{rateUnitLabel}</span>
          </span>
        ),
        tooltip: tooltipContent as unknown as string,
        headerClassName: `${singleColorClassHeader} font-bold text-xs text-center rounded-lg`
      };
      return col;
    })
    .filter((col): col is MatrixColumn => col !== null);
}
