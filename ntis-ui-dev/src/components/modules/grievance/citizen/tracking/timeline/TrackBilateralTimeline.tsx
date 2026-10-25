'use client';

/**
 * Bilateral Citizen vs. Officer Tracking Timeline Flow
 * Path: src/components/modules/grievance/citizen/tracking/timeline/TrackBilateralTimeline.tsx
 *
 * Preserves the exact central spine graph design from Image 1 with flow states
 * mapped directly to [GRV].[GrievanceWorkflowState] (1: Pending, 2: Assigned, 3: Under Review, 4: Resolved, 5: Closed, 6: Rejected).
 * - Citizen actions on the Left (Pending, Closed)
 * - Officer/Municipal actions on the Right (Assigned, Under Review, Resolved / Rejected)
 * Line ceiling: <= 320 lines.
 */

import { useMemo } from 'react';
import {
  FileText, UserCheck, Wrench, CheckCircle2, AlertCircle, Check, User, Shield, Phone,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import type { TrackingTicket } from '@/types/grievance';
import type { ResolvedOfficerInfo } from './TrackAssignedOfficerCard';

interface TrackBilateralTimelineProps {
  ticket: TrackingTicket;
  resolvedOfficer: ResolvedOfficerInfo | null;
  onViewDetails?: () => void;
  className?: string;
}

export function TrackBilateralTimeline({
  ticket,
  resolvedOfficer,
  onViewDetails,
  className = '',
}: TrackBilateralTimelineProps) {
  const t = useTranslations('grievance');
  const locale = useLocale();

  // 1. Authoritative Backend State directly from GrievanceTrackingDetailsDto.CurrentStateId
  const stateId = Number(ticket.currentStateId ?? (
    ticket.status === 'CLOSED' ? 5 :
    ticket.status === 'RESOLVED' ? 4 :
    ticket.status === 'IN_PROGRESS' || ticket.status === 'AWAITING_REVIEW' ? 3 :
    ticket.status === 'REJECTED' ? 6 :
    ticket.status === 'PENDING' ? 2 : 1
  ));

  const isRejected = stateId === 6 || ticket.status === 'REJECTED';
  const isClosed = stateId === 5 || ticket.status === 'CLOSED';
  const isResolved = (stateId === 4 || isClosed) && !isRejected;
  const isUnderReview = stateId === 3 && !isRejected;

  // 2. Real Backend Activity Timestamps & Remarks from Timeline DTO
  const timelineLogs = useMemo(() => ticket.timeline || [], [ticket.timeline]);

  const assignmentLog = useMemo(
    () => timelineLogs.find((l) =>
      l.toState?.toLowerCase().includes('assign') ||
      Boolean(l.assignedTo)
    ) || ticket.activityLogs?.find((l) =>
      l.statusBadge?.toLowerCase().includes('assign') ||
      l.actionEn?.toLowerCase().includes('assign')
    ),
    [timelineLogs, ticket.activityLogs]
  );

  const reviewLog = useMemo(
    () => timelineLogs.find((l) =>
      l.toState?.toLowerCase().includes('review') ||
      l.toState?.toLowerCase().includes('progress')
    ) || ticket.activityLogs?.find((l) =>
      l.statusBadge?.toLowerCase().includes('review') ||
      l.statusBadge?.toLowerCase().includes('progress')
    ),
    [timelineLogs, ticket.activityLogs]
  );

  const resolveLog = useMemo(
    () => timelineLogs.find((l) =>
      l.toState?.toLowerCase().includes('resolve')
    ) || ticket.activityLogs?.find((l) =>
      l.statusBadge?.toLowerCase().includes('resolve')
    ),
    [timelineLogs, ticket.activityLogs]
  );

  const closeLog = useMemo(
    () => timelineLogs.find((l) =>
      l.toState?.toLowerCase().includes('close')
    ) || ticket.activityLogs?.find((l) =>
      l.statusBadge?.toLowerCase().includes('close')
    ),
    [timelineLogs, ticket.activityLogs]
  );

  const rejectLog = useMemo(
    () => timelineLogs.find((l) =>
      l.toState?.toLowerCase().includes('reject')
    ) || ticket.activityLogs?.find((l) =>
      l.statusBadge?.toLowerCase().includes('reject')
    ),
    [timelineLogs, ticket.activityLogs]
  );

  const formatLogDate = (dateStr?: string | null) => {
    if (!dateStr) return undefined;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const assignmentTimestamp = formatLogDate(assignmentLog && 'actionAt' in assignmentLog ? assignmentLog.actionAt : (assignmentLog as { timestamp?: string } | undefined)?.timestamp);
  const reviewTimestamp = formatLogDate(reviewLog && 'actionAt' in reviewLog ? reviewLog.actionAt : (reviewLog as { timestamp?: string } | undefined)?.timestamp);
  const resolutionTimestamp = formatLogDate(resolveLog && 'actionAt' in resolveLog ? resolveLog.actionAt : (resolveLog as { timestamp?: string } | undefined)?.timestamp) || ticket.proof?.completedAt;
  const closeTimestamp = formatLogDate(closeLog && 'actionAt' in closeLog ? closeLog.actionAt : (closeLog as { timestamp?: string } | undefined)?.timestamp);
  const rejectTimestamp = formatLogDate(rejectLog && 'actionAt' in rejectLog ? rejectLog.actionAt : (rejectLog as { timestamp?: string } | undefined)?.timestamp);

  // 1:1 Flow States directly from [GRV].[GrievanceWorkflowState] using dynamic i18n dictionary keys
  const milestones = [
    // State 1: Pending (प्रलंबित) - Citizen Action (Left)
    {
      id: 'state1_pending',
      side: 'citizen' as const,
      icon: FileText,
      iconBg: 'bg-emerald-50 text-emerald-600',
      title: t('statusPending'),
      desc: ticket.subject || ticket.description || t('complaintSubmittedDesc'),
      timestamp: ticket.reportedDate,
      status: 'done' as const,
    },

    // State 2: Assigned (नियुक्त) - Officer Action (Right)
    {
      id: 'state2_assigned',
      side: 'officer' as const,
      icon: UserCheck,
      iconBg: stateId >= 2 && !isRejected ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400',
      title: t('statusAssigned'),
      desc: resolvedOfficer
        ? `${resolvedOfficer.name} • ${resolvedOfficer.designation}`
        : t('waitingForOfficerDesc'),
      timestamp: stateId >= 2 ? assignmentTimestamp : undefined,
      status: stateId > 2 && !isRejected ? ('done' as const) : stateId === 2 ? ('active' as const) : ('pending' as const),
      officer: resolvedOfficer,
      isActiveCard: stateId === 2,
    },

    // State 3: Under Review- Officer Action (Right)
    {
      id: 'state3_under_review',
      side: 'officer' as const,
      icon: Wrench,
      iconBg: stateId >= 4 && !isRejected
        ? 'bg-emerald-50 text-emerald-600'
        : isUnderReview
        ? 'bg-blue-100 text-blue-600'
        : 'bg-slate-100 text-slate-400',
      title: t('statusUnderReview'),
      desc: (reviewLog && 'remark' in reviewLog ? reviewLog.remark : undefined) || ticket.description || t('workInProgressDesc'),
      timestamp: stateId >= 3 ? reviewTimestamp : undefined,
      tag: stateId === 3 ? t('currentUpdateTag') : undefined,
      tagType: 'active' as const,
      status: stateId >= 4 && !isRejected ? ('done' as const) : isUnderReview ? ('active' as const) : ('pending' as const),
      isActiveCard: stateId === 3,
    },

    // Branching: If Rejected, show State 6. Otherwise show State 4 (Resolved) & State 5 (Closed).
    ...(isRejected ? [
      // State 6: Rejected (नाकारले) - Officer/Authority Action (Right)
      {
        id: 'state6_rejected',
        side: 'officer' as const,
        icon: AlertCircle,
        iconBg: 'bg-rose-100 text-rose-700',
        title: t('statusRejected'),
        desc: (rejectLog && 'remark' in rejectLog ? rejectLog.remark : undefined) || ticket.description || t('rejectedBylawsDesc'),
        timestamp: rejectTimestamp,
        tag: t('statusRejected'),
        tagType: 'active' as const,
        status: 'rejected' as const,
        isActiveCard: true,
      },
    ] : [
      // State 4: Resolved (निराकरण झाले) - Officer Action (Right)
      {
        id: 'state4_resolved',
        side: 'officer' as const,
        icon: CheckCircle2,
        iconBg: isResolved ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400',
        title: t('statusResolved'),
        desc: isResolved
          ? (resolveLog && 'remark' in resolveLog ? resolveLog.remark : undefined) || ticket.proof?.workSummary || t('resolvedComplaintDesc')
          : t('resolutionUpdateDesc'),
        timestamp: isResolved ? resolutionTimestamp : undefined,
        tag: !isResolved ? t('upcomingTag') : undefined,
        tagType: 'muted' as const,
        status: isResolved ? ('done' as const) : ('pending' as const),
        isActiveCard: stateId === 4,
      },

      // State 5: Closed (बंद) - Rendered on Officer/System side only when actually Closed in DB
      ...(isClosed ? [
        {
          id: 'state5_closed',
          side: 'officer' as const,
          icon: CheckCircle2,
          iconBg: 'bg-emerald-50 text-emerald-600',
          title: t('statusClosed'),
          desc: (closeLog && 'remark' in closeLog ? closeLog.remark : undefined) || t('resolvedComplaintDesc'),
          timestamp: closeTimestamp,
          tag: t('statusClosed'),
          tagType: 'muted' as const,
          status: 'done' as const,
          isActiveCard: stateId === 5,
        },
      ] : []),
    ]),
  ];

  return (
    <div className={`w-full ${className}`}>
      {/* 1. Header: Citizen (Left) vs. Officer (Right) Column Attribution */}
      <div className="grid grid-cols-2 gap-2 sm:gap-8 mb-3 sm:mb-4 px-1 sm:px-2">
        <div className="flex items-center justify-end gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold text-slate-800 pr-2 sm:pr-6">
          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />
          <span>{t('thCitizen')}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold text-slate-800 pl-2 sm:pl-6">
          <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-700" />
          <span>{t('officerLabel')}</span>
        </div>
      </div>

      {/* 2. Timeline Grid with Centered Spine (Exact Graph from Image 1) */}
      <div className="relative">
        {/* Continuous Central Spine */}
        <div className="absolute left-1/2 top-4 bottom-4 -translate-x-1/2 w-0.5 bg-slate-200" />

        <div className="space-y-3.5 sm:space-y-5">
          {milestones.map((m) => {
            const Icon = m.icon;
            const isCitizen = m.side === 'citizen';
            const isDone = m.status === 'done';
            const isActive = m.status === 'active';
            const isMilestoneRejected = m.status === 'rejected';

            // Milestone node on central spine
            const NodeDot = (
              <div className="relative z-10 shrink-0">
                {isDone ? (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xs">
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                  </div>
                ) : isActive ? (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-blue-600 bg-white ring-2 sm:ring-4 ring-blue-100 flex items-center justify-center shadow-xs">
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-600 animate-pulse" />
                  </div>
                ) : isMilestoneRejected ? (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-2xs ring-2 sm:ring-4 ring-rose-100">
                    <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-slate-300 bg-white" />
                )}
              </div>
            );

            // Card content component
            const CardBox = (
              <div
                className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${
                  isMilestoneRejected
                    ? 'bg-rose-50/80 border-rose-300 shadow-2xs'
                    : m.isActiveCard
                    ? 'bg-blue-50/70 border-blue-200/90 shadow-2xs ring-1 ring-blue-400/20'
                    : 'bg-white border-slate-200/80 shadow-2xs hover:shadow-xs'
                }`}
              >
                <div className="flex items-start gap-1.5 sm:gap-3">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl ${m.iconBg} flex items-center justify-center shrink-0 shadow-2xs mt-0.5`}>
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <h4 className="text-[11px] sm:text-sm font-black text-slate-900 tracking-tight leading-snug">
                        {m.title}
                      </h4>
                      {m.tag && (
                        <span
                          className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold ${
                            isMilestoneRejected
                              ? 'bg-rose-100 text-rose-800'
                              : m.tagType === 'active'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {m.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-snug mt-0.5 sm:mt-1 line-clamp-2">
                      {m.desc}
                    </p>
                    {m.timestamp && (
                      <div className="text-[9px] sm:text-[10px] font-medium text-slate-400 mt-1">
                        {m.timestamp}
                      </div>
                    )}

                    {/* Assigned Officer Call Action */}
                    {m.officer && m.officer.phone && (
                      <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 truncate">
                          {m.officer.name}
                        </span>
                        <a
                          href={`tel:${m.officer.phone}`}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] sm:text-[11px] font-bold border border-emerald-200 transition-colors shadow-2xs"
                        >
                          <Phone className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
                          <span>{t('callAction')}</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );

            return (
              <div key={m.id} className="relative">
                {/* 2-Column Bilateral Split with Horizontal Stubs */}
                <div className="grid grid-cols-2 gap-2 sm:gap-8 items-center">
                  {/* Left Column (Citizen) */}
                  <div className="flex items-center justify-end">
                    {isCitizen ? (
                      <div className="relative w-full max-w-sm flex items-center">
                        <div className="w-full">{CardBox}</div>
                        {/* Horizontal stub connector to spine */}
                        <div className="w-1.5 sm:w-4 h-0.5 bg-slate-200 shrink-0" />
                      </div>
                    ) : (
                      <div />
                    )}
                  </div>

                  {/* Centered Node on Spine */}
                  <div className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center">
                    {NodeDot}
                  </div>

                  {/* Right Column (Officer) */}
                  <div className="flex items-center justify-start">
                    {!isCitizen ? (
                      <div className="relative w-full max-w-sm flex items-center">
                        {/* Horizontal stub connector from spine */}
                        <div className="w-1.5 sm:w-4 h-0.5 bg-slate-200 shrink-0" />
                        <div className="w-full">{CardBox}</div>
                      </div>
                    ) : (
                      <div />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Bottom Legend & Details Action */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        <span className="text-slate-400 font-medium text-center sm:text-left text-[10px] sm:text-[11px]">
          {t('trackSplitLegend')}
        </span>
        {onViewDetails && (
          <button
            type="button"
            onClick={onViewDetails}
            className="inline-flex items-center gap-1 font-bold text-blue-700 hover:text-blue-800 cursor-pointer transition-colors"
          >
            <span>{t('viewDetailsAction')}</span>
            <span aria-hidden="true">&rarr;</span>
          </button>
        )}
      </div>
    </div>
  );
}
