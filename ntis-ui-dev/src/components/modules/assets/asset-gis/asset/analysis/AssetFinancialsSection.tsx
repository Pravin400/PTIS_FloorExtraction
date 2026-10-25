'use client';

import { useTranslations } from 'next-intl';
import type { AssetFinancialsSectionProps } from '@/types/asset-gis.types';

export function AssetFinancialsSection({
  capitalValueVal,
  annualRevenueVal,
  monthlyRentVal,
  isMainView = true,
}: AssetFinancialsSectionProps) {
  const t = useTranslations('assetGis');

  return (
    <div className="p-2 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200/80 shadow-inner text-[11px] grid grid-cols-2 gap-2 text-center">
      <div>
        <span className="text-slate-500 font-extrabold uppercase text-[9.5px] block tracking-wider mb-0.5">
          {t('details.capitalValue') || 'CAPITAL VALUE'}
        </span>
        <span className="font-black text-blue-600 text-sm md:text-base font-mono">
          {Number.isFinite(capitalValueVal) && capitalValueVal > 0
            ? `₹${Number(capitalValueVal).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
            : '₹0.00'}
        </span>
      </div>
      <div>
        <span className="text-slate-500 font-extrabold uppercase text-[9.5px] block tracking-wider mb-0.5">
          {!isMainView && monthlyRentVal
            ? (t('details.monthlyRent') || 'MONTHLY RENT')
            : (t('details.annualRevenue') || 'ANNUAL REVENUE')}
        </span>
        <span className="font-black text-emerald-600 text-sm md:text-base font-mono">
          {!isMainView && monthlyRentVal
            ? `${monthlyRentVal} / mo`
            : (Number.isFinite(annualRevenueVal) && annualRevenueVal > 0
              ? `₹${Number(annualRevenueVal).toLocaleString('en-IN', { maximumFractionDigits: 2 })} / yr`
              : '₹0.00 / yr')}
        </span>
      </div>
    </div>
  );
}
