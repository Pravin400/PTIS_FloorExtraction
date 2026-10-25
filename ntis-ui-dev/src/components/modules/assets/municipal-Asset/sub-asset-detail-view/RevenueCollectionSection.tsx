'use client';
import { useTranslations } from 'next-intl';
import React from 'react';
import type { RevenueCollectionSectionProps } from '@/types/asset/municipal-Asset/sub-asset-detail-ui.types';
import { cn } from '@/lib/utils/cn';

const CurrencyIcon = ({ className, symbol }: { className?: string, symbol: string }) => (
  <span className={cn('font-black text-[1.5em] -mt-[2px]', className)}>{symbol}</span>
);

const SolidCalendarIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z" />
    <rect x="7" y="12" width="2.5" height="2.5" />
    <rect x="11.5" y="12" width="2.5" height="2.5" />
    <rect x="16" y="12" width="2.5" height="2.5" />
    <rect x="7" y="16.5" width="2.5" height="2.5" />
    <rect x="11.5" y="16.5" width="2.5" height="2.5" />
    <rect x="16" y="16.5" width="2.5" height="2.5" />
  </svg>
);

const HandCoinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    {/* Coin */}
    <circle cx="15" cy="8" r="4.5" />
    <path d="M14 6v4h2V6h-2z" fill="#ecfdf5" /> {/* Coin detail */}
    {/* Hand receiving */}
    <path d="M21.5 15.5L16 13c-1-.5-2.5 0-2.5 0L10 16H4v5h15.5c1.4 0 2.5-1.1 2.5-2.5v-1.5c0-1.4-1.1-1.5-1.5-1.5z" />
  </svg>
);

function CollectionRing({ value = 0 }: { value?: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative w-[42px] h-[42px] flex items-center justify-center bg-white rounded-full shadow-sm">
      <svg viewBox="0 0 42 42" className="absolute top-0 left-0 w-full h-full -rotate-90">
        <circle cx="21" cy="21" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="4" />
        <circle cx="21" cy="21" r={radius} fill="none" stroke="#10b981" strokeWidth="4"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="text-[10px] font-black text-emerald-700 relative z-10">{value}%</span>
    </div>
  );
}

function KpiBlock({ icon, label, value, bgClass, borderClass, iconColorClass, valueClass }: {
  icon: React.ReactNode; label: string; value: string; bgClass: string; borderClass: string; iconColorClass: string; valueClass: string;
}) {
  return (
    <div className={cn('flex items-center gap-3 flex-1 px-3 py-2.5 rounded-xl border shadow-sm', bgClass, borderClass)}>
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-white shadow-sm', iconColorClass)}>
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[9.5px] font-bold text-slate-600 uppercase tracking-wider leading-tight mb-0.5">{label}</span>
        <span className={cn('text-[16px] font-black leading-tight', valueClass)}>{value}</span>
      </div>
    </div>
  );
}

export function RevenueCollectionSection({ data }: RevenueCollectionSectionProps): React.ReactElement {
  const t = useTranslations('subAssetDetail');

  const fmt = (n?: number) => typeof n === 'number' ? `${t('rupeeSymbol')} ${n.toLocaleString('en-IN')}` : '-';

  const isShortTerm = (data.leaseDurationMonths || 12) < 12;
  const demandLabel = isShortTerm ? t('totalLeaseDemand') : t('annualDemandLabel');

  return (
    <div className="flex items-center gap-2 w-full">
      <KpiBlock
        icon={<CurrencyIcon symbol={t('rupeeSymbol')} />}
        label={data.rentFrequency?.toLowerCase() === 'yearly' ? t('yearlyRentLabel') : t('monthlyRentLabel')} value={fmt(data.monthlyRent)}
        bgClass="bg-blue-50" borderClass="border-blue-100" iconColorClass="text-blue-600" valueClass="text-blue-700"
      />
      <KpiBlock
        icon={<SolidCalendarIcon className="w-5 h-5" />}
        label={demandLabel} value={fmt(data.annualDemand)}
        bgClass="bg-purple-50" borderClass="border-purple-100" iconColorClass="text-purple-600" valueClass="text-purple-700"
      />
      <KpiBlock
        icon={<HandCoinIcon className="w-6 h-6" />}
        label={t('totalCollectionLabel')} value={fmt(data.totalCollection)}
        bgClass="bg-emerald-50" borderClass="border-emerald-100" iconColorClass="text-emerald-500" valueClass="text-emerald-700"
      />
      {/* Collection Efficiency with ring */}
      <div className="flex items-center gap-3 flex-1 px-3 py-2.5 rounded-xl border border-emerald-100 bg-emerald-50 shadow-sm">
        <CollectionRing value={data.collectionEfficiency} />
        <div className="flex flex-col min-w-0">
          <span className="text-[9.5px] font-bold text-slate-600 uppercase tracking-wider leading-tight mb-0.5">{t('collectionEfficiencyLabel')}</span>
          <span className="text-[16px] font-black text-emerald-700 leading-tight">{data.collectionEfficiency || 0}%</span>
        </div>
      </div>
      <KpiBlock
        icon={<CurrencyIcon symbol={t('rupeeSymbol')} />}
        label={t('arrearsBalanceLabel')} value={fmt(data.arrearsBalance)}
        bgClass="bg-orange-50" borderClass="border-orange-100" iconColorClass="text-orange-500" valueClass="text-orange-700"
      />
    </div>
  );
}


