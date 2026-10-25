'use client';

import React from 'react';
import type { PhotoCategory } from './PhotoPlanSidebar';
import { ChangeTimelapse } from './ChangeTimelapse';

import type { AdditionalImage } from './MediaImageCards';

import type { WaybackRelease } from '@/lib/api/wayback.service';

interface ChangeDetectionCompareProps {
  activeCategory: PhotoCategory;
  onBackToGrid: () => void;
  onImagesChange?: (newImages: AdditionalImage[]) => void;
  initialLatitude?: number;
  initialLongitude?: number;
  initialWaybackReleases?: WaybackRelease[];
  propertyId?: number;
  wardNo?: string;
  propertyNo?: string;
  partitionNo?: string;
}

export function ChangeDetectionCompare({
  activeCategory: _activeCategory,
  onBackToGrid: _onBackToGrid,
  onImagesChange: _onImagesChange,
  initialLatitude,
  initialLongitude,
  initialWaybackReleases,
  propertyId,
  wardNo = '',
  propertyNo = '',
  partitionNo = '',
}: ChangeDetectionCompareProps): React.ReactElement {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-900 select-none relative">
      {/* Main Image Compare Container - uses full height and width */}
      <div className="flex-1 w-full h-full overflow-hidden p-0 relative">
        <ChangeTimelapse
          initialLat={initialLatitude}
          initialLng={initialLongitude}
          initialWaybackReleases={initialWaybackReleases}
          propertyId={propertyId}
          wardNo={wardNo}
          propertyNo={propertyNo}
          partitionNo={partitionNo}
        />
      </div>
    </div>
  );
}
