'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { addRecentTrackedToken } from '@/lib/services/grievance';
import type { TrackingTicket, CitizenFeedback } from '@/types/grievance';
import { MyGrievancesList } from './list/MyGrievancesList';
import { TimelineStepper } from './timeline/TimelineStepper';
import { TrackComplaintLookupCard } from './list/TrackComplaintLookupCard';
import { useTrackerTickets } from '@/hooks/grievance/citizen/useTrackerTickets';
import { TrackerMobileDrawer } from './TrackerMobileDrawer';

interface GrievanceTrackerViewProps {
  initialTicketId?: string;
  onNewIssueClick?: () => void;
  onClose?: () => void;
  className?: string;
}

function GrievanceTrackerContent({
  initialTicketId,
  onNewIssueClick,
  onClose,
  className = '',
}: GrievanceTrackerViewProps) {
  const t = useTranslations('grievance');
  const {
    tickets,
    setTickets,
    selectedTicket,
    setSelectedTicket,
    selectTicket,
    isLoadingTickets,
    mobileView,
    setMobileView,
    updateUrlState,
    paramToken,
  } = useTrackerTickets({ initialTicketId });

  const [isSearchingNew, setIsSearchingNew] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'officers'>('timeline');

  const handleSelectTicket = (ticket: TrackingTicket) => {
    addRecentTrackedToken(ticket.token);
    void selectTicket(ticket);
    setIsSearchingNew(false);
    setIsClosing(false);
    setMobileView('timeline');
    updateUrlState(ticket.token, 'timeline');
  };

  const handleTicketFound = (ticket: TrackingTicket) => {
    addRecentTrackedToken(ticket.token);
    setTickets((prev) => [ticket, ...prev.filter((t) => t.token !== ticket.token)]);
    setSelectedTicket(ticket);
    setIsSearchingNew(false);
    setMobileView('timeline');
    updateUrlState(ticket.token, 'timeline');
  };

  const handleMobileSwitchView = useCallback(
    (view: 'list' | 'timeline') => {
      if (view === 'list' && mobileView === 'timeline') {
        setIsClosing(true);
        setTimeout(() => {
          setMobileView('list');
          setIsClosing(false);
          if (selectedTicket) updateUrlState(selectedTicket.token, 'list');
        }, 240);
      } else {
        setIsClosing(false);
        setMobileView(view);
        if (selectedTicket) updateUrlState(selectedTicket.token, view);
      }
    },
    [mobileView, selectedTicket, updateUrlState, setMobileView]
  );

  // ESC key dismissal for mobile bottom sheet
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileView === 'timeline') {
        handleMobileSwitchView('list');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileView, handleMobileSwitchView]);

  const handleFeedbackSubmit = (ticketId: string, feedback: CitizenFeedback) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, feedback } : t))
    );
    setSelectedTicket((curr) => (curr?.id === ticketId ? { ...curr, feedback } : curr));
  };

  const handleTicketUpdated = (updated: TrackingTicket) => {
    setSelectedTicket(updated);
    setTickets((prev) =>
      prev.map((t) => (t.token.toLowerCase() === updated.token.toLowerCase() ? updated : t))
    );
  };

  const handleTicketDeleted = (deletedTokenOrId: string) => {
    const updated = tickets.filter(
      (t) =>
        t.token.toLowerCase() !== deletedTokenOrId.toLowerCase() &&
        t.id !== deletedTokenOrId
    );
    setTickets(updated);

    if (
      selectedTicket?.token.toLowerCase() === deletedTokenOrId.toLowerCase() ||
      selectedTicket?.id === deletedTokenOrId
    ) {
      const nextTicket = updated[0] || null;
      setSelectedTicket(nextTicket);
      if (nextTicket) {
        updateUrlState(nextTicket.token, 'timeline');
      } else {
        updateUrlState('', 'list');
        setMobileView('list');
      }
    }
  };

  return (
    <div className={`w-full h-full flex flex-col min-h-0 select-none ${className}`}>
      {/* Main Dual-Pane Responsive Layout */}
      <div className="flex-1 w-full flex flex-col lg:flex-row items-stretch gap-4 min-h-0 overflow-y-auto lg:overflow-hidden custom-scrollbar">
        {/* LEFT COLUMN: My Grievances List */}
        <div className="w-full lg:w-80 xl:w-[360px] shrink-0 h-full min-h-0 pb-24 lg:pb-0 flex flex-col gap-2">
          <div className="flex-1 min-h-0">
            <MyGrievancesList
              tickets={tickets}
              selectedTicketId={selectedTicket?.token || selectedTicket?.id || ''}
              onSelectTicket={handleSelectTicket}
              onNewIssueClick={onNewIssueClick}
              onClose={onClose}
              isLoading={isLoadingTickets}
            />
          </div>
        </div>

        {/* DESKTOP RIGHT COLUMN: Docked Stepper Timeline or Lookup Card */}
        <div className="hidden lg:flex flex-1 w-full h-full min-w-0 min-h-0 flex-col">
          <div className="flex-1 min-h-0 h-full">
            {selectedTicket && !isSearchingNew ? (
              <TimelineStepper
                ticket={selectedTicket}
                activeSubTab={activeSubTab}
                onSubTabChange={setActiveSubTab}
                onFeedbackSubmit={handleFeedbackSubmit}
                onTicketUpdated={handleTicketUpdated}
                onTicketDeleted={handleTicketDeleted}
                onClose={onClose}
              />
            ) : paramToken || initialTicketId ? (
              <div className="h-full flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-slate-200/90 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                <p className="text-xs font-semibold text-slate-500">
                  {t('loadingTimelineFor', { token: String(paramToken || initialTicketId || '') })}
                </p>
              </div>
            ) : (
              <TrackComplaintLookupCard
                onTicketFound={handleTicketFound}
                initialNumber={paramToken || initialTicketId || ''}
              />
            )}
          </div>
        </div>
      </div>

      {/* MOBILE POPUP: Fast & Smooth 60fps GPU Bottom Sheet */}
      <TrackerMobileDrawer
        isOpen={mobileView === 'timeline'}
        isClosing={isClosing}
        selectedTicket={selectedTicket}
        isSearchingNew={isSearchingNew}
        paramToken={paramToken}
        initialTicketId={initialTicketId}
        activeSubTab={activeSubTab}
        onSubTabChange={setActiveSubTab}
        onFeedbackSubmit={handleFeedbackSubmit}
        onTicketUpdated={handleTicketUpdated}
        onTicketDeleted={handleTicketDeleted}
        onTicketFound={handleTicketFound}
        onClose={() => handleMobileSwitchView('list')}
      />
    </div>
  );
}

export function GrievanceTrackerView(props: GrievanceTrackerViewProps) {
  const t = useTranslations('grievance');
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400 font-medium">{t('loadingGrievancePortal')}</div>}>
      <GrievanceTrackerContent {...props} />
    </Suspense>
  );
}
