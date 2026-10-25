'use client';

/**
 * Citizen Track Evidence Banner Component
 * Path: src/components/modules/grievance/citizen/tracking/timeline/TrackEvidenceBanner.tsx
 *
 * Shows Before & After civic evidence as compact side-by-side thumbnails.
 * Tapping either image opens the full-resolution comparison modal.
 * Line ceiling: <= 300 lines.
 */

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Camera, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { TrackingTicket } from '@/types/grievance';
import type { GrievancePhotoItem } from '@/types/grievance/grievance-photo.types';
import { extractGrievancePhotoUrl } from '@/lib/utils/grievance';
import { fetchGrievancePhotosAction } from '@/lib/actions/grievance/citizen/grievance-photo.actions';

interface TrackEvidenceBannerProps {
  ticket: TrackingTicket;
  isResolved: boolean;
  onInspect: (photoId?: number) => void;
  className?: string;
  refreshTrigger?: number | string;
}

export function TrackEvidenceBanner({
  ticket,
  isResolved,
  onInspect,
  className = '',
  refreshTrigger,
}: TrackEvidenceBannerProps) {
  const t = useTranslations('grievance');
  const [extraPhotos, setExtraPhotos] = useState<GrievancePhotoItem[]>([]);

  // 1. Fetch authoritative photos for this grievance ticket
  useEffect(() => {
    let numId = Number(ticket.id);
    if (!numId || isNaN(numId)) {
      const match = ticket.token?.match(/(\d+)$/);
      if (match) numId = Number(match[1]);
    }
    if (!numId || isNaN(numId)) return;
    let mounted = true;
    fetchGrievancePhotosAction(numId)
      .then((res) => {
        if (mounted && res.success) {
          setExtraPhotos(res.data || []);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [ticket.id, ticket.token, refreshTrigger]);

  // 2. Real-time sync: immediately re-fetch whenever photos are added or deleted anywhere in the app
  useEffect(() => {
    const handleGlobalPhotosUpdate = () => {
      let numId = Number(ticket.id);
      if (!numId || isNaN(numId)) {
        const match = ticket.token?.match(/(\d+)$/);
        if (match) numId = Number(match[1]);
      }
      if (!numId || isNaN(numId)) return;
      fetchGrievancePhotosAction(numId).then((res) => {
        if (res.success) setExtraPhotos(res.data || []);
      });
    };

    window.addEventListener('grievance_photos_updated', handleGlobalPhotosUpdate);
    return () => {
      window.removeEventListener('grievance_photos_updated', handleGlobalPhotosUpdate);
    };
  }, [ticket.id, ticket.token]);

  const beforePhotos = extraPhotos.filter(
    (p) =>
      p.photoTypeId === 1 ||
      p.photoTypeCode?.toLowerCase() === 'before' ||
      p.photoTypeCode === 'INCIDENT_SITE'
  );
  const afterPhotos = extraPhotos.filter(
    (p) =>
      p.photoTypeId === 2 ||
      p.photoTypeId === 3 ||
      p.photoTypeCode === 'RESOLUTION_PROOF' ||
      p.photoTypeCode?.toLowerCase() === 'after'
  );

  const fallbackBefore =
    ticket.proof?.beforeImageUrl || (ticket as { images?: string[] }).images?.[0];
  const fallbackAfter = ticket.proof?.afterImageUrl;

  const hasBefore = beforePhotos.length > 0 || Boolean(fallbackBefore);
  const hasAfter = afterPhotos.length > 0 || Boolean(fallbackAfter);

  return (
    <div className={`mb-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden ${className}`}>
      {/* Header Row */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2 min-w-0">
          <Camera className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-black text-slate-900 tracking-tight">{t('thBeforeAfter')}</span>
          {beforePhotos.length > 1 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
              {beforePhotos.length} {t('beforeLabel')}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onInspect()}
          className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer transition-colors"
        >
          <span>{t('inspectEvidence')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Compact Bilateral Preview Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3">
        {/* 1. Left Part: Citizen Before Photos (Clean Square Thumbnails) */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
            {t('beforeLabel')}:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            {beforePhotos.length > 0 ? (
              beforePhotos.map((photo, idx) => (
                <div
                  key={photo.id || idx}
                  onClick={() => onInspect(photo.id)}
                  className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden border border-slate-200/90 bg-slate-100 shrink-0 cursor-pointer group shadow-2xs hover:border-rose-400 hover:shadow-xs transition-all"
                  title={t('clickToEnlarge')}
                >
                  <Image
                    src={extractGrievancePhotoUrl(photo)}
                    alt={t('beforeLabel')}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
              ))
            ) : hasBefore ? (
              <div
                onClick={() => onInspect()}
                className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden border border-slate-200/90 bg-slate-100 shrink-0 cursor-pointer group shadow-2xs hover:border-rose-400 transition-all"
                title={t('clickToEnlarge')}
              >
                <Image
                  src={fallbackBefore || ''}
                  alt={t('beforeLabel')}
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            ) : (
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                <Camera className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>

        {/* 2. Right Part: Officer Resolution Proof (Square Thumbnails OR Compact Status Card) */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
            {hasAfter ? t('afterLabel') : t('statusLabel')}:
          </span>
          {hasAfter ? (
            <div className="flex items-center gap-2 overflow-x-auto py-0.5">
              {afterPhotos.length > 0 ? (
                afterPhotos.map((photo, idx) => (
                  <div
                    key={photo.id || idx}
                    onClick={() => onInspect(photo.id)}
                    className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden border border-slate-200/90 bg-slate-100 shrink-0 cursor-pointer group shadow-2xs hover:border-emerald-400 hover:shadow-xs transition-all"
                    title={t('clickToEnlarge')}
                  >
                    <Image
                      src={extractGrievancePhotoUrl(photo)}
                      alt={t('afterLabel')}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    {isResolved && (
                      <div className="absolute top-1 right-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 drop-shadow-xs" />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div
                  onClick={() => onInspect()}
                  className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden border border-slate-200/90 bg-slate-100 shrink-0 cursor-pointer group shadow-2xs hover:border-emerald-400 transition-all"
                  title={t('clickToEnlarge')}
                >
                  <Image
                    src={fallbackAfter || ''}
                    alt={t('afterLabel')}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  {isResolved && (
                    <div className="absolute top-1 right-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 drop-shadow-xs" />
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Sleek Compact Pending Fix Pill Card */
            <div
              onClick={() => onInspect()}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white cursor-pointer hover:bg-slate-800 transition-colors shadow-2xs"
              title={t('clickToViewInSlider')}
            >
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[10.5px] font-bold text-amber-300 leading-tight">{t('pendingFix')}</span>
                <span className="text-[8.5px] text-slate-400 leading-tight">{t('workInProgressOnSite')}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
