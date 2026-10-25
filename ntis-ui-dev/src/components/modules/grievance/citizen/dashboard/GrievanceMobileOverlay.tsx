'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { CivicFeedCard, type CivicComparisonItem } from './GrievanceFeedCard';
import { LiveGrievanceTracker } from '../tracking/LiveGrievanceTracker';
import { useTicketCount } from '@/hooks/grievance/shared';
import type { MapLayerType } from '../../shared/AmravatiMap';
import type { MunicipalDepartment } from '@/types/grievance';
import { MobileBottomNavBar } from './MobileBottomNavBar';
import { MobileMapFilterBar, MobileMapControls } from './MobileMapFilterBar';
import { MobileLayerModal } from './MobileLayerModal';
import { GrievanceKpiCards } from './GrievanceKpiCards';
import { useGrievanceKpiStats } from '@/hooks/grievance/shared/useGrievanceKpiStats';
import { formatLocalizedNumber } from '@/lib/utils/grievance';

interface CivicMobileOverlayProps {
  onSnapClick: () => void;
  onFileGrievanceForDept?: (dept: MunicipalDepartment) => void;
  onSelectComplaint?: (item: CivicComparisonItem) => void;
  onDetailsClick?: (item: CivicComparisonItem) => void;
  civicFeed?: CivicComparisonItem[];
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  activeLayer?: MapLayerType;
  onLayerChange?: (layer: MapLayerType) => void;
  showBoundary?: boolean;
  onToggleBoundary?: () => void;
}

export function CivicMobileOverlay({
  onSnapClick,
  onFileGrievanceForDept: _onFileGrievanceForDept,
  onSelectComplaint,
  onDetailsClick,
  civicFeed = [],
  onZoomIn,
  onZoomOut,
  activeLayer = 'default',
  onLayerChange,
  showBoundary = true,
  onToggleBoundary,
}: CivicMobileOverlayProps) {
  const t = useTranslations('grievance');

  const ticketCount = useTicketCount();
  const displayTicketCount = formatLocalizedNumber(ticketCount);

  const { stats: kpiStats, isLoading: isKpiLoading } = useGrievanceKpiStats();
  const [activeTab, setActiveTab] = useState<'home' | 'tracker' | 'admin'>('home');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedWardFilter, setSelectedWardFilter] = useState('All Wards');
  const [activeStatusDot, setActiveStatusDot] = useState<'all' | 'red' | 'green'>('all');
  const [isAutoSlidePaused, setIsAutoSlidePaused] = useState(false);
  const [isLayerModalOpen, setIsLayerModalOpen] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentItem = civicFeed[currentIndex] || civicFeed[0];

  const scrollToIndex = useCallback((idx: number) => {
    const container = carouselRef.current;
    const cardEl = cardRefs.current[idx];
    if (cardEl && container) {
      const targetLeft = cardEl.offsetLeft - (container.clientWidth - cardEl.clientWidth) / 2;
      container.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: 'smooth',
      });
    }
  }, []);

  useEffect(() => {
    if (civicFeed.length === 0) return;
    const timer = setTimeout(() => {
      scrollToIndex(currentIndex);
    }, 250);
    return () => clearTimeout(timer);
  }, [currentIndex, scrollToIndex, civicFeed.length]);

  useEffect(() => {
    if (isAutoSlidePaused || activeTab !== 'home' || civicFeed.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % civicFeed.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoSlidePaused, activeTab, civicFeed.length]);

  const handleInteractionStart = () => {
    setIsAutoSlidePaused(true);
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  };

  const handleInteractionEnd = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      setIsAutoSlidePaused(false);
    }, 6000);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between z-20">
      {activeTab === 'tracker' ? (
        <div className="pointer-events-auto flex-1 w-full overflow-y-auto custom-scrollbar bg-slate-50 flex flex-col min-h-0">
          <LiveGrievanceTracker
            className="flex-1 h-full flex flex-col min-h-0"
            onNewIssueClick={onSnapClick}
            onClose={() => setActiveTab('home')}
          />
        </div>
      ) : (
        <>
          {/* Top Floating Controls: Ward Filter + Docked 2x2 KPI Cards */}
          <div className="w-full pointer-events-none flex flex-col gap-2 pt-2.5 px-3 sm:px-4 shrink-0">
            <div className="flex items-center justify-start w-full">
              <MobileMapFilterBar
                selectedWardFilter={selectedWardFilter}
                setSelectedWardFilter={setSelectedWardFilter}
                activeStatusDot={activeStatusDot}
                setActiveStatusDot={setActiveStatusDot}
              />
            </div>

            {/* 2x2 Grid KPI Summary Cards Docked at Top (Always visible by default) */}
            <div className="pointer-events-auto w-full">
              <GrievanceKpiCards stats={kpiStats} isLoading={isKpiLoading} variant="ticker" />
            </div>
          </div>

          {/* Interactive Map Overlay Area: Floating Zoom Controls & Centered Pin */}
          <div className="flex-1 relative pointer-events-none">
            {/* Floating Right Map Controls (Thumb-friendly, sits directly below KPI cards) */}
            <div className="absolute top-2 right-3 sm:right-4 z-20">
              <MobileMapControls
                onZoomIn={onZoomIn}
                onZoomOut={onZoomOut}
                onOpenLayerModal={() => setIsLayerModalOpen(true)}
                activeLayer={activeLayer}
              />
            </div>

            {/* Center Floating Checkmark Pin */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-11 h-11 rounded-full bg-emerald-500 border-3 border-white text-white shadow-[0_6px_20px_rgba(16,185,129,0.5)] flex items-center justify-center transform -translate-y-4 animate-bounce">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
          </div>

          {/* Bottom Section: Ward Stepper, Carousel */}
          {civicFeed.length > 0 && currentItem && (
            <div className="pointer-events-auto space-y-2 pb-1">
              <div className="px-3 sm:px-4 flex items-center justify-start">
                <div className="bg-slate-900/90 backdrop-blur-md text-white rounded-full px-3.5 py-1.5 text-[11px] font-extrabold flex items-center gap-2 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="truncate max-w-[280px] sm:max-w-xs">
                    {`${t('wardPrefix')} ${currentItem.wardNumber}: ${currentItem.wardName}`}
                  </span>
                </div>
              </div>

              <div
                ref={carouselRef}
                onTouchStart={handleInteractionStart}
                onTouchEnd={handleInteractionEnd}
                onMouseEnter={handleInteractionStart}
                onMouseLeave={handleInteractionEnd}
                className="flex items-center gap-3 overflow-x-auto px-3 sm:px-4 py-1.5 no-scrollbar snap-x snap-mandatory scroll-smooth"
              >
                {civicFeed.map((item, idx) => (
                  <div
                    key={item.id}
                    ref={(el) => {
                      cardRefs.current[idx] = el;
                    }}
                    className="snap-center shrink-0 w-[260px] sm:w-[280px]"
                  >
                    <CivicFeedCard
                      item={item}
                      isActive={idx === currentIndex}
                      onSelect={(selected) => {
                        setCurrentIndex(idx);
                        onSelectComplaint?.(selected);
                        scrollToIndex(idx);
                      }}
                      onDetailsClick={onDetailsClick}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Bottom Mobile Navigation Bar */}
      <MobileBottomNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        displayTicketCount={displayTicketCount}
        onSnapClick={onSnapClick}
      />

      <MobileLayerModal
        isOpen={isLayerModalOpen}
        onClose={() => setIsLayerModalOpen(false)}
        activeLayer={activeLayer}
        onLayerChange={onLayerChange}
        showBoundary={showBoundary}
        onToggleBoundary={onToggleBoundary}
      />
    </div>
  );
}
