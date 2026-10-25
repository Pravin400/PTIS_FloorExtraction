'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  X,
  Clock,
  CheckCircle2,
  Share2,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { type CivicComparisonItem } from '../../dashboard/GrievanceFeedCard';
import { BeforeAfterSlider } from '@/components/common';
import { extractGrievancePhotoUrl } from '@/lib/utils/grievance';
import { InspectorAuditSection } from './InspectorAuditSection';

interface GrievanceDetailInspectorProps {
  item: CivicComparisonItem | null;
  isOpen: boolean;
  onClose: () => void;
  onPanToLocation?: (lat: number, lng: number) => void;
  onReportSimilar?: (item: CivicComparisonItem) => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function GrievanceDetailInspector({
  item,
  isOpen,
  onClose,
  onPanToLocation,
  onReportSimilar,
  onPrev,
  onNext,
}: GrievanceDetailInspectorProps) {
  const t = useTranslations('grievance');

  const [upvoted, setUpvoted] = useState(false);
  const [votes, setVotes] = useState(item?.upvotes || 0);
  const [selectedBeforeIdx, setSelectedBeforeIdx] = useState(0);

  // Sync state when selected item changes
  const [prevItemId, setPrevItemId] = useState(item?.id);
  if (prevItemId !== item?.id) {
    setPrevItemId(item?.id);
    if (item) {
      setVotes(item.upvotes);
      setUpvoted(false);
      setSelectedBeforeIdx(0);
    }
  }

  const beforePhotos = useMemo(
    () => (item?.photos || []).filter((p) => p.photoTypeId === 1 || p.photoTypeCode?.toLowerCase() === 'before'),
    [item?.photos]
  );

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const trackingToken = item.grievanceNo || '';
  const handleVoteToggle = () => {
    if (upvoted) {
      setVotes((v) => v - 1);
      setUpvoted(false);
    } else {
      setVotes((v) => v + 1);
      setUpvoted(true);
      toast.success(t('voteRecordedSuccess'));
    }
  };

  const handleCopyToken = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(trackingToken);
      toast.success(t('copiedSuccess'));
    }
  };

  const handleViewOnMap = () => {
    if (onPanToLocation && typeof item.lat === 'number' && typeof item.lng === 'number') {
      onPanToLocation(item.lat, item.lng);
      toast.info(t('mapCenteredNotice'));
    }
  };

  // Officer metadata from translations
  const officerName = t('defaultOfficerName');
  const officerTitle = t('defaultOfficerTitle');
  const departmentName = t('defaultDepartmentName');

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        onClick={onClose}
        className="md:hidden fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Main Inspector Container */}
      <aside
        aria-label={t('ticketDetails')}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] rounded-t-3xl md:absolute md:top-0 md:right-0 md:bottom-0 md:left-auto md:z-40 md:w-[460px] lg:w-[480px] md:max-h-full md:rounded-none md:rounded-r-3xl bg-white/98 backdrop-blur-xl border-t md:border-t-0 md:border-l border-slate-200/90 shadow-2xl flex flex-col overflow-hidden animate-sheet-slide-up pointer-events-auto"
      >
        {/* Mobile Pull Indicator */}
        <div className="md:hidden w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2 shrink-0" />

        {/* 1. Header Bar */}
        <header className="px-4 py-3.5 border-b border-slate-200/80 flex items-center justify-between gap-2 bg-white shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-xs font-black tracking-wider text-slate-800 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 truncate">
              {trackingToken}
            </span>

            {item.status === 'Cleaned' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{item.status}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>{item.status}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onPrev && onNext && (
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 mr-1">
                <button
                  type="button"
                  onClick={onPrev}
                  className="p-1 hover:bg-white rounded transition-colors text-slate-600 hover:text-slate-900 cursor-pointer"
                  title={t('prev')}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  className="p-1 hover:bg-white rounded transition-colors text-slate-600 hover:text-slate-900 cursor-pointer"
                  title={t('next')}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={handleCopyToken}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Copy Tracking ID"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              aria-label="Close details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* 2. Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {item.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('slaTarget24h')}</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-600 font-bold">100% {t('slaOnTrack')}</span>
            </div>
          </div>

          <BeforeAfterSlider
            beforeImage={
              extractGrievancePhotoUrl(beforePhotos[selectedBeforeIdx]) || item.beforeImage
            }
            afterImage={item.afterImage}
            beforeLabel={
              beforePhotos.length > 1
                ? `${item.beforeLabel || t('beforeLabel')} (${selectedBeforeIdx + 1}/${beforePhotos.length})`
                : (item.beforeLabel || t('beforeLabel'))
            }
            afterLabel={item.afterLabel || (item.status === 'Cleaned' ? t('afterLabel') : t('pendingFix'))}
            aspectRatioClassName="aspect-video"
          />

          {/* Interactive Multi-Photo Thumbnail Ribbon */}
          {beforePhotos.length > 1 && (
            <div className="flex items-center gap-2 pt-0.5 overflow-x-auto">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                {t('beforeLabel')}:
              </span>
              {beforePhotos.map((photo, idx) => {
                const url = extractGrievancePhotoUrl(photo);
                return (
                  <button
                    key={photo.id || idx}
                    type="button"
                    onClick={() => setSelectedBeforeIdx(idx)}
                    className={`relative w-13 h-13 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      selectedBeforeIdx === idx
                        ? 'border-rose-500 ring-2 ring-rose-200 scale-105'
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                    title={t('clickToCompare')}
                  >
                    <Image src={url} alt={t('beforeLabel')} fill unoptimized className="object-cover" />
                  </button>
                );
              })}
            </div>
          )}

          <InspectorAuditSection
            item={item}
            departmentName={departmentName}
            officerName={officerName}
            officerTitle={officerTitle}
            onViewOnMap={handleViewOnMap}
          />
        </div>

        {/* 3. Sticky Action Footer Bar */}
        <footer className="p-3.5 border-t border-slate-200 bg-white/95 backdrop-blur-md flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleVoteToggle}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              upvoted
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>
              {votes} {t('votes')}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              {t('back')}
            </button>

            {onReportSimilar && (
              <button
                type="button"
                onClick={() => onReportSimilar(item)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <span>{t('reportSimilar')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </footer>
      </aside>
    </>
  );
}
