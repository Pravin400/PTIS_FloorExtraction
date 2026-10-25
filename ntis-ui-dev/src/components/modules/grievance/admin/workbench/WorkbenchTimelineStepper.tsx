'use client';

/**
 * Workbench Horizontal 4-Stage Track Flow Stepper Component
 * Path: src/components/modules/grievance/admin/workbench/WorkbenchTimelineStepper.tsx
 *
 * Implements the canonical 4-stage track flow:
 * 1. Grievance Submitted -> 2. Field Unit Assigned -> 3. Action Deployed -> 4. Verified & Resolved.
 * Distributes milestones evenly across the card with live state indicators.
 * Line ceiling: <= 200 lines.
 */

import { useMemo } from 'react';
import { Clock, Loader2, Check } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import type { GrievanceTimelineItemDto } from '@/types/grievance/tracking.types';
import type { AdminGrievanceRecord } from '@/types/grievance/admin-complaints.types';

interface WorkbenchTimelineStepperProps {
  complaint?: AdminGrievanceRecord;
  timeline?: GrievanceTimelineItemDto[];
  isLoading?: boolean;
  submittedDate?: string;
  onViewFullHistory: () => void;
}

export function WorkbenchTimelineStepper({
  complaint,
  timeline = [],
  isLoading = false,
  submittedDate,
  onViewFullHistory,
}: WorkbenchTimelineStepperProps) {
  const t = useTranslations('grievance');
  const locale = useLocale();

  const formattedDate = (() => {
    const raw = submittedDate || complaint?.submittedDate;
    if (!raw) return '';
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return raw;
      return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return raw;
    }
  })();

  // Compute canonical 4-Stage Track Flow
  const stages = useMemo(() => {
    const formatTime = (isoString?: string | null) => {
      if (!isoString) return '';
      try {
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return isoString;
        const timeStr = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: true });
        const baseRaw = submittedDate || complaint?.submittedDate;
        if (baseRaw) {
          const subDate = new Date(baseRaw);
          if (!isNaN(subDate.getTime()) && d.toDateString() !== subDate.toDateString()) {
            const dateStr = d.toLocaleDateString(locale, { day: '2-digit', month: 'short' });
            return `${dateStr} · ${timeStr}`;
          }
        }
        return timeStr;
      } catch {
        return isoString;
      }
    };

    const currentStateId = complaint?.currentStateId ?? 1;
    const isResolvedOrClosed = currentStateId === 3 || currentStateId === 4;
    const isInProgress = currentStateId === 2;

    const sortedLogs = [...timeline].sort((a, b) => {
      if (a.activityLogId && b.activityLogId) return a.activityLogId - b.activityLogId;
      return new Date(a.actionAt).getTime() - new Date(b.actionAt).getTime();
    });

    const submitLog = sortedLogs.find((l) => l.toState?.toLowerCase().includes('pending') || !l.fromState);
    const assignLog = sortedLogs.find((l) => Boolean(l.assignedTo || l.forwardedToDepartment || l.toState?.toLowerCase().includes('assign')));
    const progressLog = sortedLogs.find((l) => l.toState?.toLowerCase().includes('progress'));
    const resolveLog = sortedLogs.find((l) => l.toState?.toLowerCase().includes('resolve') || l.toState?.toLowerCase().includes('close'));

    const step1Time = formatTime(submittedDate || complaint?.submittedDate || submitLog?.actionAt);
    const step2Time = formatTime(assignLog?.actionAt);
    const step3Time = formatTime(progressLog?.actionAt || (isInProgress || isResolvedOrClosed ? assignLog?.actionAt : undefined));
    const step4Time = formatTime(resolveLog?.actionAt || complaint?.resolvedDate);

    const activeStageIndex = isResolvedOrClosed ? 3 : isInProgress ? 2 : assignLog ? 2 : 1;

    return [
      {
        num: 1,
        title: t('timelineStepSubmitted'),
        desc: complaint?.grievanceNo || t('timelineStepSubmittedDesc'),
        actor: t('citizenApplicant'),
        time: step1Time || '—',
        isDone: true,
        isCurrent: false,
      },
      {
        num: 2,
        title: t('timelineStepAssigned'),
        desc: assignLog?.assignedTo
          ? t('assignedToPrefix', { name: assignLog.assignedTo })
          : complaint?.departmentName || t('stageAwaitingAssignment'),
        actor: assignLog?.actionBy || t('defaultOfficerTitle'),
        time: step2Time || (currentStateId >= 2 ? step1Time : '—'),
        isDone: currentStateId >= 2 || Boolean(assignLog),
        isCurrent: activeStageIndex === 1,
      },
      {
        num: 3,
        title: t('timelineStepActionDeployed'),
        desc: isInProgress || isResolvedOrClosed
          ? t('timelineStepActionDeployedDesc')
          : t('stagePendingDeployment'),
        actor: t('fieldUnitSquad'),
        time: step3Time || (isResolvedOrClosed ? step2Time : '—'),
        isDone: isResolvedOrClosed,
        isCurrent: activeStageIndex === 2,
      },
      {
        num: 4,
        title: t('timelineStepResolved'),
        desc: isResolvedOrClosed
          ? resolveLog?.remark || t('timelineStepResolvedDesc')
          : t('stageAwaitingResolution'),
        actor: resolveLog?.actionBy || t('defaultOfficerTitle'),
        time: step4Time || '—',
        isDone: isResolvedOrClosed,
        isCurrent: activeStageIndex === 3,
      },
    ];
  }, [complaint, timeline, submittedDate, locale, t]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 bg-sky-50/40 rounded-xl border border-sky-100 text-sky-800 text-xs font-semibold gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
        <span>{t('loadingAssignmentHistory')}</span>
      </div>
    );
  }

  return (
    <div className="p-3.5 sm:p-4 bg-sky-50/50 rounded-xl border border-sky-100 shadow-2xs space-y-3.5 select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-sky-200/50 pb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-700 shrink-0" />
          <span className="text-xs font-black text-slate-800 tracking-tight">
            {t('assignmentHistory')}{formattedDate ? ` · ${formattedDate}` : ''}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100/80 border border-sky-200 text-sky-800">
            {stages.filter((s) => s.isDone).length}/4 {t('completedShort')}
          </span>
        </div>
        <button
          type="button"
          onClick={onViewFullHistory}
          className="text-xs font-bold text-sky-800 hover:text-emerald-800 flex items-center gap-1 transition-colors cursor-pointer group"
        >
          <span>{t('viewFullHistory')}</span>
          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </button>
      </div>

      {/* 4-Stage Horizontal Grid Stepper */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 relative pt-1 pb-1">
        {stages.map((stage, idx) => {
          const isLast = idx === stages.length - 1;
          const nextIsDone = stages[idx + 1]?.isDone;

          return (
            <div key={stage.num} className="relative flex flex-col min-w-0">
              {/* Connector Line to Next Step */}
              {!isLast && (
                <div
                  className={`absolute top-2.5 left-5 right-0 h-0.5 pointer-events-none transition-colors ${
                    nextIsDone ? 'bg-emerald-600' : 'border-t-2 border-dashed border-sky-200'
                  }`}
                />
              )}

              {/* Milestone Node */}
              <div className="flex items-center gap-1.5 mb-1.5 relative z-10">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-2xs transition-all ${
                    stage.isDone
                      ? 'bg-[#005B41] text-white ring-2 ring-[#005B41]/20'
                      : stage.isCurrent
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/25 animate-pulse'
                      : 'border-2 border-slate-300 bg-white text-slate-400'
                  }`}
                >
                  {stage.isDone ? (
                    <Check className="w-3 h-3 stroke-[3]" />
                  ) : stage.isCurrent ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  )}
                </div>

                {stage.isCurrent && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-700 text-white tracking-wide uppercase shadow-2xs">
                    {t('currentStepBadge')}
                  </span>
                )}
              </div>

              {/* Stage Details */}
              <div className="space-y-0.5 min-w-0 pr-1 sm:pr-2">
                <div className="text-[10.5px] font-mono font-bold text-slate-500">
                  {stage.time}
                </div>
                <div className="text-xs font-black text-slate-900 truncate" title={stage.title}>
                  {stage.title}
                </div>
                <div className="text-[11px] font-bold text-slate-700 truncate" title={stage.actor}>
                  {stage.actor}
                </div>
                <div className="text-[11px] text-slate-500 font-medium leading-tight truncate" title={stage.desc}>
                  {stage.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
