'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { PropertyPerformanceData } from '@/types/property-tax/apartment';
import { AnimatedMascot, type MascotMood } from './AnimatedMascot';
import { PropertyMasterRevenueStats } from './PropertyMasterRevenueStats';

interface PropertyMasterRevenueCardProps {
  performance?: PropertyPerformanceData;
  descriptionRegional?: string;
}

export const PropertyMasterRevenueCard: React.FC<PropertyMasterRevenueCardProps> = ({
  performance,
  descriptionRegional,
}) => {
  const t = useTranslations('appartmentQC');

  const mascotMood: MascotMood = React.useMemo(() => {
    if (!performance) return 'neutral';

    const isNegative =
      performance.isGrowthNegative ||
      (performance.changePercent != null && performance.changePercent < 0) ||
      (performance.rawDifferenceAmount != null && performance.rawDifferenceAmount < 0);

    if (isNegative) return 'sad';

    const isZeroOrDefault =
      !performance.thisAssessmentRevenue ||
      performance.thisAssessmentRevenue === '₹0' ||
      performance.thisAssessmentRevenue === '-' ||
      (!performance.changePercent && !performance.rawDifferenceAmount);

    if (isZeroOrDefault) return 'neutral';

    const isPositive =
      (performance.changePercent != null && performance.changePercent > 0) ||
      (performance.rawDifferenceAmount != null && performance.rawDifferenceAmount > 0);

    if (isPositive) return 'happy';

    return 'neutral';
  }, [performance]);

  return (
    <div className="w-full lg:w-[275px] xl:w-[315px] 2xl:w-[380px] bg-white rounded-xl border border-slate-200/90 px-1.5 xl:px-2 pt-1.5 pb-2 shadow-2xs shrink-0 flex flex-col justify-between gap-1 xl:gap-1.5 min-w-0 overflow-hidden">
      {/* Top: Header Row with DESC */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-1 gap-1 min-w-0">
        <div className="flex items-center gap-1 xl:gap-1.5 shrink-0">
          <TrendingUp className="w-3.5 h-3.5 xl:w-4 xl:h-4 2xl:w-5 2xl:h-5 text-slate-900 shrink-0" />
          <span className="text-[11px] xl:text-[12.5px] 2xl:text-[15px] font-black text-slate-900 tracking-tight whitespace-nowrap">
            {t('revenueCard.addRevenue') || 'ADD. REVENUE'}
          </span>
        </div>
        <div className="flex items-center gap-1 xl:gap-1.5 min-w-0 flex-1 justify-end">
          <span className="text-[9px] xl:text-[10px] 2xl:text-[11px] font-black text-slate-800 tracking-tight shrink-0">
            {t('revenueCard.desc') || 'DESC:'}
          </span>
          <span
            title={descriptionRegional || '-'}
            className="inline-flex items-center justify-center px-1.5 xl:px-2 py-0.5 rounded-md border-2 border-red-500 bg-red-100 text-red-700 font-black text-[10px] xl:text-[11px] 2xl:text-[12px] leading-normal tracking-tight truncate max-w-[110px] xl:max-w-[130px] 2xl:max-w-[170px] shadow-xs"
          >
            {descriptionRegional || '-'}
          </span>
        </div>
      </div>

      {/* Middle: 3D Mascot Avatar + Amount & Growth Pill */}
      <div className="flex items-center justify-between px-1 py-0.5">
        <AnimatedMascot className="w-11 h-11 lg:w-11 lg:h-11 xl:w-13 xl:h-13 2xl:w-16 2xl:h-16 shrink-0" mood={mascotMood} />
        <div
          className="flex flex-col items-end"
          title={
            performance?.oldCurrentTax && performance.oldCurrentTax !== '-'
              ? `${t('revenueCard.oldCurrentTax') || 'Old Current Tax'}: ${performance.oldCurrentTax}${
                  performance.differenceAmount ? ` | Diff: ${performance.differenceAmount}` : ''
                }`
              : undefined
          }
        >
          <span className="text-base xl:text-lg 2xl:text-2xl font-black text-slate-900 leading-none tracking-tight">
            {performance?.thisAssessmentRevenue || '₹0'}
          </span>
          {performance?.revenueGrowthPct ? (
            <span
              className={`text-[9.5px] xl:text-[11px] 2xl:text-[13px] font-extrabold tracking-tight mt-0.5 xl:mt-1 ${
                performance?.isGrowthNegative ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {performance.revenueGrowthPct}
            </span>
          ) : null}
        </div>
      </div>

      {/* Bottom: 8 Grid Mini Cards (4x2) */}
      <PropertyMasterRevenueStats performance={performance} />
    </div>
  );
};

