'use client';

import React, { useCallback } from 'react';
import { type AmravatiMapHandle } from '../../shared';
import type { MapLayerType } from '../../shared/AmravatiMap';
import { CivicMobileOverlay } from './GrievanceMobileOverlay';
import { GrievanceDetailInspector } from '../tracking';
import { type CivicComparisonItem } from './GrievanceFeedCard';
import type { MapMarker, MunicipalDepartment } from '@/types/grievance';
import dynamic from 'next/dynamic';

const AmravatiMap = dynamic(
  () => import('../../shared/AmravatiMap').then((mod) => mod.AmravatiMap),
  { ssr: false }
);

export interface LandingMobileViewProps {
  mapRef: React.RefObject<AmravatiMapHandle | null>;
  activeLayer: MapLayerType;
  showBoundary: boolean;
  onLayerChange: (layer: MapLayerType) => void;
  onToggleBoundary: () => void;
  onMarkerClick: (marker: MapMarker) => void;
  onSnapClick: () => void;
  onFileGrievanceForDept: (dept: MunicipalDepartment) => void;
  onSelectComplaint: (item: CivicComparisonItem) => void;
  onDetailsClick: (item: CivicComparisonItem) => void;
  civicFeed?: CivicComparisonItem[];
  inspectedItem: CivicComparisonItem | null;
  onCloseInspector: () => void;
  onPrevComplaint: () => void;
  onNextComplaint: () => void;
  onReportSimilar: () => void;
}

export function LandingMobileView({
  mapRef,
  activeLayer,
  showBoundary,
  onLayerChange,
  onToggleBoundary,
  onMarkerClick,
  onSnapClick,
  onFileGrievanceForDept,
  onSelectComplaint,
  onDetailsClick,
  civicFeed = [],
  inspectedItem,
  onCloseInspector,
  onPrevComplaint,
  onNextComplaint,
  onReportSimilar,
}: LandingMobileViewProps) {
  const handlePanToLocation = useCallback((lat: number, lng: number) => {
    if (lat && lng && lat !== 0 && lng !== 0) {
      mapRef.current?.panTo(lat, lng);
    }
  }, [mapRef]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        <AmravatiMap
          ref={mapRef}
          activeCategory="all"
          activeLayer={activeLayer}
          showBoundary={showBoundary}
          onMarkerClick={onMarkerClick}
          onZoomIn={() => mapRef.current?.zoomIn()}
          onZoomOut={() => mapRef.current?.zoomOut()}
        />
      </div>

      <CivicMobileOverlay
        onSnapClick={onSnapClick}
        onFileGrievanceForDept={onFileGrievanceForDept}
        activeLayer={activeLayer}
        onLayerChange={onLayerChange}
        showBoundary={showBoundary}
        onToggleBoundary={onToggleBoundary}
        onSelectComplaint={onSelectComplaint}
        onDetailsClick={onDetailsClick}
        civicFeed={civicFeed}
        onZoomIn={() => mapRef.current?.zoomIn()}
        onZoomOut={() => mapRef.current?.zoomOut()}
      />

      <GrievanceDetailInspector
        item={inspectedItem}
        isOpen={Boolean(inspectedItem)}
        onClose={onCloseInspector}
        onPrev={onPrevComplaint}
        onNext={onNextComplaint}
        onPanToLocation={handlePanToLocation}
        onReportSimilar={onReportSimilar}
      />
    </div>
  );
}
