/**
 * Timeline Progress Tab Component
 * Path: src/components/modules/grievance/citizen/tracking/TimelineProgressTab.tsx
 *
 * Renders the modern 4-stage TrackComplaintCard connected vertical timeline,
 * along with completion proof verification when after-photos are submitted.
 * Line ceiling: <= 300 lines.
 */

import type { TrackingTicket, CitizenFeedback, TrackingOfficer, ResolutionProof } from '@/types/grievance';
import { ResolutionProofCheck } from '../resolution/ResolutionProofCheck';
import { TrackComplaintCard } from './TrackComplaintCard';

interface TimelineProgressTabProps {
  ticket: TrackingTicket;
  hasResolutionProof: boolean;
  proof?: ResolutionProof;
  assignedOfficer?: TrackingOfficer;
  onFeedbackSubmit?: (ticketId: string, feedback: CitizenFeedback) => void;
  onViewDetails?: () => void;
}

export function TimelineProgressTab({
  ticket,
  hasResolutionProof,
  proof,
  assignedOfficer,
  onFeedbackSubmit,
  onViewDetails,
}: TimelineProgressTabProps) {
  return (
    <div className="space-y-4">
      {/* 1. HERO VERTICAL TRACKER CARD (Pixel-accurate to modern civic tracking UX) */}
      <TrackComplaintCard
        ticket={ticket}
        variant="embedded"
        onViewDetails={onViewDetails}
        className="w-full max-w-2xl mx-auto rounded-2xl border border-slate-200/90 shadow-2xs"
      />

      {/* 2. RESOLUTION READY FOR REVIEW CARD (Only when genuine after-photo exists) */}
      {hasResolutionProof && proof && (
        <ResolutionProofCheck
          proof={proof}
          assignedOfficer={assignedOfficer}
          initialFeedback={ticket.feedback}
          onFeedbackSubmit={(feedback) => onFeedbackSubmit?.(ticket.id, feedback)}
        />
      )}
    </div>
  );
}
