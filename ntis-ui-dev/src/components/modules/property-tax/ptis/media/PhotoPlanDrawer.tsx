'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { Images } from 'lucide-react';
import { Drawer } from '@/components/common';
import { PhotoPlanDrawerBody } from './PhotoPlanDrawerBody';
import type { PhotoCategory } from './PhotoPlanSidebar';
import type { WaybackRelease } from '@/lib/api/wayback.service';
import type { PropertyPhotoDto } from '@/types/photoplan.types';

interface PhotoPlanDrawerProps {
  open: boolean;
  onClose: () => void;
  categories: PhotoCategory[];
  onCategoriesChange: (categories: PhotoCategory[]) => void;
  onPhotosChange?: (photos: PropertyPhotoDto[]) => void;
  wardNo?: string;
  propertyNo?: string;
  partitionNo?: string;
  wingName?: string;
  wingDetailId?: number | null;
  societyDetailId?: number | null;
  initialCategoryIndex?: number;
  propertyId?: number;
  fullyLoadedIds: Set<number>;
  onFullyLoadedIdsChange: (ids: Set<number>) => void;
  initialLatitude?: number;
  initialLongitude?: number;
  initialWaybackReleases?: WaybackRelease[];
  onDrawPlan?: (e: React.MouseEvent) => void;
  onSyncPlan?: (e: React.MouseEvent) => void;
  isSyncingPlan?: boolean;
  onRequestTypeModal?: () => void;
  isMainProperty?: boolean;
  zIndex?: number;
}

export function PhotoPlanDrawer({
  open,
  onClose,
  categories,
  onCategoriesChange,
  onPhotosChange,
  wardNo = '',
  propertyNo = '',
  partitionNo = '',
  wingName = '',
  wingDetailId,
  societyDetailId,
  initialCategoryIndex = 0,
  propertyId,
  fullyLoadedIds,
  onFullyLoadedIdsChange,
  initialLatitude,
  initialLongitude,
  initialWaybackReleases,
  onDrawPlan,
  onSyncPlan,
  isSyncingPlan = false,
  onRequestTypeModal,
  isMainProperty = false,
  zIndex = 130,
}: PhotoPlanDrawerProps): React.ReactNode {
  const t = useTranslations('ptis');

  React.useEffect(() => {
    if (open) {
      const el = document.querySelector('.photo-plan-drawer-content')?.closest('.drawer-instance');
      const backdrop = el?.previousElementSibling as HTMLElement;
      if (backdrop) {
        backdrop.style.backgroundColor = 'transparent';
        backdrop.style.backdropFilter = 'none';
      }
    }
  }, [open]);

  if (!open || typeof window === 'undefined' || typeof document === 'undefined') return null;

  const subtitleText = [
    wardNo && `${t('media.wardNo') || 'Ward'}: ${wardNo}`,
    propertyNo && `${t('media.propertyNo') || 'Prop'}: ${propertyNo}`,
    partitionNo && `${t('media.partitionNo') || 'Partition'}: ${partitionNo}`,
    wingName && `${t('fields.wing') || 'Wing'}: ${wingName}`,
  ]
    .filter(Boolean)
    .join(' | ');

  const titleNode = (
    <div className="flex items-center gap-2">
      <Images className="w-5 h-5 text-blue-600" />
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-blue-900 leading-tight">
          {t('media.additionalImages') || 'Additional Images'}
        </span>
        <span className="text-xs font-bold text-blue-500">{subtitleText}</span>
      </div>
    </div>
  );

  return createPortal(
    <Drawer
      open={open}
      onClose={onClose}
      title={titleNode}
      width="xl"
      zIndex={zIndex}
      bodyClassName="overflow-hidden flex flex-col flex-1 min-h-0 h-full"
    >
      <PhotoPlanDrawerBody
        categories={categories}
        onCategoriesChange={onCategoriesChange}
        onPhotosChange={onPhotosChange}
        initialCategoryIndex={initialCategoryIndex}
        propertyId={propertyId}
        wingDetailId={wingDetailId}
        societyDetailId={societyDetailId}
        wingName={wingName}
        fullyLoadedIds={fullyLoadedIds}
        onFullyLoadedIdsChange={onFullyLoadedIdsChange}
        initialLatitude={initialLatitude}
        initialLongitude={initialLongitude}
        initialWaybackReleases={initialWaybackReleases}
        onDrawPlan={onDrawPlan}
        onSyncPlan={onSyncPlan}
        isSyncingPlan={isSyncingPlan}
        onRequestTypeModal={onRequestTypeModal}
        wardNo={wardNo}
        propertyNo={propertyNo}
        partitionNo={partitionNo}
        isMainProperty={isMainProperty}
      />
    </Drawer>,
    document.body
  );
}
