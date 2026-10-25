'use client';

import { useState } from 'react';
import {
  MapPin,
  Clock,
  ThumbsUp,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Building,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Grievance } from '@/types/grievance.types';

interface ComplaintDetailCardProps {
  complaint: Grievance;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onTrackTimeline?: (trackingId: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  water: '💧',
  roads: '🔧',
  sanitation: '🗑️',
  electricity: '⚡',
  drainage: '🌊',
  garden: '🌳',
  other: '📍',
};

export function ComplaintDetailCard({
  complaint,
  onClose,
  onNext,
  onPrev,
  onTrackTimeline,
}: ComplaintDetailCardProps) {
  const t = useTranslations('grievance');
  const [upvoted, setUpvoted] = useState(false);
  const [upvotes, setUpvotes] = useState(complaint.upvotesCount || 1);

  const handleUpvote = () => {
    if (upvoted) {
      setUpvotes((v) => v - 1);
      setUpvoted(false);
    } else {
      setUpvotes((v) => v + 1);
      setUpvoted(true);
    }
  };

  const getStatusBadge = () => {
    switch (complaint.status) {
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>{t('statusResolved')}</span>
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>{t('statusInProgress')}</span>
          </span>
        );
      case 'ASSIGNED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
            <span>{t('statusAssigned')}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
            <span>{t('statusSubmitted')}</span>
          </span>
        );
    }
  };

  return (
    <div className="pointer-events-auto bg-white/98 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-[0_16px_50px_rgba(0,0,0,0.18)] border border-slate-200/90 p-4 sm:p-5 w-full max-w-sm sm:max-w-md animate-in slide-in-from-bottom-3 duration-250">
      {/* Top Header Row */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg">
            {CATEGORY_ICONS[complaint.category] || '📍'}
          </span>
          <span className="font-mono text-xs font-black tracking-wider text-slate-900">
            {complaint.trackingId}
          </span>
          {getStatusBadge()}
        </div>

        <div className="flex items-center gap-1">
          {/* Previous / Next Cycling */}
          {onPrev && (
            <button
              type="button"
              onClick={onPrev}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Previous Complaint"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Next Complaint"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer ml-1"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Complaint Title */}
      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug mb-1.5">
        {complaint.title}
      </h3>

      {/* Description */}
      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
        {complaint.description}
      </p>

      {/* Location / Ward Meta */}
      <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2">
        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        <span className="font-semibold truncate">{complaint.landmark || complaint.address}</span>
        <span className="text-slate-300">•</span>
        <span className="text-slate-500 truncate">{complaint.ward}</span>
      </div>

      {/* SLA & Time info */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl mb-3 border border-slate-100">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>{t('slaHoursTarget', { hours: complaint.slaHours })}</span>
          <span className="text-slate-300">•</span>
          <span className={complaint.slaStatus === 'NEAR_BREACH' ? 'text-amber-700 font-bold' : 'text-slate-600'}>
            {complaint.slaStatus === 'NEAR_BREACH' ? t('slaNearBreach') : t('slaOnTrack')}
          </span>
        </div>

        {complaint.assignedOfficer && (
          <div className="flex items-center gap-1 text-slate-600">
            <Building className="w-3 h-3 text-slate-400" />
            <span className="truncate max-w-[120px]">{complaint.assignedOfficer.name}</span>
          </div>
        )}
      </div>

      {/* Action Buttons: Upvote + Track */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleUpvote}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            upvoted
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
          }`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${upvoted ? 'fill-white' : ''}`} />
          <span>{upvotes} {t('upvotes')}</span>
        </button>

        <button
          type="button"
          onClick={() => onTrackTimeline?.(complaint.trackingId)}
          className="flex-1 flex items-center justify-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-sm transition-all cursor-pointer"
        >
          <span>{t('viewTimeline')}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
