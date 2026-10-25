import type { AreaStructureSectionProps } from '@/types/asset/municipal-Asset/asset-detail.types';
import React from 'react';
import { getTranslations } from 'next-intl/server';
import { SectionCard, InfoField } from './SectionCard';
import { Layers } from 'lucide-react';
import { Badge } from '@/components/common';

export async function AreaStructureSection({ data, locale }: AreaStructureSectionProps): Promise<React.ReactElement> {
  const t = await getTranslations({ locale, namespace: 'asset-detail' });
  return (
    <SectionCard
      title={t('areaStructure')}
      titleIcon={<Layers className="w-3.5 h-3.5 text-white" />} iconBgClass="bg-emerald-500"
    >
      <div className="flex flex-col">
        <InfoField label={t('plotNo')} value={data.plotNo} />
        <InfoField label={t('plotArea')} value={data.plotArea !== '-' ? `${data.plotArea} ${t('unitSqm')}` : '-'} />
        <InfoField label={t('builtUpArea')} value={data.builtUpArea !== '-' ? `${data.builtUpArea} ${t('unitSqm')}` : '-'} />
        <InfoField label={t('carpetArea')} value={<Badge variant="success" size="sm">{data.carpetArea !== '-' ? `${data.carpetArea} ${t('unitSqm')}` : '-'}</Badge>} />
        <InfoField label={t('totalFloors')} value={data.totalFloors} />
        <InfoField label={t('yearOfConstruction')} value={data.yearOfConstruction} />
        <InfoField label={t('constructionType')} value={data.constructionType} />
      </div>
    </SectionCard>
  );
}
