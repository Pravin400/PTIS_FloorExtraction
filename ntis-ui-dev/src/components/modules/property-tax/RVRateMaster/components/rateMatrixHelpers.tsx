import { MapPin } from "lucide-react";
import type { RateCategory } from "@/types/RVRateMaster";

type MatrixRow = {
  id: number;
  zone?: string;
  zoneNo?: string;
  taxZoneId?: number;
  [key: string]: number | string | null | undefined;
};

/**
 * Build matrix columns from rate categories
 */
export function buildMatrixColumns(
  rateCategories: RateCategory[],
  singleColorClassHeader: string,
  tCommon: ReturnType<typeof import("next-intl").useTranslations>,
  rateUnit: "SqMeter" | "SqFeet" = "SqMeter",
  t?: ReturnType<typeof import("next-intl").useTranslations>,
  aliasLabels?: Record<string, string>
) {
  // Filter out zone columns
  const filteredCategories = rateCategories.filter(cat =>
    !["zoneno", "zonedescription", "zone_no", "zone description", "zone_description"]
      .includes(cat.constructionId?.toLowerCase?.())
  );

  const rateUnitLabel = rateUnit === "SqMeter" ? tCommon('rateUnitSqMeter') : tCommon('rateUnitSqFeet');
  const tooltipHeader = t ? t('tooltips.associatedTypesOfUse', aliasLabels) : 'Associated Types of Use:';

  return filteredCategories.map((cat) => {
    const code = (cat.constructionCode || cat.constructionId).trim().toUpperCase();
    const groupCode = cat.typeOfUseGroupCode ? cat.typeOfUseGroupCode.trim().toUpperCase() : code;
    const associated = cat.associatedUseTypes;
    const hasMultiple = associated && associated.length > 1;
    const displayCode = groupCode;

    const tooltipContent = hasMultiple ? (
      <div className="text-left whitespace-normal font-sans leading-relaxed min-w-[180px]">
        <div className="font-bold border-b border-blue-200/50 pb-1 mb-1 text-white">
          {tooltipHeader}
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
    ) : (cat.description || cat.constructionId);

    return {
      id: cat.constructionCode || cat.constructionId,
      label: (
        <span className={`inline-block font-bold rounded-lg px-2 py-0.5 ${singleColorClassHeader}`}>
          {displayCode} <span className="text-[10px] font-normal">{rateUnitLabel}</span>
        </span>
      ),
      tooltip: tooltipContent as unknown as string,
      headerClassName: `${singleColorClassHeader} font-bold text-xs text-center rounded-lg`,
    };
  });
}

/**
 * Build matrix meta columns (zone column)
 */
export function buildMatrixMetaColumns(
  t: ReturnType<typeof import("next-intl").useTranslations>,
  aliasLabels?: Record<string, string>
) {
  return [
    {
      id: "zoneNo",
      label: (
        <span className="inline-flex items-center gap-0.5 text-[11px] md:text-[12px] font-bold text-blue-700 whitespace-nowrap">
          <MapPin size={11} />
          {t('columns.taxZoneNo', aliasLabels)}
        </span>
      ),
      width: "70px"
    },
  ];
}

/**
 * Build matrix rows from data
 */
export function buildMatrixRows(
  matrixData: MatrixRow[],
  filteredCategories: RateCategory[],
  zoneRemarksMap: Map<string, string>
) {
  return matrixData.map((row) => {
    const cells: Record<string, string | number> = Object.fromEntries(
      filteredCategories.map(cat => {
        const key = cat.constructionCode || cat.constructionId;
        const value = row[key];
        return [key, typeof value === 'number' ? value : String(value ?? '')];
      })
    );
    return {
      id: String(row.id),
      cells,
      meta: {
        zoneNo: row.zoneNo ?? (row as unknown as { zone?: string }).zone ?? '',
        zoneNo_tooltip: zoneRemarksMap.get((row.zoneNo ?? (row as unknown as { zone?: string }).zone ?? '') as string) || '',
      },
    };
  });
}

/**
 * Build category color map
 */
export function buildCategoryColorMap(rateCategories: RateCategory[], singleColorClass: string) {
  const categoryColorMap: Record<string, string> = {};
  rateCategories.forEach((cat) => {
    if (cat && cat.constructionId) {
      const key = (cat.constructionCode || cat.constructionId).trim().toUpperCase();
      categoryColorMap[key] = singleColorClass;
    }
  });
  return categoryColorMap;
}

/**
 * Filter out zone columns from rate categories
 */
export function filterRateCategories(rateCategories: RateCategory[]) {
  return rateCategories.filter(cat =>
    !["zoneno", "zonedescription", "zone_no", "zone description", "zone_description"]
      .includes(cat.constructionId?.toLowerCase?.())
  );
}
