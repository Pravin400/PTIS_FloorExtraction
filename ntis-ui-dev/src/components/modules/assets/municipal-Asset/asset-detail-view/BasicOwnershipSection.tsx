import type { BasicOwnershipSectionProps } from '@/types/asset/municipal-Asset/asset-detail.types';
import React from 'react';
import { getTranslations } from 'next-intl/server';
import { SectionCard, InfoField } from './SectionCard';
import { Building2 } from 'lucide-react';
import { Badge } from '@/components/common';

export async function BasicOwnershipSection({ data, locale }: BasicOwnershipSectionProps): Promise<React.ReactElement> {
  const t = await getTranslations({ locale, namespace: 'asset-detail' });
  return (
    <SectionCard
      title={t('basicOwnership')}
      titleIcon={<Building2 className="w-3.5 h-3.5 text-white" />} iconBgClass="bg-blue-500"
    >
      <div className="flex flex-col">
        <InfoField label={`${t('wardNo')} / ${t('propertyNo')}`} value={data.wardNo === '-' && data.propertyNo === '-' ? '-' : `${data.wardNo} / ${data.propertyNo}`} />
        <InfoField label={t('mpmsNo') || 'MPMS No.'} value={data.mpmsNo} />
        <InfoField label={t('moujaSubzone')} value={data.moujaSubzone} />
        <InfoField label={t('upicId')} value={data.upicId} />
        <InfoField label={t('ctsNo')} value={data.ctsNo} />
        <InfoField label={t('ownership')} value={data.ownership} />
        <InfoField
          label={t('ownershipDept')}
          value={<Badge variant="success" size="sm">{data.department}</Badge>}
        />
      </div>
    </SectionCard>
  );
}
