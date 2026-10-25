'use client';

/**
 * Track Complaint Stepper Card Component (Amazon/Flipkart Model)
 * Clean, fast citizen tracking view without redundant clutter.
 * Line ceiling: < 300 lines (currently ~230 lines).
 */
import { useState, useMemo } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { TrackingTicket } from '@/types/grievance';
import { TrackEvidenceBanner } from './TrackEvidenceBanner';
import { TrackBilateralTimeline } from './TrackBilateralTimeline';
import { ComplaintEvidenceModal } from '@/components/modules/grievance/admin/complaints';

interface TrackComplaintCardProps {
  ticket: TrackingTicket;
  onBack?: () => void;
  onViewDetails?: () => void;
  className?: string;
  variant?: 'card' | 'embedded';
  showHeroHeader?: boolean;
}


export function TrackComplaintCard({
  ticket,
  onBack,
  onViewDetails,
  className = '',
  variant = 'card',
  showHeroHeader,
}: TrackComplaintCardProps) {
  const t = useTranslations('grievance');
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [selectedEvidencePhotoId, setSelectedEvidencePhotoId] = useState<number | undefined>(undefined);
  const shouldShowHero = showHeroHeader ?? (variant === 'card');
  const subjectText = ticket.subject;

  // 1. Authoritative Backend State directly from GrievanceTrackingDetailsDto.CurrentStateId
  const currentStateId = Number(ticket.currentStateId ?? (
    ticket.status === 'CLOSED' ? 5 :
    ticket.status === 'RESOLVED' ? 4 :
    ticket.status === 'IN_PROGRESS' || ticket.status === 'AWAITING_REVIEW' ? 3 :
    ticket.status === 'REJECTED' ? 6 :
    ticket.status === 'PENDING' ? 2 : 1
  ));

  const isClosed = currentStateId === 5;
  const isResolved = currentStateId === 4 || isClosed;
  const isInProgress = currentStateId === 3;
  const isAssigned = currentStateId === 2;
  const isPendingAssignment = currentStateId === 1;
  const isRejected = currentStateId === 6;

  // 2. Dynamic Status Content
  const statusTheme = useMemo(() => {
    if (isClosed) return { title: t('statusClosed'), desc: t('resolvedComplaintDesc') };
    if (isResolved) return { title: t('statusResolved'), desc: t('resolvedComplaintDesc') };
    if (isInProgress) return { title: t('workInProgress'), desc: ticket.description || t('workInProgressDesc') };
    if (isAssigned) {
      return {
        title: t('officerAssigned'),
        desc: ticket.activeOfficerName
          ? `${ticket.activeOfficerName} (${ticket.department || t('officerAssignedDesc')})`
          : t('officerAssignedDesc'),
      };
    }
    if (isRejected) return { title: t('statusRejected'), desc: ticket.description || t('rejectedBylawsDesc') };
    return { title: t('waitingForOfficer'), desc: t('waitingForOfficerDesc') };
  }, [isClosed, isResolved, isInProgress, isAssigned, isRejected, ticket.activeOfficerName, ticket.department, ticket.description, t]);

  // 3. Assigned Officer Resolution (Backend with authentic data only)

  const resolvedOfficer = useMemo(() => {
    if (isPendingAssignment) return null;
    const fromStep = ticket.steps?.find((s) => s.officer)?.officer;
    const name = ticket.activeOfficerName?.trim() ? ticket.activeOfficerName : fromStep?.name;
    if (!name) return null;
    return {
      name,
      designation: ticket.activeOfficerDesignation || fromStep?.designation || ticket.activeOfficerTitle || t('wardOfficer'),
      department: ticket.activeOfficerDepartment || fromStep?.department || ticket.department,
      phone: ticket.activeOfficerPhone || fromStep?.phone || undefined,
      rating: ticket.activeOfficerRating || fromStep?.rating || undefined,
    };
  }, [ticket, isPendingAssignment, t]);

  return (
    <div
      className={`${
        variant === 'embedded'
          ? 'w-full max-w-full bg-white p-2 sm:p-6 lg:p-7'
          : 'w-full max-w-xl sm:max-w-2xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-xl p-3 sm:p-7'
      } ${className}`}
    >
      {/* Standalone Hero Header */}
      {shouldShowHero && (
        <>
          <div className="flex items-center gap-3">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-2.5 text-slate-900 hover:text-blue-600 transition-colors group cursor-pointer"
                aria-label={t('trackComplaintTitle')}
              >
                <ArrowLeft className="w-5 h-5 text-slate-900 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-base sm:text-lg font-bold tracking-tight">{t('trackComplaintTitle')}</span>
              </button>
            ) : (
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900">{t('trackComplaintTitle')}</span>
            )}
          </div>
          <div className="mt-5 sm:mt-6">
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-snug">{subjectText}</h2>
            <div className="text-xs sm:text-sm font-medium text-slate-400 mt-1">#{ticket.token}</div>
          </div>
          <div className="w-full h-px bg-slate-100 my-5 sm:my-6" />
        </>
      )}



      {isResolved && (
        <div className="mb-5 w-full max-w-full overflow-hidden flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-950 transition-none">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold text-emerald-900 truncate">{statusTheme.title} — {statusTheme.desc}</span>
        </div>
      )}

      {/* Before & After Civic Evidence Banner (Combined Header & Image) */}
      <TrackEvidenceBanner
        ticket={ticket}
        isResolved={isResolved}
        onInspect={(photoId?: number) => {
          setSelectedEvidencePhotoId(photoId);
          setIsEvidenceModalOpen(true);
        }}
      />

      {/* Bilateral Citizen vs. Officer Split Flow Timeline */}
      <TrackBilateralTimeline
        ticket={ticket}
        resolvedOfficer={resolvedOfficer}
        onViewDetails={onViewDetails && variant === 'card' ? onViewDetails : undefined}
      />

      {/* High-Definition Before & After Comparison Lightbox Modal */}
      <ComplaintEvidenceModal
        isOpen={isEvidenceModalOpen}
        complaint={ticket}
        initialPhotoId={selectedEvidencePhotoId}
        onClose={() => {
          setIsEvidenceModalOpen(false);
          setSelectedEvidencePhotoId(undefined);
        }}
      />
    </div>
  );
}
