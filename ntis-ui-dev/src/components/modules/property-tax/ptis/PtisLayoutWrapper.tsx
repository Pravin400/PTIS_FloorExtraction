'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { PropertyMediaPanel } from './media';
import { MediaPanelToggle } from './MediaPanelToggle';
import { MediaPanelProvider, useMediaPanel } from '@/hooks/ptis/photoplan/useMediaPanelVisibility';
import { usePropertyPhotosQuery } from '@/hooks/ptis/photoplan/usePropertyPhotosQuery';
import type { PropertyPhotoTypeWithStatusDto, PropertyPhotoDto } from '@/types/photoplan.types';
import type { WaybackRelease } from '@/lib/api/wayback.service';
import type { WingWiseWingDetails } from '@/types/property-tax/apartment';

interface PtisLayoutWrapperProps {
  children: React.ReactNode;
  wardNo?: string;
  propertyNo?: string;
  partitionNo?: string;
  propertyHolderName?: string;
  propertyHolderNameMarathi?: string;
  isQCApproved?: boolean;
  propertyId?: number;
  isMainProperty?: boolean;
  categoryId?: number | null;
  propertyTypeId?: number | null;
  propertyDescription?: string;
  type?: string | number | null;
  societyDetailId?: number | null;
  initialPhotoSlots?: PropertyPhotoTypeWithStatusDto[];
  initialPhotos?: PropertyPhotoDto[];
  initialLatitude?: number;
  initialLongitude?: number;
  initialWaybackReleases?: WaybackRelease[];
  initialVisible?: boolean;
  wings?: WingWiseWingDetails[];
  societyBuildingPhotoGuid?: string;
  societyPhotoUrl?: string;
  societyLatitude?: number;
  societyLongitude?: number;
}

import { useWaybackReleases } from '@/hooks/ptis/useWaybackReleases';

function PtisLayoutWrapperContent({
  children,
  wardNo,
  propertyNo,
  partitionNo,
  propertyHolderName,
  propertyHolderNameMarathi,
  isQCApproved,
  propertyId,
  isMainProperty,
  categoryId,
  propertyTypeId,
  propertyDescription,
  type,
  societyDetailId,
  initialPhotoSlots = [],
  initialPhotos = [],
  initialLatitude,
  initialLongitude,
  initialWaybackReleases = [],
  wings = [],
  societyBuildingPhotoGuid,
  societyPhotoUrl,
  societyLatitude,
  societyLongitude,
}: PtisLayoutWrapperProps) {
  const { isPanelVisible } = useMediaPanel();
  const searchParams = useSearchParams();
  const isDrawerOpen = false;
  const searchWardNo = searchParams?.get('wardNo') || searchParams?.get('wardno');
  const searchPropertyNo = (searchParams?.get('propertyNo') || searchParams?.get('propertyno'))?.replace(/^-(?=\d)/, '');
  const searchPartitionNo = searchParams?.get('partitionNo') || searchParams?.get('partitionno');
  const rawSearchPropertyId = searchParams?.get('propertyId') || searchParams?.get('propertyid');
  const searchPropertyIdStr = rawSearchPropertyId ? rawSearchPropertyId.replace(/^[^\d]+/, '') : null;
  const searchSocietyDetailId = (
    searchParams?.get('societyDetailId') ||
    searchParams?.get('societydetailid') ||
    searchParams?.get('societyId') ||
    searchParams?.get('societyid')
  )?.replace(/^[^\d]+/, '');
  const searchWingDetailId = (
    searchParams?.get('wingDetailId') ||
    searchParams?.get('wingdetailid') ||
    searchParams?.get('wingId') ||
    searchParams?.get('wingid')
  )?.replace(/^[^\d]+/, '');
  const searchWingName = (
    searchParams?.get('wingName') ||
    searchParams?.get('wingname') ||
    searchParams?.get('wingNo') ||
    searchParams?.get('wingno')
  )?.replace(/^-(?=[A-Za-z0-9])/, '');

  const urlPropertyId = searchPropertyIdStr && Number(searchPropertyIdStr) > 0 ? Number(searchPropertyIdStr) : undefined;
  const effectivePropertyId = (urlPropertyId && urlPropertyId > 0 ? urlPropertyId : undefined) || (propertyId && propertyId > 0 ? propertyId : undefined);





  const mediaScopeKey = `${effectivePropertyId ?? 'none'}:${searchWardNo ?? wardNo ?? ''}:${searchPropertyNo ?? propertyNo ?? ''}:${searchPartitionNo ?? partitionNo ?? ''}:${searchSocietyDetailId ?? societyDetailId ?? ''}:${searchWingDetailId ?? ''}:${searchWingName ?? ''}`;

  const { loading: mediaLoading, photoSlots, photos, setPhotoSlots, setPhotos } = usePropertyPhotosQuery(
    effectivePropertyId,
    isPanelVisible,
    isDrawerOpen,
    initialPhotoSlots,
    initialPhotos,
    isMainProperty ? societyDetailId : undefined,
    societyBuildingPhotoGuid,
    societyPhotoUrl,
    isMainProperty ? undefined : null,
    isMainProperty
  );
  const { waybackReleases } = useWaybackReleases(isPanelVisible || isDrawerOpen);

  return (
    <div className="flex flex-col lg:flex-row gap-2 lg:gap-3 w-full items-start overflow-x-clip relative">
      <MediaPanelToggle />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 w-full transition-all duration-500 ease-in-out">
        {children}
      </div>

      {/* Sidebar Container with smooth width & opacity transition */}
      <div
        className={`transition-all duration-500 ease-in-out z-30 lg:sticky lg:top-[80px] lg:self-start lg:h-[calc(100vh-152px)] lg:shrink-0 ${
          isPanelVisible
            ? 'w-full lg:w-[208px] opacity-100 translate-x-0'
            : 'w-0 lg:w-0 opacity-0 lg:translate-x-full pointer-events-none overflow-hidden'
        }`}
      >
        {/* Inner wrapper to lock the width and prevent child content squeezing during transition */}
        <div className="w-full lg:w-[208px] lg:h-full flex flex-col">
          <PropertyMediaPanel
            key={mediaScopeKey}
            wardNo={searchWardNo || wardNo}
            propertyNo={searchPropertyNo || propertyNo}
            partitionNo={searchPartitionNo ?? partitionNo}
            propertyHolderName={propertyHolderName}
            propertyHolderNameMarathi={propertyHolderNameMarathi}
            isQCApproved={isQCApproved}
            propertyId={effectivePropertyId}
            councilName="THANE_survey"
            isMainProperty={isMainProperty}
            categoryId={categoryId}
            propertyTypeId={propertyTypeId}
            propertyDescription={propertyDescription}
            type={type}
            societyDetailId={societyDetailId}
            initialPhotoSlots={photoSlots.length > 0 ? photoSlots : initialPhotoSlots}
            initialPhotos={photos.length > 0 ? photos : initialPhotos}
            loading={mediaLoading}
            initialLatitude={initialLatitude}
            initialLongitude={initialLongitude}
            initialWaybackReleases={waybackReleases.length > 0 ? waybackReleases : initialWaybackReleases}
            onPhotosChange={setPhotos}
            onPhotoSlotsChange={setPhotoSlots}
            wings={wings}
            societyBuildingPhotoGuid={societyBuildingPhotoGuid}
            societyPhotoUrl={societyPhotoUrl}
            societyLatitude={societyLatitude}
            societyLongitude={societyLongitude}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Wraps the PTIS screen with a sticky PropertyMediaPanel on the right.
 * Supports on-demand side-panel visibility and smooth slide/fade transitions.
 */
export function PtisLayoutWrapper(props: PtisLayoutWrapperProps): React.ReactElement {
  React.useEffect(() => {
    // Avoid unregistering service workers in production unless explicitly intended.
    if (process.env.NODE_ENV !== 'development') return;
    if (!('serviceWorker' in navigator)) return;

    // Check opt-in flags (query param ?clearSW=true or localStorage)
    const urlParams = new URLSearchParams(window.location.search);
    const shouldClear =
      urlParams.get('clearSW') === 'true' || localStorage.getItem('clear-sw-dev') === 'true';
    if (!shouldClear) return;

    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.allSettled(registrations.map((r) => r.unregister())))
      .catch(() => {});
  }, []);

  return (
    <MediaPanelProvider initialVisible={props.initialVisible ?? false}>
      <PtisLayoutWrapperContent {...props} />
    </MediaPanelProvider>
  );
}
