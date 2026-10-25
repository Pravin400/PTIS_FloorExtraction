'use client';
import { useTranslations } from 'next-intl';
import React from 'react';
import type { SubAssetRightColumnSectionsProps } from '@/types/asset/municipal-Asset/sub-asset-detail-ui.types';
import type { AssetDetailData } from '@/types/asset/municipal-Asset/asset-detail.types';
import { AssetPhotosSection } from '../asset-detail-view/AssetPhotosSection';
import { AssetPhotoPlanSection } from '../asset-detail-view/AssetPhotoPlanSection';
import { GisLocationSection } from '../asset-detail-view/AssetGisLocation';

export function SubAssetPhotosSection({ data }: SubAssetRightColumnSectionsProps): React.ReactElement {
  const t = useTranslations('subAssetDetail');

  // Map sub-asset data to the structure expected by the parent asset component
  const assetData = {
    photos: data.subAssetPhotos,
  } as unknown as AssetDetailData;
  const assetCopy: React.ComponentProps<typeof AssetPhotosSection>['copy'] = {
    assetPhotos: t('subAssetPhotos'),
    viewAll: t('viewAll'),
  };

  return <AssetPhotosSection data={assetData} copy={assetCopy} />;
}

export function UnitFloorPlanSection({ data }: SubAssetRightColumnSectionsProps): React.ReactElement {
  const t = useTranslations('subAssetDetail');

  const assetCopy: React.ComponentProps<typeof AssetPhotoPlanSection>['copy'] = {
    assetPhotoPlan: t('unitFloorPlan'),
    viewFullPlan: t('viewFullPlan'),
  };

  const assetData = {
    ...data,
    photos: data.subAssetPhotos,
  } as unknown as AssetDetailData;

  return <AssetPhotoPlanSection data={assetData} copy={assetCopy} />;
}

export function SubAssetGisSection({ data }: SubAssetRightColumnSectionsProps): React.ReactElement {
  const assetData = {
    assetId: data.assetId as string,
    latitude: data.latitude,
    longitude: data.longitude,
    upicId: data.upicId as string,
  } as unknown as AssetDetailData;

  return <GisLocationSection data={assetData} />;
}


