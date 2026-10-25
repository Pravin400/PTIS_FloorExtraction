'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import {
  X,
  Phone,
  Navigation,
  Building2,
  AlertCircle,
  Clock,
  ArrowRight,
  MapPin,
  User,
} from 'lucide-react';
import { Button } from '@/components/common';
import type { SurveyorInspectionItem } from '@/types/fire-audit';
import { SURVEYOR_STATUS_THEMES } from '@/lib/constants/fire-audit/surveyor-status.constants';

interface InspectionDocketDrawerProps {
  inspection: SurveyorInspectionItem | null;
  onClose: () => void;
}

export function InspectionDocketDrawer({
  inspection: incomingInspection,
  onClose,
}: InspectionDocketDrawerProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('fireAuditSurveyor.map');

  const [prevInspection, setPrevInspection] = useState<SurveyorInspectionItem | null>(null);
  const [activeItem, setActiveItem] = useState<SurveyorInspectionItem | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Synchronize incoming inspection state during render
  if (incomingInspection !== prevInspection) {
    setPrevInspection(incomingInspection);
    if (incomingInspection) {
      setActiveItem(incomingInspection);
      setImageError(false);
    } else {
      setIsVisible(false);
    }
  }

  // Unidirectional 300ms enter/exit lifecycle
  useEffect(() => {
    if (incomingInspection) {
      const timer = setTimeout(() => setIsVisible(true), 16);
      window.dispatchEvent(new CustomEvent('ntis:docket-open', { detail: { isOpen: true } }));
      return () => clearTimeout(timer);
    }
    window.dispatchEvent(new CustomEvent('ntis:docket-open', { detail: { isOpen: false } }));
    const timer = setTimeout(() => setActiveItem(null), 300);
    return () => clearTimeout(timer);
  }, [incomingInspection]);

  // Accessibility: close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose]);

  if (!activeItem) return null;

  const inspection = activeItem;
  const colorSpec = SURVEYOR_STATUS_THEMES[inspection.status] || SURVEYOR_STATUS_THEMES.assigned;
  const isOverdue = inspection.status === 'overdue', isCycle2 = inspection.inspectionCycle > 1;
  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${inspection.latitude},${inspection.longitude}`;
  const hasPhoto = Boolean(inspection.thumbnailUrl) && !imageError;

  return (
    <>
      {/* Mobile Backdrop with Smooth Fade */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 md:hidden transition-opacity duration-300 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 1-Quick-View Floating Inspection Card with Smooth Slide-Up */}
      <aside
        aria-label="Building Quick View"
        className={`fixed md:absolute bottom-0 md:top-4 md:right-4 left-0 right-0 md:left-auto md:w-96 max-h-[85vh] md:max-h-[calc(100%-2rem)] z-50 flex flex-col bg-white rounded-t-3xl md:rounded-2xl border-t md:border border-slate-200/90 shadow-[0_16px_36px_rgba(15,23,42,0.22)] overflow-hidden transition-all duration-300 ease-out will-change-transform ${
          isVisible ? 'translate-y-0 opacity-100 md:scale-100' : 'translate-y-full md:translate-y-0 opacity-0 md:scale-95 pointer-events-none'
        }`}
      >
        <div className="flex md:hidden justify-center pt-2.5 pb-1 bg-slate-900">
          <div className="w-12 h-1.5 rounded-full bg-slate-500" />
        </div>

        {/* Building Photo Hero Banner */}
        <div className="relative h-44 w-full bg-slate-950 overflow-hidden shrink-0">
          {hasPhoto ? (
            <Image
              src={inspection.thumbnailUrl!}
              alt={inspection.premisesName}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 384px"
              onError={() => setImageError(true)}
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-linear-to-br from-slate-800 via-slate-900 to-slate-950 text-slate-300 p-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-slate-300 mb-1.5 border border-white/10">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold">{inspection.buildingType}</span>
            </div>
          )}

          {/* Scrim Gradients */}
          <div className="absolute inset-x-0 top-0 h-16 bg-linear-to-b from-black/75 via-black/35 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/85 via-black/45 to-transparent pointer-events-none" />

          {/* Top Floating Row: Status Badge & Close Action */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm backdrop-blur-md" style={{ backgroundColor: `${colorSpec.primary}F0` }}>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {colorSpec.label}
            </span>
            <Button type="button" variant="ghost" size="xs" icon={X} onClick={onClose} aria-label="Close docket" className="h-8! w-8! p-0! rounded-full bg-black/50! hover:bg-black/75! text-white backdrop-blur-md border border-white/15 cursor-pointer" />
          </div>

          {/* Bottom Floating Row: Token & Cycle */}
          <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between text-[11px] text-white/90 z-10">
            <span className="font-mono font-semibold px-2 py-0.5 rounded-md bg-black/55 backdrop-blur-xs border border-white/10">{inspection.inspectionNo}</span>
            <span className="font-medium px-2 py-0.5 rounded-md bg-black/55 backdrop-blur-xs border border-white/10">{isCycle2 ? t('cycle2') : t('cycle1')}</span>
          </div>
        </div>

        {/* Quick View Body */}
        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">{inspection.premisesName}</h3>
            <div className="flex items-start gap-1.5 mt-1 text-xs text-slate-600 font-medium">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{inspection.address}</span>
            </div>
          </div>

          {/* Metadata Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
              <Building2 className="w-3 h-3 text-slate-500" />{inspection.buildingType}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">
              {t('occupancy', { code: inspection.occupancyCode })}
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${isOverdue ? 'bg-rose-50 text-rose-700 border border-rose-200/80' : 'bg-amber-50 text-amber-800 border border-amber-200/80'}`}>
              {isOverdue ? <AlertCircle className="w-3 h-3 text-rose-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
              {inspection.countdownText}
            </span>
          </div>

          {/* Site Contact Single Strip */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-200/80 flex items-center justify-center shrink-0 text-slate-600">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">{inspection.contactPersonName}</div>
                <div className="text-[11px] text-slate-500 truncate">{inspection.contactDesignation || t('siteContact')}</div>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              icon={Phone}
              disabled={!inspection.contactPersonPhone}
              onClick={() => {
                const cleanedPhone = inspection.contactPersonPhone?.replace(/\s+/g, '');
                if (cleanedPhone) window.location.href = `tel:${cleanedPhone}`;
              }}
              className="h-8! px-2.5! rounded-xl border-slate-300 text-slate-700 hover:text-slate-900 font-bold shadow-xs cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t('callNow')}
            </Button>
          </div>
        </div>

        {/* Quick Action Footer */}
        <div className="p-3.5 pb-5 md:pb-3.5 border-t border-slate-100 bg-white grid grid-cols-2 gap-2 shrink-0">
          <Button type="button" variant="secondary" size="sm" icon={Navigation} onClick={() => window.open(navUrl, '_blank', 'noopener,noreferrer')} className="h-9! rounded-xl bg-slate-100! hover:bg-slate-200! text-slate-700 text-xs font-bold cursor-pointer justify-center">
            {t('navigate')}
          </Button>
          <Button type="button" variant="primary" size="sm" icon={ArrowRight} iconPosition="right" onClick={() => router.push(`/${locale}/fire-audit/surveyor/${inspection.id}`)} className="h-9! rounded-xl bg-blue-600! hover:bg-blue-700! text-white text-xs font-bold shadow-md shadow-blue-600/25 cursor-pointer justify-center">
            {t('startAudit')}
          </Button>
        </div>
      </aside>
    </>
  );
}
