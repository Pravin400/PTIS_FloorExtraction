'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { BadgeVariant } from '@/components/common';
import type { TrackingTicket, CitizenFeedback } from '@/types/grievance';
import { GrievanceSummaryPreviewModal } from '../summary/GrievanceSummaryPreview';
import { CitizenPreviewModal } from '../../CitizenPreviewModal';
import { TimelineProgressTab } from './TimelineProgressTab';
import { TimelineOfficersTab } from './TimelineOfficersTab';
import { TimelineStepperHeader } from './TimelineStepperHeader';

interface TimelineStepperProps {
  ticket: TrackingTicket;
  activeSubTab: 'timeline' | 'officers';
  onSubTabChange: (tab: 'timeline' | 'officers') => void;
  onFeedbackSubmit?: (ticketId: string, feedback: CitizenFeedback) => void;
  onTicketUpdated?: (updated: TrackingTicket) => void;
  onTicketDeleted?: (tokenOrId: string) => void;
  onBack?: () => void;
  onClose?: () => void;
  className?: string;
}

export function TimelineStepper({
  ticket,
  activeSubTab,
  onSubTabChange,
  onFeedbackSubmit,
  onTicketUpdated,
  onTicketDeleted,
  onBack,
  onClose,
  className = '',
}: TimelineStepperProps) {
  const t = useTranslations('grievance');

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Touch Swipe Gesture State for Mobile Tab Sliding
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX);

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const deltaX = touchStartX - e.changedTouches[0].clientX;
    const tabs: ('timeline' | 'officers')[] = ['timeline', 'officers'];
    const idx = tabs.indexOf(activeSubTab);
    if (deltaX > 45 && idx < tabs.length - 1) onSubTabChange(tabs[idx + 1]);
    else if (deltaX < -45 && idx > 0) onSubTabChange(tabs[idx - 1]);
    setTouchStartX(null);
  };

  if (!ticket) {
    return (
      <div className={`h-full flex items-center justify-center p-8 bg-white rounded-2xl border border-slate-200/90 ${className}`}>
        <p className="text-slate-400 text-xs font-bold">{t('selectTicketToTrack')}</p>
      </div>
    );
  }

  const subjectText = ticket.subject;
  const deptText = ticket.department;
  const wardText = ticket.ward;

  // Find resolution proof and assigned officer from ticket steps
  const proof = ticket.proof || ticket.steps.find((s) => s.proof)?.proof;
  const hasResolutionProof = Boolean(
    proof && proof.afterImageUrl && proof.afterImageUrl.trim().length > 0
  );
  const assignedOfficer = ticket.steps.find((s) => s.officer)?.officer;

  // Compute dynamic status badge based on backend currentStateId [GRV].[GrievanceWorkflowState]
  const stateId = Number(ticket.currentStateId ?? (
    ticket.status === 'CLOSED' ? 5 :
    ticket.status === 'RESOLVED' ? 4 :
    ticket.status === 'IN_PROGRESS' || ticket.status === 'AWAITING_REVIEW' ? 3 :
    ticket.status === 'REJECTED' ? 6 :
    ticket.status === 'PENDING' ? 2 : 1
  ));

  let badgeVariant: BadgeVariant = 'warning';
  let badgeLabel = t('statusPending');

  if (stateId === 6 || ticket.status === 'REJECTED') {
    badgeVariant = 'destructive';
    badgeLabel = t('statusRejected');
  } else if (stateId === 5 || ticket.status === 'CLOSED') {
    badgeVariant = 'secondary';
    badgeLabel = t('statusClosed');
  } else if (stateId === 4 || ticket.status === 'RESOLVED') {
    badgeVariant = 'success';
    badgeLabel = t('statusResolved');
  } else if (stateId === 3) {
    badgeVariant = 'info';
    badgeLabel = t('statusUnderReview');
  } else if (stateId === 2) {
    badgeVariant = 'secondary';
    badgeLabel = t('statusAssigned');
  } else {
    badgeVariant = 'warning';
    badgeLabel = t('statusPending');
  }

  return (
    <div
      className={`h-full flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden select-none ${className}`}
    >
      <TimelineStepperHeader
        ticket={ticket}
        subjectText={subjectText}
        deptText={deptText}
        wardText={wardText}
        badgeVariant={badgeVariant}
        badgeLabel={badgeLabel}
        activeSubTab={activeSubTab}
        onSubTabChange={onSubTabChange}
        onOpenEditModal={() => setIsEditModalOpen(true)}
        onOpenPreviewModal={() => setIsPreviewModalOpen(true)}
        onTicketDeleted={onTicketDeleted}
        onBack={onBack}
        onClose={onClose}
      />

      {/* SCROLLABLE CONTENT BODY */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex-1 overflow-y-auto custom-scrollbar p-1.5 sm:p-4 space-y-3 min-h-0 bg-slate-50/40 pb-20 sm:pb-6"
      >
        {activeSubTab === 'timeline' && (
          <TimelineProgressTab
            ticket={ticket}
            hasResolutionProof={hasResolutionProof}
            proof={proof}
            assignedOfficer={assignedOfficer}
            onFeedbackSubmit={onFeedbackSubmit}
            onViewDetails={() => setIsPreviewModalOpen(true)}
          />
        )}

        {activeSubTab === 'officers' && (
          <TimelineOfficersTab ticket={ticket} />
        )}
      </div>

      {/* IN-FLOW GRIEVANCE PREVIEW & EDIT MODAL DIALOG */}
      <GrievanceSummaryPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        ticket={ticket}
        onEditClick={() => {
          setIsPreviewModalOpen(false);
          setIsEditModalOpen(true);
        }}
        onTicketUpdated={onTicketUpdated}
      />

      {isEditModalOpen && (
        <CitizenPreviewModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          ticket={ticket}
          onTicketUpdated={(updated) => {
            onTicketUpdated?.(updated);
            setIsEditModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
