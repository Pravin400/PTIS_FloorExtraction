'use client';

import React, { useCallback } from 'react';
import { ComplaintDetailCard, type AmravatiMapHandle } from '../../shared';
import type { MapLayerType } from '../../shared/AmravatiMap';
import { CivicFeedCarousel } from './GrievanceFeedCarousel';
import { LandingDesktopMapControls } from './LandingDesktopMapControls';
import { GrievanceDetailInspector } from '../tracking';
import { GrievanceKpiCards } from './GrievanceKpiCards';
import { useGrievanceKpiStats } from '@/hooks/grievance/shared/useGrievanceKpiStats';
import { type CivicComparisonItem } from './GrievanceFeedCard';
import type { MapMarker, Grievance } from '@/types/grievance';
import dynamic from 'next/dynamic';

const AmravatiMap = dynamic(
  () => import('../../shared/AmravatiMap').then((mod) => mod.AmravatiMap),
  { ssr: false }
);

export interface LandingDesktopViewProps {
  mapRef: React.RefObject<AmravatiMapHandle | null>;
  activeLayer: MapLayerType;
  showBoundary: boolean;
  onLayerChange: (layer: MapLayerType) => void;
  onToggleBoundary: () => void;
  onMarkerClick: (marker: MapMarker) => void;
  selectedWard: string;
  onToggleWard: () => void;
  activeFilter: 'all' | 'dirty' | 'clean';
  onFilterChange: (filter: 'all' | 'dirty' | 'clean') => void;
  onReport: () => void;
  selectedComplaint: Grievance | null;
  onCloseComplaint: () => void;
  civicFeed?: CivicComparisonItem[];
  inspectedItem: CivicComparisonItem | null;
  onSelectFeedCard: (item: CivicComparisonItem) => void;
  onDetailsFeedClick: (item: CivicComparisonItem) => void;
  onCloseInspector: () => void;
  onPrevComplaint: () => void;
  onNextComplaint: () => void;
  onReportSimilar: () => void;
}

export function LandingDesktopView({
  mapRef,
  activeLayer,
  showBoundary,
  onLayerChange,
  onToggleBoundary,
  onMarkerClick,
  selectedWard,
  onToggleWard,
  activeFilter,
  onFilterChange,
  onReport,
  selectedComplaint,
  onCloseComplaint,
  civicFeed = [],
  inspectedItem,
  onSelectFeedCard,
  onDetailsFeedClick,
  onCloseInspector,
  onPrevComplaint,
  onNextComplaint,
  onReportSimilar,
}: LandingDesktopViewProps) {
  const { stats: kpiStats, isLoading: isKpiLoading } = useGrievanceKpiStats();

  const handlePanToLocation = useCallback((lat: number, lng: number) => {
    if (lat && lng && lat !== 0 && lng !== 0) {
      mapRef.current?.panTo(lat, lng);
    }
  }, [mapRef]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-slate-100/70">
      <div className="flex-1 p-3 sm:p-4 lg:p-5 overflow-hidden flex flex-col gap-3">
        <GrievanceKpiCards stats={kpiStats} isLoading={isKpiLoading} className="shrink-0" />
        <div className="flex-1 relative w-full h-full rounded-3xl overflow-hidden border border-slate-200/90 shadow-md bg-white">
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

          <LandingDesktopMapControls
            selectedWard={selectedWard}
            onToggleWard={onToggleWard}
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
            onReport={onReport}
            onZoomIn={() => mapRef.current?.zoomIn()}
            onZoomOut={() => mapRef.current?.zoomOut()}
            activeLayer={activeLayer}
            onLayerChange={onLayerChange}
            showBoundary={showBoundary}
            onToggleBoundary={onToggleBoundary}
          />

          {selectedComplaint && (
            <div className="absolute top-16 left-4 z-30 pointer-events-auto max-w-sm">
              <ComplaintDetailCard
                complaint={selectedComplaint}
                onClose={onCloseComplaint}
                onNext={() => {}}
              />
            </div>
          )}

          {!inspectedItem && (
            <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none animate-in fade-in duration-200">
              <CivicFeedCarousel
                items={civicFeed}
                onSelectCard={onSelectFeedCard}
                onDetailsClick={onDetailsFeedClick}
              />
            </div>
          )}

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
      </div>
    </div>
  );
}
