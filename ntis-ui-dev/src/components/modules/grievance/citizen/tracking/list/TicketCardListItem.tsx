'use client';

import { Clock, Building2, ChevronRight } from 'lucide-react';
import type { TrackingTicket } from '@/types/grievance';
import { TrackingCategoryIcon } from './tracking-category-icon';

interface TicketCardListItemProps {
  ticket: TrackingTicket;
  isSelected?: boolean;
  onSelect: (ticket: TrackingTicket) => void;
  className?: string;
}

/**
 * 02 Compact List Row Item
 * Streamlined 1-column horizontal row adhering to Image 1 layout specifications.
 */
export function TicketCardListItem({
  ticket,
  isSelected = false,
  onSelect,
  className = '',
}: TicketCardListItemProps) {
  const isResolved = ticket.status === 'RESOLVED';
  const subjectText = ticket.subject;
  const deptText = ticket.department;

  return (
    <div
      onClick={() => onSelect(ticket)}
      className={`group relative bg-white rounded-xl p-2.5 sm:p-3 border transition-all duration-200 cursor-pointer select-none flex items-center justify-between gap-2.5 ${
        isResolved ? 'border-l-[4px] border-l-emerald-500' : 'border-l-[4px] border-l-amber-400'
      } ${
        isSelected
          ? 'border-emerald-500/80 ring-2 ring-emerald-500/30 shadow-md bg-emerald-50/15'
          : 'border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs hover:bg-slate-50/50'
      } ${className}`}
    >
      {/* Left: Category Icon + Content Stack */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-lg bg-slate-100/90 flex items-center justify-center shrink-0">
          <TrackingCategoryIcon
            categoryOrDept={ticket.department}
            subject={ticket.subject}
            className="w-4.5 h-4.5 text-slate-700"
          />
        </div>

        <div className="space-y-0.5 min-w-0 flex-1">
          {/* Row 1: Title */}
          <h4 className="text-xs sm:text-[13px] font-extrabold text-slate-900 tracking-tight leading-snug line-clamp-1 group-hover:text-emerald-700 transition-colors">
            {subjectText}
          </h4>

          {/* Row 2: Token + Department */}
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
            <span className="font-mono text-slate-400 font-semibold">#{ticket.token}</span>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1 truncate">
              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{deptText}</span>
            </div>
          </div>

          {/* Row 3: Reported Date */}
          {ticket.reportedDate && (
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{ticket.reportedDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Chevron Arrow */}
      <div className="flex items-center shrink-0">
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
    </div>
  );
}
