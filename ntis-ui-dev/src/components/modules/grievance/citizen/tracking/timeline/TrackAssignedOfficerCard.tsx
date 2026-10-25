/**
 * Dedicated Civic Assigned Officer Card with Rating and Direct Call Action
 * Path: src/components/modules/grievance/citizen/tracking/TrackAssignedOfficerCard.tsx
 * Line ceiling: <= 100 lines.
 */
import { User, Phone, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface ResolvedOfficerInfo {
  name: string;
  designation: string;
  department?: string;
  phone?: string;
  rating?: string;
}

interface TrackAssignedOfficerCardProps {
  officer: ResolvedOfficerInfo;
  className?: string;
}

export function TrackAssignedOfficerCard({ officer, className = '' }: TrackAssignedOfficerCardProps) {
  const t = useTranslations('grievance');

  return (
    <div className={`mt-2.5 p-3 rounded-xl bg-slate-50/90 border border-slate-200/90 flex items-center justify-between gap-3 shadow-2xs ${className}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs">
          <User className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
            <span className="truncate">{officer.name}</span>
            {officer.rating && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-extrabold border border-amber-200/70 shrink-0">
                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                {officer.rating}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
            {officer.designation} {officer.department ? `(${officer.department})` : ''}
          </div>
        </div>
      </div>

      {officer.phone && (
        <a
          href={`tel:${officer.phone}`}
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 text-xs font-bold shadow-2xs transition-all cursor-pointer"
          title={officer.phone}
        >
          <Phone className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">{officer.phone}</span>
          <span className="sm:hidden">{t('callAction')}</span>
        </a>
      )}
    </div>
  );
}
