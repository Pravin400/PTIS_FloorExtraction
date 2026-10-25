'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useTimelapseState } from '@/hooks/ptis/useTimelapseState';
import { TimelapseControls } from './TimelapseControls';
import { TimelineTrack } from './TimelineTrack';

import type { WaybackRelease } from '@/lib/api/wayback.service';

const DynamicTimelapseMap = dynamic(
  () => import('./TimelapseMap').then((mod) => mod.TimelapseMap),
  { ssr: false }
);

interface ChangeTimelapseProps {
  initialLat?: number;
  initialLng?: number;
  initialWaybackReleases?: WaybackRelease[];
  propertyId?: number;
  wardNo?: string;
  propertyNo?: string;
  partitionNo?: string;
}

export function ChangeTimelapse({
  initialLat,
  initialLng,
  initialWaybackReleases,
  propertyId,
  wardNo = '',
  propertyNo = '',
  partitionNo = '',
}: ChangeTimelapseProps): React.ReactElement {
  const t = useTranslations('ptis');
  const {
    waybackReleases,
    lat,
    lng,
    activeIdx,
    setActiveIdx,
    playing,
    setPlaying,
    loading,
    setLoading,
    showLabels,
    speed,
    setSpeed,
    activeRelease,
    setFailedReleases,
  } = useTimelapseState({ initialLat, initialLng, initialWaybackReleases });

  const hasCoords =
    typeof initialLat === 'number' &&
    Number.isFinite(initialLat) &&
    typeof initialLng === 'number' &&
    Number.isFinite(initialLng);

  const handlePlayToggle = React.useCallback(() => {
    setPlaying((p) => {
      if (!p && activeIdx >= waybackReleases.length - 1) setActiveIdx(0);
      return !p;
    });
  }, [activeIdx, waybackReleases.length, setActiveIdx, setPlaying]);

  const handlePrev = React.useCallback(() => {
    setActiveIdx((i) => Math.max(0, i - 1));
    setPlaying(false);
  }, [setActiveIdx, setPlaying]);

  const handleNext = React.useCallback(() => {
    setActiveIdx((i) => Math.min(waybackReleases.length - 1, i + 1));
    setPlaying(false);
  }, [waybackReleases.length, setActiveIdx, setPlaying]);

  const handleSelectYear = React.useCallback((i: number) => {
    setActiveIdx(i);
    setPlaying(false);
  }, [setActiveIdx, setPlaying]);

  const handleActiveYearChange = React.useCallback((year: number) => {
    setActiveIdx((prevIdx) => {
      const idx = waybackReleases.findIndex((r) => r.year === year);
      return idx !== -1 ? idx : prevIdx;
    });
  }, [waybackReleases, setActiveIdx]);

  const handleReleaseError = React.useCallback((releaseId: number) => {
    setFailedReleases((prev) => {
      if (prev.has(releaseId)) return prev;
      const next = new Set(prev);
      next.add(releaseId);
      return next;
    });
  }, [setFailedReleases]);

  if (!hasCoords) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-slate-950 text-slate-400 p-8 select-none">
        <div className="flex flex-col items-center gap-3 max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-white text-base font-semibold">{t('media.changeDetectionLocationUnset')}</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {t('media.changeDetectionLocationUnsetDescription')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="tl-wrap flex flex-col h-full max-h-full flex-1 min-h-0 bg-slate-900 border border-slate-800 overflow-y-auto select-none">
      <TimelapseControls
        playing={playing}
        onPlayToggle={handlePlayToggle}
        activeIdx={activeIdx}
        totalReleases={waybackReleases.length}
        onPrev={handlePrev}
        onNext={handleNext}
        activeRelease={activeRelease}
        speed={speed}
        onSpeedChange={setSpeed}
        lat={lat}
        lng={lng}
        loading={loading}
        propertyId={propertyId}
        wardNo={wardNo}
        propertyNo={propertyNo}
        partitionNo={partitionNo}
      />

      <TimelineTrack
        releases={waybackReleases}
        activeIdx={activeIdx}
        onSelectYear={handleSelectYear}
      />

      {/* Map component */}
      <div className="flex-1 min-h-[200px] relative flex flex-col overflow-hidden">
        {!(loading && waybackReleases.length === 0) ? (
          <DynamicTimelapseMap
            lat={lat}
            lng={lng}
            activeRelease={activeRelease}
            showLabels={showLabels}
            playing={playing}
            speed={speed}
            waybackReleases={waybackReleases}
            onLoadChange={setLoading}
            onActiveYearChange={handleActiveYearChange}
            onReleaseError={handleReleaseError}
            onStopPlaying={() => setPlaying(false)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
            {t('media.fetchingCatalog')}
          </div>
        )}
      </div>
    </div>
  );
}
