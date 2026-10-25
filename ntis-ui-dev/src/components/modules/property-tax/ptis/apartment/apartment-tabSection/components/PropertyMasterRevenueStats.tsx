'use client';

import React from 'react';
import { FileText, Clock, CreditCard, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { PropertyPerformanceData } from '@/types/property-tax/apartment';

interface PropertyMasterRevenueStatsProps {
  performance?: PropertyPerformanceData;
}

/**
 * Formats large amounts in Crores (Cr) for compact card display when digits are large.
 * Avoids awkward ellipsis truncation (e.g. '₹2,46,16,36,350' -> '₹246.16 Cr').
 */
export function formatCompactStatAmount(val?: string | number | null): string {
  if (val === null || val === undefined || val === '') return '-';
  const rawStr = String(val).trim();
  if (rawStr === '-' || rawStr === '₹0' || rawStr === '0') return rawStr || '₹0';

  // Extract number (handles currency symbol, commas, and negative signs)
  const num = typeof val === 'number' ? val : parseFloat(rawStr.replace(/[^0-9.-]/g, ''));
  if (isNaN(num)) return rawStr;

  const absNum = Math.abs(num);
  // When amount is in Crores (>= 1,00,00,000)
  if (absNum >= 10000000) {
    const isNeg = num < 0;
    const crVal = (absNum / 10000000).toFixed(2).replace(/\.00$/, '');
    return `${isNeg ? '-' : ''}₹${crVal} Cr`;
  }

  return rawStr;
}

export const PropertyMasterRevenueStats: React.FC<PropertyMasterRevenueStatsProps> = ({
  performance,
}) => {
  const t = useTranslations('appartmentQC');

  return (
    <div className="grid grid-cols-4 gap-0.5 xl:gap-1 2xl:gap-1.5">
      {/* 1. Old Current Tax */}
      <div className="relative group p-0.5 xl:p-1 2xl:p-1.5 rounded-md border border-[#93c5fd] bg-[#eff6ff] hover:bg-blue-100/70 hover:border-blue-400 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between">
        <div className="flex items-center gap-0.5 xl:gap-1 text-blue-600 min-w-0">
          <FileText className="w-2 h-2 xl:w-2.5 xl:h-2.5 2xl:w-3 2xl:h-3 shrink-0" />
          <span
            className="text-[7px] sm:text-[7.5px] xl:text-[8.5px] 2xl:text-[10px] font-bold leading-none truncate"
            title={t('stats.oldCurrentTax') || 'Old Current Tax'}
          >
            {t('stats.oldCurrentTax') || 'Old Current Tax'}
          </span>
        </div>
        <span
          className="text-[8.5px] sm:text-[9.5px] xl:text-[10.5px] 2xl:text-xs font-black text-slate-900 leading-tight mt-0.5 truncate tracking-tight whitespace-nowrap"
          title={performance?.oldCurrentTax || '-'}
        >
          {formatCompactStatAmount(performance?.oldCurrentTax)}
        </span>

        {/* Expanded Tooltip on Hover */}
        <div className="absolute bottom-[calc(100%+8px)] left-0 z-[100] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none w-44 p-2 bg-slate-900 text-white rounded-lg shadow-2xl border border-slate-700 text-left flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-blue-400 pb-0.5 border-b border-slate-700/80">
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] font-bold">{t('stats.oldCurrentTax') || 'Old Current Tax'}</span>
          </div>
          <div className="text-xs font-bold text-white pt-0.5">
            {performance?.oldCurrentTax || '-'}
          </div>
          <div className="absolute top-full left-5 -mt-px border-4 border-transparent border-t-slate-900" />
        </div>
      </div>

      {/* 2. Current Tax */}
      <div className="relative group p-0.5 xl:p-1 2xl:p-1.5 rounded-md border border-[#93c5fd] bg-[#eff6ff] hover:bg-blue-100/70 hover:border-blue-400 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between">
        <div className="flex items-center gap-0.5 xl:gap-1 text-blue-600 min-w-0">
          <FileText className="w-2 h-2 xl:w-2.5 xl:h-2.5 2xl:w-3 2xl:h-3 shrink-0" />
          <span
            className="text-[7px] sm:text-[7.5px] xl:text-[8.5px] 2xl:text-[10px] font-bold leading-none truncate"
            title={t('stats.currentTax') || 'Current Tax'}
          >
            {t('stats.currentTax') || 'Current Tax'}
          </span>
        </div>
        <span
          className="text-[8.5px] sm:text-[9.5px] xl:text-[10.5px] 2xl:text-xs font-black text-slate-900 leading-tight mt-0.5 truncate tracking-tight whitespace-nowrap"
          title={performance?.currentTax || '-'}
        >
          {formatCompactStatAmount(performance?.currentTax)}
        </span>

        {/* Expanded Tooltip on Hover */}
        <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-[100] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none w-44 p-2 bg-slate-900 text-white rounded-lg shadow-2xl border border-slate-700 text-left flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-blue-400 pb-0.5 border-b border-slate-700/80">
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] font-bold">{t('stats.currentTax') || 'Current Tax'}</span>
          </div>
          <div className="text-xs font-bold text-white pt-0.5">
            {performance?.currentTax || '-'}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900" />
        </div>
      </div>

      {/* 3. Retro Tax */}
      <div className="relative group p-0.5 xl:p-1 2xl:p-1.5 rounded-md border border-[#93c5fd] bg-[#eff6ff] hover:bg-blue-100/70 hover:border-blue-400 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between">
        <div className="flex items-center gap-0.5 xl:gap-1 text-blue-600 min-w-0">
          <FileText className="w-2 h-2 xl:w-2.5 xl:h-2.5 2xl:w-3 2xl:h-3 shrink-0" />
          <span
            className="text-[7px] sm:text-[7.5px] xl:text-[8.5px] 2xl:text-[10px] font-bold leading-none truncate"
            title={t('stats.retroTax') || 'Retro Tax'}
          >
            {t('stats.retroTax') || 'Retro Tax'}
          </span>
        </div>
        <span
          className="text-[8.5px] sm:text-[9.5px] xl:text-[10.5px] 2xl:text-xs font-black text-slate-900 leading-tight mt-0.5 truncate tracking-tight whitespace-nowrap"
          title={performance?.retroTax || '-'}
        >
          {formatCompactStatAmount(performance?.retroTax)}
        </span>

        {/* Expanded Tooltip on Hover */}
        <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-[100] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none w-44 p-2 bg-slate-900 text-white rounded-lg shadow-2xl border border-slate-700 text-left flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-blue-400 pb-0.5 border-b border-slate-700/80">
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] font-bold">{t('stats.retroTaxTooltip') || 'Retro Tax (Arrears)'}</span>
          </div>
          <div className="text-xs font-bold text-white pt-0.5">
            {performance?.retroTax || '-'}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900" />
        </div>
      </div>

      {/* 4. Total Tax */}
      <div className="relative group p-0.5 xl:p-1 2xl:p-1.5 rounded-md border border-[#93c5fd] bg-[#eff6ff] hover:bg-blue-100/70 hover:border-blue-400 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between">
        <div className="flex items-center gap-0.5 xl:gap-1 text-blue-600 min-w-0">
          <FileText className="w-2 h-2 xl:w-2.5 xl:h-2.5 2xl:w-3 2xl:h-3 shrink-0" />
          <span
            className="text-[7px] sm:text-[7.5px] xl:text-[8.5px] 2xl:text-[10px] font-bold leading-none truncate"
            title={t('stats.totalTax') || 'Total Tax'}
          >
            {t('stats.totalTax') || 'Total Tax'}
          </span>
        </div>
        <span
          className="text-[8.5px] sm:text-[9.5px] xl:text-[10.5px] 2xl:text-xs font-black text-slate-900 leading-tight mt-0.5 truncate tracking-tight whitespace-nowrap"
          title={performance?.totalTax || '-'}
        >
          {formatCompactStatAmount(performance?.totalTax)}
        </span>

        {/* Expanded Tooltip on Hover */}
        <div className="absolute bottom-[calc(100%+8px)] right-0 z-[100] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none w-44 p-2 bg-slate-900 text-white rounded-lg shadow-2xl border border-slate-700 text-left flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-blue-400 pb-0.5 border-b border-slate-700/80">
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] font-bold">{t('stats.totalTax') || 'Total Tax'}</span>
          </div>
          <div className="text-xs font-bold text-white pt-0.5">
            {performance?.totalTax || '-'}
          </div>
          <div className="absolute top-full right-5 -mt-px border-4 border-transparent border-t-slate-900" />
        </div>
      </div>

      {/* 5. Current Demand */}
      <div className="relative group p-0.5 xl:p-1 2xl:p-1.5 rounded-md border border-[#fde047] bg-[#fffbeb] hover:bg-amber-100/70 hover:border-amber-400 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between">
        <div className="flex items-center gap-0.5 xl:gap-1 text-amber-700 min-w-0">
          <Clock className="w-2 h-2 xl:w-2.5 xl:h-2.5 2xl:w-3 2xl:h-3 shrink-0 text-amber-600" />
          <span
            className="text-[7px] sm:text-[7.5px] xl:text-[8.5px] 2xl:text-[10px] font-bold leading-none truncate"
            title={t('stats.currentDemand') || 'Current Demand'}
          >
            {t('stats.currentDemand') || 'Current Demand'}
          </span>
        </div>
        <span
          className="text-[8.5px] sm:text-[9.5px] xl:text-[10.5px] 2xl:text-xs font-black text-slate-900 leading-tight mt-0.5 truncate tracking-tight whitespace-nowrap"
          title={performance?.currentDemand || performance?.currentTax || '-'}
        >
          {formatCompactStatAmount(performance?.currentDemand || performance?.currentTax)}
        </span>

        {/* Expanded Tooltip on Hover */}
        <div className="absolute bottom-[calc(100%+8px)] left-0 z-[100] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none w-48 p-2 bg-slate-900 text-white rounded-lg shadow-2xl border border-slate-700 text-left flex flex-col gap-1">
          <div className="flex items-center justify-between pb-0.5 border-b border-slate-700/80">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] font-bold">{t('stats.currentDemand') || 'Current Demand'}</span>
            </div>
            {performance?.totalDemand ? (
              <span
                className="text-[8.5px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/50 px-1 py-0.2 rounded"
                title={`${t('stats.totalDemand') || 'Total Demand'}: ${performance.totalDemand}`}
              >
                {formatCompactStatAmount(performance.totalDemand)}
              </span>
            ) : null}
          </div>
          <div className="text-xs font-bold text-white pt-0.5">
            {performance?.currentDemand || performance?.currentTax || '-'}
          </div>
          <div className="absolute top-full left-5 -mt-px border-4 border-transparent border-t-slate-900" />
        </div>
      </div>

      {/* 6. Pending Demand */}
      <div className="relative group p-0.5 xl:p-1 2xl:p-1.5 rounded-md border border-[#fde047] bg-[#fffbeb] hover:bg-amber-100/70 hover:border-amber-400 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between">
        <div className="flex items-center gap-0.5 xl:gap-1 text-amber-700 min-w-0">
          <Clock className="w-2 h-2 xl:w-2.5 xl:h-2.5 2xl:w-3 2xl:h-3 shrink-0 text-amber-600" />
          <span
            className="text-[7px] sm:text-[7.5px] xl:text-[8.5px] 2xl:text-[10px] font-bold leading-none truncate"
            title={t('stats.pendingDemand') || 'Pending Demand'}
          >
            {t('stats.pendingDemand') || 'Pending Demand'}
          </span>
        </div>
        <span
          className="text-[8.5px] sm:text-[9.5px] xl:text-[10.5px] 2xl:text-xs font-black text-slate-900 leading-tight mt-0.5 truncate tracking-tight whitespace-nowrap"
          title={performance?.pendingDemand || performance?.retroTax || '-'}
        >
          {formatCompactStatAmount(performance?.pendingDemand || performance?.retroTax)}
        </span>

        {/* Expanded Tooltip on Hover */}
        <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-[100] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none w-48 p-2 bg-slate-900 text-white rounded-lg shadow-2xl border border-slate-700 text-left flex flex-col gap-1">
          <div className="flex items-center justify-between pb-0.5 border-b border-slate-700/80">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] font-bold">{t('stats.pendingDemand') || 'Pending Demand'}</span>
            </div>
            {performance?.totalDemand ? (
              <span
                className="text-[8.5px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/50 px-1 py-0.2 rounded"
                title={`${t('stats.totalDemand') || 'Total Demand'}: ${performance.totalDemand}`}
              >
                {formatCompactStatAmount(performance.totalDemand)}
              </span>
            ) : null}
          </div>
          <div className="text-xs font-bold text-white pt-0.5">
            {performance?.pendingDemand || performance?.retroTax || '-'}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900" />
        </div>
      </div>

      {/* 7. Collection */}
      <div className="relative group p-0.5 xl:p-1 2xl:p-1.5 rounded-md border border-[#86efac] bg-[#f0fdf4] hover:bg-emerald-100/70 hover:border-emerald-400 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between">
        <div className="flex items-center gap-0.5 xl:gap-1 text-emerald-700 min-w-0">
          <CreditCard className="w-2 h-2 xl:w-2.5 xl:h-2.5 2xl:w-3 2xl:h-3 shrink-0" />
          <span
            className="text-[7px] sm:text-[7.5px] xl:text-[8.5px] 2xl:text-[10px] font-bold leading-none truncate"
            title={t('stats.collection') || 'Collection'}
          >
            {t('stats.collection') || 'Collection'}
          </span>
        </div>
        <span
          className="text-[8.5px] sm:text-[9.5px] xl:text-[10.5px] 2xl:text-xs font-black text-slate-900 leading-tight mt-0.5 truncate tracking-tight whitespace-nowrap"
          title={performance?.collectionAmount || '-'}
        >
          {formatCompactStatAmount(performance?.collectionAmount)}
        </span>

        {/* Expanded Tooltip on Hover */}
        <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-[100] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none w-48 p-2 bg-slate-900 text-white rounded-lg shadow-2xl border border-slate-700 text-left flex flex-col gap-1">
          <div className="flex items-center justify-between pb-0.5 border-b border-slate-700/80">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CreditCard className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] font-bold">{t('stats.collection') || 'Collection'}</span>
            </div>
            {performance?.collectionPercent != null && performance.collectionPercent !== '0%' ? (
              <span className="text-[8.5px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/50 px-1 py-0.2 rounded">
                {performance.collectionPercent}
              </span>
            ) : null}
          </div>
          <div className="text-xs font-bold text-white pt-0.5">
            {performance?.collectionAmount || '-'}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900" />
        </div>
      </div>

      {/* 8. Total Balance */}
      <div className="relative group p-0.5 xl:p-1 2xl:p-1.5 rounded-md border border-[#fda4af] bg-[#fff1f2] hover:bg-rose-100/70 hover:border-rose-400 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between">
        <div className="flex items-center gap-0.5 xl:gap-1 text-rose-600 min-w-0">
          <AlertCircle className="w-2 h-2 xl:w-2.5 xl:h-2.5 2xl:w-3 2xl:h-3 shrink-0" />
          <span
            className="text-[7px] sm:text-[7.5px] xl:text-[8.5px] 2xl:text-[10px] font-bold leading-none truncate"
            title={t('stats.totalBalance') || 'Total Balance'}
          >
            {t('stats.totalBalance') || 'Total Balance'}
          </span>
        </div>
        <span
          className="text-[8.5px] sm:text-[9.5px] xl:text-[10.5px] 2xl:text-xs font-black text-rose-600 leading-tight mt-0.5 truncate tracking-tight whitespace-nowrap"
          title={performance?.totalBalance || '-'}
        >
          {formatCompactStatAmount(performance?.totalBalance)}
        </span>

        {/* Expanded Tooltip on Hover */}
        <div className="absolute bottom-[calc(100%+8px)] right-0 z-[100] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none w-44 p-2 bg-slate-900 text-white rounded-lg shadow-2xl border border-slate-700 text-left flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-rose-400 pb-0.5 border-b border-slate-700/80">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] font-bold">{t('stats.totalBalance') || 'Total Balance'}</span>
          </div>
          <div className="text-xs font-bold text-rose-300 pt-0.5">
            {performance?.totalBalance || '-'}
          </div>
          <div className="absolute top-full right-5 -mt-px border-4 border-transparent border-t-slate-900" />
        </div>
      </div>
    </div>
  );
};
