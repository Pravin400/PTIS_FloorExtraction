import type { InchargeAndUsageSectionProps } from '@/types/asset/municipal-Asset/asset-detail.types';
import React from 'react';
import { getTranslations } from 'next-intl/server';
import { SectionCard, InfoField } from './SectionCard';
import { ShoppingBag } from 'lucide-react';

export async function InchargeAndUsageSection({ data, locale }: InchargeAndUsageSectionProps): Promise<React.ReactElement> {
  const t = await getTranslations({ locale, namespace: 'asset-detail' });
  return (
    <SectionCard
      title={t('useDetails')}
      titleIcon={<ShoppingBag className="w-3.5 h-3.5 text-white" />} iconBgClass="bg-purple-500"
    >
      <div className="flex flex-col">
        <InfoField label={t('inCharge') || 'Incharge'} value={data.inCharge} />
        <InfoField label={t('inChargeDesignation') || 'Incharge Designation'} value={data.inChargeDesignation} />
        <InfoField label={t('inChargeContactNo') || 'Contact No.'} value={data.inChargeContactNo} />
        <InfoField label={t('inChargeEmail') || 'Email'} value={data.inChargeEmail} />
        <InfoField label={t('assetType')} value={data.assetUsageType} />
        <InfoField label={t('noOfUnits')} value={data.noOfUnits} />
      </div>
    </SectionCard>
  );
}
