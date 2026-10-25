import { User, Phone, Star, Zap, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { TrackingOfficer } from '@/types/grievance';

interface OfficerCardProps {
  officer: TrackingOfficer;
  className?: string;
}

export function OfficerCard({ officer, className = '' }: OfficerCardProps) {
  const t = useTranslations('grievance');

  return (
    <div
      className={`rounded-xl border border-slate-200/90 bg-white p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition-shadow space-y-2 select-none ${className}`}
    >
      {/* 1. Compact Header: Identity + 1-Click Call Button */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight truncate">
              {officer.name}
            </h4>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium truncate">
              <span className="truncate">{officer.designation}</span>
              {officer.wardOrZone && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-400 truncate">{officer.wardOrZone}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Compact Call Button */}
        <a
          href={`tel:${officer.phone}`}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors shrink-0 cursor-pointer active:scale-95"
          title={`Call ${officer.phone}`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>{officer.phone}</span>
        </a>
      </div>

      {/* 2. Compact Inline Performance Metrics Strip */}
      <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-100 text-center">
        {/* Rating */}
        <div className="flex items-center justify-center gap-1 text-[11px]">
          <Star className="w-3 h-3 text-amber-500 fill-current shrink-0" />
          <span className="text-slate-400 font-semibold">{t('rating')}</span>
          <span className="font-extrabold text-slate-900">{officer.rating}</span>
        </div>

        {/* On-Time */}
        <div className="flex items-center justify-center gap-1 text-[11px] border-x border-slate-200/80">
          <Zap className="w-3 h-3 text-emerald-600 fill-current shrink-0" />
          <span className="text-slate-400 font-semibold">{t('onTime')}</span>
          <span className="font-extrabold text-emerald-800">{officer.onTimePercent}</span>
        </div>

        {/* Solved Count */}
        <div className="flex items-center justify-center gap-1 text-[11px]">
          <Trophy className="w-3 h-3 text-sky-600 shrink-0" />
          <span className="font-extrabold text-slate-900">{officer.solvedCount}</span>
          <span className="text-slate-400 font-medium">{t('tickets')}</span>
        </div>
      </div>

      {/* 3. Concise Official Remark (if present) */}
      {officer.remarks && (
        <div className="px-2.5 py-1.5 rounded-lg bg-blue-50/40 border border-blue-100/60 text-[11px] text-slate-600 leading-snug line-clamp-2 font-medium">
          {officer.remarks}
        </div>
      )}
    </div>
  );
}

