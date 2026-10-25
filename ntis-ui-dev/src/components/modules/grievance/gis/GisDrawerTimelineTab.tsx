'use client';

/**
 * Status & Tracking Timeline Tab for Grievance GIS Detail Inspector Drawer.
 * Standard: Clean Architecture / ntis-ui
 */

import { History, ShieldAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { GisGrievancePopupDetailsDto } from '@/types/grievance/grievance-gis.types';

interface GisDrawerTimelineTabProps {
  details: GisGrievancePopupDetailsDto;
}

export function GisDrawerTimelineTab({ details }: GisDrawerTimelineTabProps) {
  const t = useTranslations('grievance');

  return (
    <>
      {/* Status & SLA Overview */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t('gisTrackingOverview')}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {t('gisDaysOpen', { count: details.daysOpen || 0 })}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              details.isResolved
                ? 'bg-emerald-100 text-emerald-800'
                : details.isEscalated
                ? 'bg-rose-100 text-rose-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {details.currentStateName || 'Pending'}
          </span>

          {details.isEscalated && (
            <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>{t('gisEscalatedCount', { count: details.escalationCount || 0 })}</span>
            </span>
          )}
        </div>

        {details.currentAssignedToUserName && (
          <div className="text-xs text-slate-600 pt-1.5 border-t border-slate-200/70 flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">{t('gisAssignedOfficer')}</span>
            <span className="font-bold text-slate-800">{details.currentAssignedToUserName}</span>
          </div>
        )}
      </div>

      {/* Resolution Timeline */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <History className="w-3.5 h-3.5 text-slate-500" />
          <span>
            {t('gisResolutionTimeline', { count: details.activityTimeline?.length || 0 })}
          </span>
        </div>

        {details.activityTimeline && details.activityTimeline.length > 0 ? (
          <div className="space-y-3 border-l-2 border-emerald-300 pl-3.5 ml-2.5 py-1">
            {details.activityTimeline.map((step) => (
              <div key={step.activityId} className="relative space-y-1">
                <div className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                <div className="text-xs font-bold text-slate-800">
                  {step.toState || 'Status Transition'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {step.actionByUserName ? `By: ${step.actionByUserName} • ` : ''}
                  {new Date(step.actionAt).toLocaleString()}
                </div>
                {step.remark && (
                  <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg mt-0.5 border border-slate-200/60 leading-relaxed">
                    {step.remark}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <History className="w-5 h-5 mx-auto mb-1 text-slate-300" />
            <span>{t('gisNoTrackingEvents')}</span>
          </div>
        )}
      </div>
    </>
  );
}
