'use client';

import {
  Sparkles,
  Check,
  MapPin,
  ExternalLink,
  Building,
  Phone,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { CivicComparisonItem } from '../../dashboard/GrievanceFeedCard';

interface InspectorAuditSectionProps {
  item: CivicComparisonItem;
  isMarathi?: boolean;
  departmentName: string;
  officerName: string;
  officerTitle: string;
  onViewOnMap: () => void;
}

const STEP_TIMESTAMPS = {
  submitted: '10:30 AM',
  assigned: '11:15 AM',
  deployed: '01:45 PM',
  resolved: '04:30 PM',
} as const;

export function InspectorAuditSection({
  item,
  departmentName,
  officerName,
  officerTitle,
  onViewOnMap,
}: InspectorAuditSectionProps) {
  const t = useTranslations('grievance');

  return (
    <div className="space-y-4">
      {/* Live 4-Stage Resolution Stepper */}
      <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/90 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('actionHistory')}</span>
          </span>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {item.status === 'Cleaned' ? '4/4 Completed' : '2/4 In Progress'}
          </span>
        </div>

        <div className="space-y-2.5">
          {/* Step 1 */}
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-xs">
                <p className="font-bold text-slate-800">{t('timelineStepSubmitted')}</p>
                <span className="text-[10px] text-slate-400 font-mono">{STEP_TIMESTAMPS.submitted}</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{t('timelineStepSubmittedDesc')}</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-xs">
                <p className="font-bold text-slate-800">{t('timelineStepAssigned')}</p>
                <span className="text-[10px] text-slate-400 font-mono">{STEP_TIMESTAMPS.assigned}</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{departmentName}</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-xs">
                <p className="font-bold text-slate-800">{t('timelineStepActionDeployed')}</p>
                <span className="text-[10px] text-slate-400 font-mono">{STEP_TIMESTAMPS.deployed}</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{t('timelineStepActionDeployedDesc')}</p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-2.5">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                item.status === 'Cleaned' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
              }`}
            >
              {item.status === 'Cleaned' ? (
                <Check className="w-3 h-3 stroke-[3]" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-xs">
                <p className="font-bold text-slate-800">{t('timelineStepResolved')}</p>
                <span className="text-[10px] text-slate-400 font-mono">{STEP_TIMESTAMPS.resolved}</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{t('timelineStepResolvedDesc')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Geospatial Location Context */}
      <div className="rounded-2xl border border-slate-200 p-3.5 space-y-2 bg-white shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span>{t('wardAndLocation')}</span>
          </span>
          <button
            type="button"
            onClick={onViewOnMap}
            className="text-xs font-black text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{t('viewOnMap')}</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="text-xs text-slate-600 font-medium space-y-0.5">
          <p className="font-bold text-slate-900">
            {t('wardNumberPrefix', { number: item.wardNumber })} - {item.wardName}
          </p>
          <p className="text-slate-500 font-mono text-[11px]">
            {t('gpsCoordinates', { lat: item.lat.toFixed(4), lng: item.lng.toFixed(4) })}
          </p>
        </div>
      </div>

      {/* Assigned Officer Card */}
      <div className="rounded-2xl border border-slate-200 p-3.5 space-y-2 bg-white shadow-xs">
        <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 text-blue-600" />
          <span>{t('assignedOfficer')}</span>
        </span>

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="min-w-0">
            <p className="font-extrabold text-xs text-slate-900 truncate">{officerName}</p>
            <p className="text-[11px] text-slate-500 truncate">{officerTitle}</p>
            <p className="text-[10px] text-slate-400 truncate">{departmentName}</p>
          </div>

          <a
            href="tel:07212567890"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors shrink-0 cursor-pointer"
          >
            <Phone className="w-3 h-3 text-emerald-600" />
            <span>{t('callAction')}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
