'use client';

/**
 * Grievance GIS Detail Drawer Coordinator
 * Standard: Clean Architecture / ntis-ui
 * Orchestrates Details, Proof Photos, and Timeline Tracking tabs.
 */

import { useState } from 'react';
import { X, FileText, Activity } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { GisGrievancePopupDetailsDto } from '@/types/grievance/grievance-gis.types';
import { GisDrawerDetailsTab } from './GisDrawerDetailsTab';
import { GisDrawerTimelineTab } from './GisDrawerTimelineTab';

interface GrievanceGisDetailDrawerProps {
  details: GisGrievancePopupDetailsDto | null;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

export function GrievanceGisDetailDrawer({
  details,
  isOpen,
  onClose,
  isLoading,
}: GrievanceGisDetailDrawerProps) {
  const t = useTranslations('grievance');
  const [activeTab, setActiveTab] = useState<'details' | 'status'>('details');
  const [prevGrievanceNo, setPrevGrievanceNo] = useState(details?.grievanceNo);

  if (details?.grievanceNo !== prevGrievanceNo) {
    setPrevGrievanceNo(details?.grievanceNo);
    setActiveTab('details');
  }

  if (!isOpen) return null;

  return (
    <aside className="absolute top-0 right-0 bottom-0 h-full z-30 w-80 sm:w-96 md:w-[420px] max-w-[calc(100%-2rem)] flex flex-col bg-white border-l border-slate-200 shadow-2xl overflow-hidden animate-in slide-in-from-right duration-250 select-none">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white/95">
        <div className="flex flex-col min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-600 leading-none">
              {t('gisSpatialIntelligence')}
            </span>
            {details?.currentStateName && (
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                  details.isResolved
                    ? 'bg-emerald-100 text-emerald-800'
                    : details.isEscalated
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {details.currentStateName}
              </span>
            )}
          </div>
          <span className="text-sm font-extrabold text-slate-900 truncate mt-0.5">
            {details?.grievanceNo || 'Grievance Details'}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shrink-0 cursor-pointer"
          title="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2-Button Toggle: Details & Status */}
      <div className="px-3.5 pt-2.5 pb-2 bg-white shrink-0 border-b border-slate-100">
        <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'details'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('gisTabDetails')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'status'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('gisTabStatus')}</span>
          </button>
        </div>
      </div>

      {/* Scrollable Inspector Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-3">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-20 bg-slate-200 rounded-xl" />
            <div className="h-32 bg-slate-200 rounded-xl" />
          </div>
        ) : !details ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            <span>{t('gisNoDetailsAvailable')}</span>
          </div>
        ) : activeTab === 'details' ? (
          <GisDrawerDetailsTab details={details} />
        ) : (
          <GisDrawerTimelineTab details={details} />
        )}
      </div>
    </aside>
  );
}
