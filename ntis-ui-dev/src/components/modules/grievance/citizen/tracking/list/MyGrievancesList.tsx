'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button, SearchInput } from '@/components/common';
import type { TrackingTicket } from '@/types/grievance';
import { TicketCardListItem } from './TicketCardListItem';

interface MyGrievancesListProps {
  tickets: TrackingTicket[];
  selectedTicketId: string;
  onSelectTicket: (ticket: TrackingTicket) => void;
  onNewIssueClick?: () => void;
  onClose?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function MyGrievancesList({
  tickets,
  selectedTicketId,
  onSelectTicket,
  onNewIssueClick,
  onClose: _onClose,
  isLoading = false,
  className = '',
}: MyGrievancesListProps) {
  const t = useTranslations('grievance');
  const locale = useLocale();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');

  // Compute live counts for filter pills
  const counts = useMemo(() => {
    const all = tickets.length;
    const pending = tickets.filter((t) => t.status !== 'RESOLVED').length;
    const resolved = tickets.filter((t) => t.status === 'RESOLVED').length;
    return { all, pending, resolved };
  }, [tickets]);

  // Filtered dataset based on search text and active tab (strictly sorted newest-first)
  const filteredTickets = useMemo(() => {
    const list = tickets.filter((ticket) => {
      if (activeFilter === 'PENDING' && ticket.status === 'RESOLVED') return false;
      if (activeFilter === 'RESOLVED' && ticket.status !== 'RESOLVED') return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        ticket.token.toLowerCase().includes(q) ||
        ticket.subject.toLowerCase().includes(q) ||
        (ticket.subjectMr && ticket.subjectMr.toLowerCase().includes(q)) ||
        ticket.department.toLowerCase().includes(q) ||
        (ticket.departmentMr && ticket.departmentMr.toLowerCase().includes(q))
      );
    });

    return list.sort((a, b) => {
      const idA = Number(a.id) || 0;
      const idB = Number(b.id) || 0;
      if (idA && idB) return idB - idA;
      return b.token.localeCompare(a.token, undefined, { numeric: true });
    });
  }, [tickets, activeFilter, searchQuery]);

  return (
    <div
      className={`h-full flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden p-3 sm:p-4 space-y-3 select-none ${className}`}
    >
      {/* 1. Header: "My Tickets (count)" + "+ New" Action Button */}
      <div className="flex items-center justify-between gap-2 shrink-0 pt-0.5">
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/grievance`}
            className="lg:hidden p-1 -ml-1 text-slate-500 hover:text-slate-900"
            title={t('back')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h2 className="text-base sm:text-lg font-black text-slate-950 tracking-tight leading-none">
            {t('myTickets')}{' '}
            <span className="text-slate-500 font-extrabold text-sm sm:text-base">
              ({tickets.length})
            </span>
          </h2>
        </div>

        {onNewIssueClick ? (
          <Button
            variant="success"
            size="xs"
            icon={Plus}
            onClick={onNewIssueClick}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs h-7 px-3 rounded-lg shadow-xs"
          >
            {t('new')}
          </Button>
        ) : (
          <Link
            href={`/${locale}/grievance/raise`}
            className="inline-flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs h-7 px-3 rounded-lg shadow-xs no-underline cursor-pointer active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('new')}</span>
          </Link>
        )}
      </div>

      {/* 3. Search Bar */}
      <div className="shrink-0">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('searchTicketsPlaceholder')}
          className="mb-0 w-full"
        />
      </div>

      {/* 4. Filter Pills with Dynamic Item Counts: All (6), Pending (3), Resolved (3) */}
      <div className="flex items-center gap-1.5 shrink-0 text-xs font-bold">
        {(
          [
            { id: 'ALL', label: t('allTickets'), count: counts.all },
            { id: 'PENDING', label: t('statusPending'), count: counts.pending },
            { id: 'RESOLVED', label: t('statusResolved'), count: counts.resolved },
          ] as const
        ).map((item) => {
          const isSelected = activeFilter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveFilter(item.id)}
              className={`flex-1 py-1.5 px-2 rounded-xl text-center text-xs transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-700 text-white shadow-xs font-black'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-semibold'
              }`}
            >
              {item.label} ({item.count})
            </button>
          );
        })}
      </div>

      {/* 5. Scrollable Ticket Items (Compact Full-Width List) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-0.5 min-h-0">
        {isLoading && tickets.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center p-6 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 gap-2.5">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            <p className="text-xs font-semibold text-slate-500">{t('connectingLiveBackend')}</p>
          </div>
        ) : filteredTickets.length > 0 ? (
          <div className="flex flex-col gap-2">
            {filteredTickets.map((ticket) => {
              const isSelected = Boolean(
                selectedTicketId &&
                  (ticket.id === selectedTicketId ||
                    ticket.token.toLowerCase() === selectedTicketId.toLowerCase())
              );
              return (
                <TicketCardListItem
                  key={ticket.id}
                  ticket={ticket}
                  isSelected={isSelected}
                  onSelect={onSelectTicket}
                />
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-1">
            <p className="text-xs font-bold text-slate-600">{t('noTicketsFound')}</p>
            <p className="text-[11px] text-slate-400">
              {t('noTicketsHint')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
