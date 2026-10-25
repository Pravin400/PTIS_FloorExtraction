'use client';

import { useTranslations } from "next-intl";


import { type InventoryRow } from '@/types/asset/furniture-fixture.types';

export function ConditionChart({ data = [] }: { data: InventoryRow[] }) {
  const t = useTranslations("newAddNewAsset");
  const totalQty = data.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const getQtyByCondition = (keywords: string[]) => {
    return data
      .filter(item => {
        const condLower = String(item.condition || '').toLowerCase();
        return keywords.some(k => condLower.includes(k));
      })
      .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  };

  const qtyGood = getQtyByCondition(['good', 'working', 'new', 'नवीन']);
  const qtyFair = getQtyByCondition(['fair', 'repair', 'needs repair']);
  const qtyPoor = getQtyByCondition(['poor', 'scrap']);

  const pctGood = totalQty > 0 ? (qtyGood / totalQty) : 0;
  const pctFair = totalQty > 0 ? (qtyFair / totalQty) : 0;
  const pctPoor = totalQty > 0 ? (qtyPoor / totalQty) : 0;

  const pctGoodStr = (pctGood * 100).toFixed(1) + '%';
  const pctFairStr = (pctFair * 100).toFixed(1) + '%';
  const pctPoorStr = (pctPoor * 100).toFixed(1) + '%';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 h-full flex flex-col">
      <h3 className="text-[14px] font-bold text-[#1c2aab] mb-3">{t("conditionSummary") || "Condition Summary"}</h3>
      
      <div className="flex items-center justify-between flex-1 px-2">
        {/* SVG Donut Chart */}
        <div className="relative w-[110px] h-[110px] shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {/* Base circle for Poor (Red) */}
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="transparent"
              stroke="#EF4444" // red-500
              strokeWidth="25"
            />
            {/* Fair (Orange) */}
            {/* Circumference = 2 * PI * 35 = 219.91 */}
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="transparent"
              stroke="#F97316" // orange-500
              strokeWidth="25"
              strokeDasharray="219.91"
              strokeDashoffset={219.91 * (1 - (pctFair + pctPoor))} 
            />
            {/* Good (Green) */}
            <circle
              cx="50"
              cy="50"
              r="35"
              fill="transparent"
              stroke="#22C55E" // green-500
              strokeWidth="25"
              strokeDasharray="219.91"
              strokeDashoffset={219.91 * (1 - pctGood)} 
            />
          </svg>
          {/* Inner white circle for donut hole */}
          <div className="absolute inset-0 m-auto w-[50px] h-[50px] bg-white rounded-full"></div>
        </div>
 
        {/* Legend */}
        <div className="flex flex-col gap-4 min-w-[120px]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-green-600"></div>
              <span className="text-[12px] font-semibold text-[#1c2aab]">{t("good") || "Good"} ({qtyGood})</span>
            </div>
            <span className="text-[11px] text-[#1c2aab] font-medium">{pctGoodStr}</span>
          </div>
 
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-orange-500"></div>
              <span className="text-[12px] font-semibold text-[#1c2aab]">{t("fair") || "Fair"} ({qtyFair})</span>
            </div>
            <span className="text-[11px] text-[#1c2aab] font-medium">{pctFairStr}</span>
          </div>
 
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-red-500"></div>
              <span className="text-[12px] font-semibold text-[#1c2aab]">{t("poor") || "Poor"} ({qtyPoor})</span>
            </div>
            <span className="text-[11px] text-[#1c2aab] font-medium">{pctPoorStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
