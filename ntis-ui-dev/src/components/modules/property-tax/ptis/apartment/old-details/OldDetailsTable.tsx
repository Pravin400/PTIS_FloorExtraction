'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { MappedPropertySocietyWiseItem } from '@/types/property-mapping/property-mapping-society-wise.types';
import { Inbox, Loader2 } from 'lucide-react';
import { OldDetailsTableHeader } from './OldDetailsTableHeader';
import { OldDetailsTableRow } from './OldDetailsTableRow';
import { OLD_DETAILS_COLUMNS } from './oldDetailsColumns';

interface OldDetailsTableProps {
  items: MappedPropertySocietyWiseItem[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

export const OldDetailsTable: React.FC<OldDetailsTableProps> = ({
  items,
  isLoading,
  isLoadingMore,
  onScroll,
}) => {
  const t = useTranslations('ptisRedesign.oldDetails');
  const colSpan = OLD_DETAILS_COLUMNS.length;

  return (
    <div className="relative w-full flex-1 min-h-[200px] overflow-hidden flex flex-col bg-white">
      {/* Scrollable Data Table */}
      <div
        onScroll={onScroll}
        className="w-full flex-1 min-h-0 overflow-auto text-[11px] font-sans bg-white select-none ios-scrollbar [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-400/50 hover:[&::-webkit-scrollbar-thumb]:bg-slate-500 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-button]:hidden [&::-webkit-scrollbar-button]:!w-0 [&::-webkit-scrollbar-button]:!h-0"
      >
        <table className="w-full text-left border-collapse min-w-max">
          <OldDetailsTableHeader />
          <tbody className="divide-y divide-zinc-200 text-zinc-800 font-medium">
            {items.map((item, idx) => (
              <OldDetailsTableRow
                key={item.propertyId ? `${item.propertyId}-${idx}` : idx}
                item={item}
                idx={idx}
              />
            ))}
            {isLoadingMore && (
              <tr>
                <td
                  colSpan={colSpan}
                  className="py-2.5 text-center bg-blue-50/70 border-t border-blue-100 text-blue-800 text-xs font-semibold"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>{t('loadingMore')}</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Centered Loading Overlay (pinned to visible container viewport) */}
      {isLoading && (
        <div className="absolute inset-x-0 bottom-0 top-10 flex items-center justify-center bg-white/80 backdrop-blur-[0.5px] z-30 pointer-events-none">
          <div className="flex items-center justify-center gap-2.5 px-4 py-2 rounded-full bg-white border border-blue-200 shadow-sm text-blue-950 text-xs font-semibold">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>{t('loading')}</span>
          </div>
        </div>
      )}

      {/* Centered Empty State Overlay (pinned to visible container viewport) */}
      {!isLoading && items.length === 0 && (
        <div className="absolute inset-x-0 bottom-0 top-10 flex items-center justify-center bg-zinc-50/60 z-20 pointer-events-none">
          <div className="flex flex-col items-center justify-center gap-2 text-zinc-400">
            <Inbox className="w-8 h-8 text-zinc-300" />
            <span className="text-xs font-medium">{t('empty')}</span>
          </div>
        </div>
      )}
    </div>
  );
};
