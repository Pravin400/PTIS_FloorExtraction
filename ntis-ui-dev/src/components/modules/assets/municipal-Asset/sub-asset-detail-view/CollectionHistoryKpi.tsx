import React from 'react';
import { useTranslations } from 'next-intl';

export interface CollectionHistoryKpiProps {
  totals?: Record<string, number> | null;
  rentFrequency?: string;
}

export function CollectionHistoryKpi({ totals, rentFrequency }: CollectionHistoryKpiProps): React.ReactElement | null {
  const t = useTranslations('subAssetDetail');
  
  if (!totals) return null;

  return (
    <div className="grid grid-cols-4 gap-3">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-lg p-3 shadow-sm">
        <div className="text-[10px] font-bold text-blue-600/80 uppercase tracking-wide">{rentFrequency?.toLowerCase() === 'yearly' ? t('yearlyRentLabel') : t('monthlyRentLabel')}</div>
        <div className="text-xl font-black text-blue-700 mt-1">{t('rupeeSymbol')} {(totals.monthlyRent ?? totals.MonthlyRent)?.toLocaleString() || '0'}</div>
      </div>
      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200 rounded-lg p-3 shadow-sm">
        <div className="text-[10px] font-bold text-indigo-600/80 uppercase tracking-wide">{t('annualDemandLabel')}</div>
        <div className="text-xl font-black text-indigo-700 mt-1">{t('rupeeSymbol')} {(totals.totalDemand ?? totals.TotalDemand)?.toLocaleString() || '0'}</div>
      </div>
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-lg p-3 shadow-sm">
        <div className="text-[10px] font-bold text-emerald-600/80 uppercase tracking-wide">{t('totalCollectionLabel')}</div>
        <div className="text-xl font-black text-emerald-700 mt-1">{t('rupeeSymbol')} {(totals.collection ?? totals.Collection)?.toLocaleString() || '0'}</div>
      </div>
      <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-200 rounded-lg p-3 shadow-sm">
        <div className="text-[10px] font-bold text-rose-600/80 uppercase tracking-wide">{t('arrearsBalanceLabel')}</div>
        <div className="text-xl font-black text-rose-700 mt-1">{t('rupeeSymbol')} {(totals.arrears ?? totals.Arrears)?.toLocaleString() || '0'}</div>
      </div>
    </div>
  );
}
