'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { TrackingTicket, CitizenFeedback } from '@/types/grievance';
import { TimelineStepper } from './timeline/TimelineStepper';
import { TrackComplaintLookupCard } from './list/TrackComplaintLookupCard';

interface TrackerMobileDrawerProps {
  isOpen: boolean;
  isClosing: boolean;
  selectedTicket: TrackingTicket | null;
  isSearchingNew: boolean;
  paramToken: string | null;
  initialTicketId?: string;
  activeSubTab: 'timeline' | 'officers';
  onSubTabChange: (tab: 'timeline' | 'officers') => void;
  onFeedbackSubmit: (ticketId: string, feedback: CitizenFeedback) => void;
  onTicketUpdated: (updated: TrackingTicket) => void;
  onTicketDeleted?: (tokenOrId: string) => void;
  onTicketFound: (ticket: TrackingTicket) => void;
  onClose: () => void;
}

export function TrackerMobileDrawer({
  isOpen,
  isClosing,
  selectedTicket,
  isSearchingNew,
  paramToken,
  initialTicketId,
  activeSubTab,
  onSubTabChange,
  onFeedbackSubmit,
  onTicketUpdated,
  onTicketDeleted,
  onTicketFound,
  onClose,
}: TrackerMobileDrawerProps) {
  const t = useTranslations('grievance');
  if (!isOpen && !isClosing) return null;

  return (
    <>
      {/* Frosted Backdrop Overlay */}
      <div
        onClick={onClose}
        className={`lg:hidden fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs ${
          isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'
        }`}
        aria-hidden="true"
      />

      {/* Bottom Sheet Drawer */}
      <aside
        aria-label={t('ticketDetails')}
        className={`lg:hidden fixed inset-x-0 bottom-0 z-50 h-[88dvh] max-h-[88dvh] sm:max-w-lg sm:mx-auto rounded-t-3xl bg-white border-t sm:border-x border-slate-200/90 shadow-2xl flex flex-col overflow-hidden pointer-events-auto ${
          isClosing ? 'animate-sheet-slide-down' : 'animate-sheet-slide-up'
        }`}
      >
        {/* Mobile Drag/Pull Handle */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 shrink-0" />

        {/* Stepper or Search Content inside Drawer (Fixed height container, header pinned) */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {selectedTicket && !isSearchingNew ? (
            <TimelineStepper
              ticket={selectedTicket}
              activeSubTab={activeSubTab}
              onSubTabChange={onSubTabChange}
              onFeedbackSubmit={onFeedbackSubmit}
              onTicketUpdated={onTicketUpdated}
              onTicketDeleted={onTicketDeleted}
              onBack={onClose}
              onClose={onClose}
              className="border-0 shadow-none rounded-none h-full"
            />
          ) : paramToken || initialTicketId ? (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-slate-200/90 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <p className="text-xs font-semibold text-slate-500">
                {t('loadingTimelineFor', { token: String(paramToken || initialTicketId || '') })}
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3">
              <TrackComplaintLookupCard
                onTicketFound={onTicketFound}
                initialNumber={paramToken || initialTicketId || ''}
              />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
