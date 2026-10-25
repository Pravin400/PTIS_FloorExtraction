'use client';

import { useState, useRef } from 'react';
import { Layers } from 'lucide-react';
import { FloorDetailsTable } from '@/components/common';
import { UnitPoolPagination } from './UnitPoolPagination';
import { buildUnitPoolTableColumns } from './unit-pool-table-columns';
import type { UnitPoolTableProps } from '@/types/asset/floor-details.types';

export function UnitPoolTable({
  paginatedRows,
  totalRows,
  setCurrentPage,
  activePage,
  totalPages,
  PAGE_SIZE,
  setActiveUnit,
  handleRemove,
  editEventRegistry,
  confirm,
  t,
  dropdownOptions,
}: UnitPoolTableProps) {
  const [isScrolledRight, setIsScrolledRight] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const columns = buildUnitPoolTableColumns({
    activePage,
    PAGE_SIZE,
    setActiveUnit,
    handleRemove,
    editEventRegistry,
    confirm,
    t,
    dropdownOptions,
    isScrolledRight,
    });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full flex-1">
      {/* Header row */}
      <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2">
          {/* Unit layout icon */}
          <div className="w-5 h-5 flex items-center justify-center text-blue-600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeWidth={2.5} />
              <polyline points="9 22 9 12 15 12 15 22" strokeWidth={2.5} />
            </svg>
          </div>
          <h3 className="text-[11.5px] font-black text-[#101b87] uppercase tracking-wide">
            {t('floorDetails.configureUnitDetails')}
          </h3>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-table-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-table-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .custom-table-scrollbar::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 4px;
        }
        .custom-table-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
        .custom-table-scrollbar::-webkit-scrollbar-button:single-button {
          background-color: #cbd5e1;
          display: block;
          border-style: solid;
          height: 8px;
          width: 8px;
        }
        .custom-table-scrollbar::-webkit-scrollbar-button:single-button:decrement {
          border-width: 4px 6px 4px 0;
          border-color: transparent #475569 transparent transparent;
        }
        .custom-table-scrollbar::-webkit-scrollbar-button:single-button:increment {
          border-width: 4px 0 4px 6px;
          border-color: transparent transparent transparent #475569;
        }
      `}} />

      {totalRows === 0 ? (
        <div className="py-8 text-center bg-slate-50/30 border-b border-slate-100">
          <Layers className="size-6 text-slate-300 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-slate-400">{t('floorDetails.noUnitsYet')}</p>
        </div>
      ) : (
        <div>
          <div
            ref={tableContainerRef}
            className="overflow-x-auto overflow-y-auto max-h-[350px] custom-table-scrollbar bg-white"
            onScroll={(e) => {
              const { scrollLeft, scrollWidth, clientWidth } = e.currentTarget;
              setIsScrolledRight(scrollLeft > (scrollWidth - clientWidth) / 2);
            }}
            onScrollCapture={(e) => {
              const el = e.target as HTMLElement;
              if (el && el.scrollWidth > el.clientWidth) {
                const { scrollLeft, scrollWidth, clientWidth } = el;
                setIsScrolledRight(scrollLeft > (scrollWidth - clientWidth) / 2);
              }
            }}
          >
            <FloorDetailsTable
              data={paginatedRows}
              columns={columns}
              showExpandColumn={false}
              showBorder={false}
              containerClassName="shadow-none !overflow-visible"
              tableClassName="w-full text-left"
              theadClassName="bg-[#EAF2FF] border-b border-slate-200"
              headerCellClassName="py-1.5 px-2.5 text-[9px] font-black text-[#1e40af] tracking-wider whitespace-nowrap text-center border-r border-[#D0E2FF]/80 last:border-r-0 uppercase"
              cellClassName="py-1.5 px-2.5 text-[10px] font-semibold text-slate-800 text-center whitespace-nowrap border-r border-slate-100 last:border-r-0"
              tbodyClassName="divide-y divide-slate-100"
              rowClassName={() => 'hover:bg-slate-50/40 transition-colors bg-white border-b border-slate-100'}
            />
          </div>

          <UnitPoolPagination
            totalRows={totalRows}
            activePage={activePage}
            totalPages={totalPages}
            PAGE_SIZE={PAGE_SIZE}
            setCurrentPage={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
