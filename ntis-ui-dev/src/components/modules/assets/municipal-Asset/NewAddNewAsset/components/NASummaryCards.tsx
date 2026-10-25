"use client";

/**
 * NASummaryCards
 *
 * Displays five summary metrics for the asset being registered.
 * All values are derived from real floor/unit data passed as props —
 * no hardcoded mock numbers.
 *
 * Totals always use the COMPLETE floor array (not the paginated visible
 * subset) so pagination does not affect the calculations.
 */

import { useTranslations } from "next-intl";
import type { NASummaryCardsProps } from "@/types/asset/municipal-Asset/new-add-new-asset";

function formatArea(sqm: number): string {
  if (sqm === 0) return "0.00 Sq.m.";
  return `${sqm.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Sq.m.`;
}

function formatCapitalValue(value: number): string {
  if (value === 0) return "₹ 0";
  if (value >= 10_000_000) {
    return `₹ ${(value / 10_000_000).toFixed(2)} Cr`;
  }
  if (value >= 100_000) {
    return `₹ ${(value / 100_000).toFixed(2)} L`;
  }
  return `₹ ${value.toLocaleString("en-IN")}`;
}

function formatFloors(n: number): string {
  if (!n || n === 0) return "—";
  return n.toLocaleString("en-IN");
}

export function NASummaryCards({ summary, cvRollup }: NASummaryCardsProps) {
  const t = useTranslations("newAddNewAsset");

  const cvObj = typeof cvRollup === "object" && cvRollup !== null ? cvRollup : null;
  const totalFloorsVal = cvObj?.totalFloors != null
    ? Number(cvObj.totalFloors)
    : (cvObj?.floorCount != null ? Number(cvObj.floorCount) : summary.totalFloors);
  const totalUnitsVal = cvObj?.totalUnits != null ? Number(cvObj.totalUnits) : summary.totalUnits;
  const totalCarpetVal = cvObj?.totalCarpetAreaSqMeter != null ? Number(cvObj.totalCarpetAreaSqMeter) : summary.totalCarpetSqm;
  const totalBuiltupVal = cvObj?.totalBuiltUpAreaSqMeter != null ? Number(cvObj.totalBuiltUpAreaSqMeter) : summary.totalBuiltupSqm;
  const capitalValueVal = typeof cvRollup === "number"
    ? cvRollup
    : (cvObj?.totalCapitalValue != null ? Number(cvObj.totalCapitalValue) : summary.capitalValue);

  return (
    <div className="grid grid-cols-5 gap-3 mt-1">

      {/* Total Floors */}
      <div className="bg-[#EFF6FF] rounded-xl border border-blue-100/70 p-2.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-500 leading-tight">{t("summaryCards.totalFloors")}</div>
          <div className="text-[16px] font-black text-[#101b87] leading-tight">
            {formatFloors(totalFloorsVal)}
          </div>
        </div>
      </div>

      {/* Total Rooms / Units */}
      <div className="bg-[#EFF6FF] rounded-xl border border-blue-100/70 p-2.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-500 leading-tight">{t("summaryCards.totalRoomsUnits")}</div>
          <div className="text-[16px] font-black text-[#101b87] leading-tight">
            {totalUnitsVal > 0 ? totalUnitsVal.toLocaleString("en-IN") : "—"}
          </div>
        </div>
      </div>

      {/* Total Carpet Area */}
      <div className="bg-[#EFF6FF] rounded-xl border border-blue-100/70 p-2.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-500 leading-tight">{t("summaryCards.totalCarpetArea")}</div>
          <div className="text-[15px] font-black text-[#101b87] leading-tight">
            {totalCarpetVal > 0 ? formatArea(totalCarpetVal) : "—"}
          </div>
        </div>
      </div>

      {/* Total Built-up Area */}
      <div className="bg-[#EFF6FF] rounded-xl border border-blue-100/70 p-2.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 15 4 20 9 20" />
            <polyline points="20 9 20 4 15 4" />
            <line x1="20" y1="4" x2="14" y2="10" />
            <line x1="4" y1="20" x2="10" y2="14" />
          </svg>
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-500 leading-tight">{t("summaryCards.totalBuiltupArea")}</div>
          <div className="text-[15px] font-black text-[#101b87] leading-tight">
            {totalBuiltupVal > 0 ? formatArea(totalBuiltupVal) : "—"}
          </div>
        </div>
      </div>

      {/* Capital Value */}
      <div className="bg-[#EFF6FF] rounded-xl border border-blue-100/70 p-2.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12h6M9 9h6" />
            <path d="M9 12l3 3" />
          </svg>
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-500 leading-tight">{t("summaryCards.capitalValue")}</div>
          <div className="text-[15px] font-black text-[#101b87] leading-tight">
            {capitalValueVal > 0 ? formatCapitalValue(capitalValueVal) : "—"}
          </div>
        </div>
      </div>

    </div>
  );
}
