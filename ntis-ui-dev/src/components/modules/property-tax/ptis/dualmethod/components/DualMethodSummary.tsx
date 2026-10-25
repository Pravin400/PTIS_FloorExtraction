'use client';

import React from 'react';
import { TaxBadge } from '@/components/modules/property-tax/ptis/shared/TaxBadge';
import { useTranslations } from 'next-intl';

interface DualMethodSummaryProps {
  oldData: {
    rv: number | string;
    tax: number | string | null;
  };
  rateableData: {
    totalRv: number | null;
    totalTax: number | null;
  };
  capitalData: {
    totalCv: number | null;
    totalTax: number | null;
  };
  retainTotalTax: number | null;
  locale: string;
}

export const DualMethodSummary: React.FC<DualMethodSummaryProps> = ({
  oldData,
  rateableData,
  capitalData,
  retainTotalTax,
  locale: _locale,
}) => {
  const t = useTranslations('ptis.modules.DualMethod');
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white p-1.5 shadow-sm">
      <h3 className="px-2 text-sm font-semibold text-blue-950">{t('title')}</h3>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <TaxBadge label={t('badges.oldRv')} value={oldData.rv} color="outline" />
        <TaxBadge label={t('badges.oldTotalTax')} value={oldData.tax} color="outline" />
        <TaxBadge label={t('badges.totalRv')} value={rateableData.totalRv} color="purple" />
        <TaxBadge label={t('badges.rvTotalTax')} value={rateableData.totalTax} color="purple" />
        <TaxBadge label={t('badges.totalCv')} value={capitalData.totalCv} color="teal" />
        <TaxBadge label={t('badges.cvTotalTax')} value={capitalData.totalTax} color="teal" />
        <TaxBadge label={t('badges.retainTotalTax')} value={retainTotalTax} color="purple" />
      </div>
    </div>
  );
};
