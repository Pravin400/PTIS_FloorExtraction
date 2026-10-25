'use client';
import { useTranslations } from 'next-intl';
import React from 'react';
import { Home } from 'lucide-react';
import { SectionCard, InfoField } from '../asset-detail-view/SectionCard';
import { Badge } from '@/components/common';
import type { SubAssetInfoPanelsProps } from '@/types/asset/municipal-Asset/sub-asset-detail-ui.types';

export function SubAssetBasicDetailsSection({ data }: SubAssetInfoPanelsProps): React.ReactElement {
  const t = useTranslations('subAssetDetail');


  return (
    <SectionCard title={t('subAssetBasicDetails')} titleIcon={<Home className="w-3.5 h-3.5 text-white" />}
      iconBgClass="bg-blue-500">
      <div className="flex flex-col">
        <InfoField label={t('subAssetId')} value={data.subAssetId} />
        <InfoField label={t('wardPropertyNoLabel') || "Ward No. / Property No."} value={`${data.wardNo || '-'} / ${data.propertyNo || '-'}`} />
        <InfoField label={`${t('shopNo')} / ${t('mpmsNoLabel') || 'MPMS No.'}`} value={`${data.subAssetShopNo || '-'} / ${data.mpmsNo || '-'}`} />
        <InfoField label={t('floor')} value={data.floor} />
        <InfoField label={t('usage')} value={data.usage} />
        <InfoField label={t('shopName')} value={data.shopName} />
        <InfoField label={t('occupancyStatus')} value={
          <Badge variant={['occupied', 'rented'].includes((data.occupancyStatus || '').toLowerCase()) ? 'success' : (data.occupancyStatus || '').toLowerCase() === 'vacant' ? 'destructive' : 'secondary'} size="sm">
            {data.occupancyStatus || 'Unknown'}
          </Badge>
        } />
        <InfoField label={t('currentOccupier')} value={<span className="text-blue-600">{data.currentOccupier}</span>} />
        <InfoField label={t('authorisedLesseeName')} value={<span className="text-blue-600">{data.authorisedLesseeName}</span>} />
      </div>
    </SectionCard>
  );
}

