import type { LeaseRentSectionProps } from '@/types/asset/municipal-Asset/asset-detail.types';
import React from 'react';
import { getTranslations } from 'next-intl/server';
import { SectionCard, InfoField } from './SectionCard';
import { FileText } from 'lucide-react';
import { Badge } from '@/components/common';

export async function LeaseRentSection({ data, locale }: LeaseRentSectionProps): Promise<React.ReactElement> {
  const t = await getTranslations({ locale, namespace: 'asset-detail' });
  return (
    <SectionCard
      title={t('leaseRent')}
      titleIcon={<FileText className="w-3.5 h-3.5 text-white" />} iconBgClass="bg-orange-500"
    >
      <div className="flex flex-col">
        <InfoField label={t('annualRentTotal')} value={data.annualRentTotal} />
        <InfoField label={t('monthlyRentTotal')} value={data.monthlyRentTotal} />
        <InfoField label={t('avgRentPerShop')} value={data.avgRentPerShop} />
        <InfoField
          label={t('rentCollection')}
          value={data.rentCollection && data.rentCollection !== '-' ? <Badge variant="success" size="sm">{data.rentCollection}</Badge> : '-'}
        />
        <InfoField
          label={t('arrearsLabel')}
          value={data.arrears && data.arrears !== '-' ? <Badge variant="destructive" size="sm">{data.arrears}</Badge> : '-'}
        />
        <InfoField
          label={t('totalAgreements')}
          value={data.totalAgreements && data.totalAgreements !== '-' ? <Badge variant="success" size="sm">{data.totalAgreements}</Badge> : '-'}
        />
      </div>
    </SectionCard>
  );
}
