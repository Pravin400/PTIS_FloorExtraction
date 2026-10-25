import { useTranslations } from "next-intl";
import { NewProperty, OldPropertyCandidate } from "@/types/property-mapping";
import { formatArea } from "./mappingUtils";

interface ComparisonCardsProps {
  currentNewProperty: NewProperty | undefined;
  selectedCandidates: OldPropertyCandidate[];
  metrics: {
    totalOldArea: number;
    areaDiff: number;
    areaPercentDiff: number;
    totalOldCarpetArea: number;
    carpetAreaDiff: number;
    carpetAreaPercentDiff: number;
    totalOldTax: number;
    taxDiff: number;
    taxPercentDiff: number;
    floorStatus: string;
    floorStatusLevel: string;
  };
  money: (val: number) => string;
  percentText: (val: number) => string;
  getDifferenceColorClass: (val: number) => string;
  getBadgeForPercent: (val: number) => React.ReactNode;
  stepNumber?: number;
}

export function ComparisonCards({
  currentNewProperty,
  selectedCandidates,
  metrics,
  money,
  percentText,
  getDifferenceColorClass,
  stepNumber = 3,
}: ComparisonCardsProps) {
  const t = useTranslations("propertyMapping");
  if (!currentNewProperty) return null;

  const currentPropertyCarpetArea = currentNewProperty.carpetArea || 0;
  const areaUnit = t("comparisonCards.areaUnit") || "sq. ft.";

  const renderPercentBadge = (p: number) => {
    if (Math.abs(p) < 0.01) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          {t("comparisonCards.toleranceBadge.equal")}
        </span>
      );
    }
    if (p > 0) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {t("comparisonCards.toleranceBadge.oldIsLess")} (+{p.toFixed(1)}%)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        {t("comparisonCards.toleranceBadge.oldIsMore")} ({p.toFixed(1)}%)
      </span>
    );
  };

  const getFloorStatusText = () => {
    if (metrics.floorStatusLevel === "good") {
      return t("comparisonCards.floorCard.floorStatus.matched");
    }
    if (metrics.floorStatusLevel === "warn") {
      return t("comparisonCards.floorCard.floorStatus.oldIsLess");
    }
    if (metrics.floorStatus === "Old is More") {
      return t("comparisonCards.floorCard.floorStatus.oldIsMore");
    }
    return t("comparisonCards.floorCard.floorStatus.noMatchingLayout");
  };

  return (
    <section className="bg-slate-50/50 border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col gap-3">
      <div className="bg-blue-50/70 border border-blue-100/50 py-2.5 px-3.5 rounded-xl border-l-4 border-l-blue-600 mb-1.5">
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider shadow-xs">
            {t("stepLabel", { step: stepNumber })}
          </span>
          <h3 className="text-base font-black text-slate-900 tracking-tight">
            {t("comparisonCards.step4.title")}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: Area Reconciliation */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col gap-2">
          <h4 className="text-xs font-black text-blue-600 uppercase tracking-wider">{t("comparisonCards.areaCard.title")}</h4>
          <div className="flex flex-col gap-2 text-slate-600 mt-1">
            {/* Built-up Area Section */}
            <div className="border-b border-slate-100 pb-2 flex flex-col gap-1.5 text-xs font-semibold">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t("comparisonCards.areaCard.builtUpAreaSection")}</span>
              <div className="flex justify-between">
                <span>{t("comparisonCards.areaCard.newBuiltUp")}</span>
                <span className="text-slate-900 font-extrabold text-sm">{formatArea(currentNewProperty.builtUpArea)} {areaUnit}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("comparisonCards.areaCard.oldBuiltUp")}</span>
                <span className="text-slate-900 font-extrabold text-sm">{formatArea(metrics.totalOldArea)} {areaUnit}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-dashed border-slate-100 mt-0.5">
                <span>{t("comparisonCards.areaCard.difference")}</span>
                <span className={`font-black text-xs ${getDifferenceColorClass(metrics.areaDiff)}`}>
                  {metrics.areaDiff > 0 ? "+" : ""}{formatArea(metrics.areaDiff)} {areaUnit} ({percentText(metrics.areaPercentDiff)})
                </span>
              </div>
            </div>

            {/* Carpet Area Section */}
            <div className="flex flex-col gap-1.5 text-xs font-semibold mt-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t("comparisonCards.areaCard.carpetAreaSection")}</span>
              <div className="flex justify-between">
                <span>{t("comparisonCards.areaCard.newCarpet")}</span>
                <span className="text-slate-900 font-extrabold text-sm">{formatArea(currentPropertyCarpetArea)} {areaUnit}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("comparisonCards.areaCard.oldCarpet")}</span>
                <span className="text-slate-900 font-extrabold text-sm">{formatArea(metrics.totalOldCarpetArea)} {areaUnit}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-dashed border-slate-100 mt-0.5">
                <span>{t("comparisonCards.areaCard.difference")}</span>
                <span className={`font-black text-xs ${getDifferenceColorClass(metrics.carpetAreaDiff)}`}>
                  {metrics.carpetAreaDiff > 0 ? "+" : ""}{formatArea(metrics.carpetAreaDiff)} {areaUnit} ({percentText(metrics.carpetAreaPercentDiff)})
                </span>
              </div>
            </div>

            {/* Reconciliation status badge */}
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 text-xs font-semibold">
              <span>{t("comparisonCards.areaCard.toleranceStatus")}</span>
              {renderPercentBadge(metrics.areaPercentDiff)}
            </div>
          </div>
        </div>

        {/* Card 2: Floor Match Check */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col gap-2">
          <h4 className="text-xs font-black text-violet-600 uppercase tracking-wider">{t("comparisonCards.floorCard.title")}</h4>
          <div className="flex flex-col gap-2 text-sm font-semibold text-slate-600 mt-1">
            <div className="flex justify-between">
              <span>{t("comparisonCards.floorCard.newFloorCount")}</span>
              <span className="text-slate-900 font-extrabold text-base">{currentNewProperty.floors}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span>{t("comparisonCards.floorCard.oldFloorCount")}</span>
              <span className="text-slate-900 font-extrabold text-base">
                {selectedCandidates.length > 0
                  ? `${selectedCandidates.reduce((acc, c) => acc + (c.floors.includes("+") ? 2 : 1), 0)} ${t("comparisonCards.records")}`
                  : `0 ${t("comparisonCards.records")}`}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span>{t("comparisonCards.floorCard.floorRecordsAvailable")}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                selectedCandidates.length > 0
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}>
                {selectedCandidates.length > 0 ? t("comparisonCards.floorCard.yes") : t("comparisonCards.floorCard.no")}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span>{t("comparisonCards.floorCard.floorMatchResult")}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                metrics.floorStatusLevel === "good"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : metrics.floorStatusLevel === "warn"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}>
                {getFloorStatusText()}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Tax Comparison */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col gap-2">
          <h4 className="text-xs font-black text-indigo-650 uppercase tracking-wider">{t("comparisonCards.taxCard.title")}</h4>
          <div className="flex flex-col gap-2 text-sm font-semibold text-slate-600 mt-1">
            <div className="flex justify-between">
              <span>{t("comparisonCards.taxCard.newAnnualTax")}</span>
              <span className="text-slate-900 font-extrabold text-base font-mono">{money(currentNewProperty.tax)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span>{t("comparisonCards.taxCard.oldAnnualTax")}</span>
              <span className="text-slate-900 font-extrabold text-base font-mono">{money(metrics.totalOldTax)}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span>{t("comparisonCards.taxCard.difference")}</span>
              <span className={`font-black text-base ${getDifferenceColorClass(metrics.taxDiff)}`}>
                {money(metrics.taxDiff)} ({percentText(metrics.taxPercentDiff)})
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span>{t("comparisonCards.taxCard.differenceStatus")}</span>
              {renderPercentBadge(metrics.taxPercentDiff)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
