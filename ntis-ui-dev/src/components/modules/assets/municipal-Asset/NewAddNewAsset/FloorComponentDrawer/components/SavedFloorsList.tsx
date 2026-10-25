'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Layers, Copy, ChevronLeft, ChevronRight, Loader2, CheckSquare } from 'lucide-react';
import { FloorDetailsTable } from '@/components/common';
import { buildSavedFloorsIdentityColumns } from './saved-floors-simple-columns';
import { buildSavedFloorsNumericColumns } from './saved-floors-numeric-columns';
import { buildSavedFloorsActionColumns } from './saved-floors-action-columns';
import type { SavedFloorsListProps } from '@/types/asset/floor-details.types';

const PAGE_SIZE = 8;

function buildLabelMap(options: { label: string; value: string | number }[] | undefined): Map<string, string> {
  const map = new Map<string, string>();
  (options || []).forEach((o: { label: string; value: string | number }) => map.set(String(o.value), o.label));
  return map;
}

export function SavedFloorsList({
  t,
  savedFloors,
  dropdownOptions,
  subUseTypeMap,
  isLoading,
  isScrolledRight,
  setIsScrolledRight,
  tableContainerRef,
  onEdit,
  onDelete,
  onDuplicate,
  isDuplicating,
}: SavedFloorsListProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dupCount, setDupCount] = useState<string>('0');
  const [currentPage, setCurrentPage] = useState(1);

  const floorLevelMap = useMemo(() => buildLabelMap(dropdownOptions?.floorLevels), [dropdownOptions?.floorLevels]);
  const constructionTypeMap = useMemo(() => buildLabelMap(dropdownOptions?.constructionTypes), [dropdownOptions?.constructionTypes]);

  /* ── Pagination ─────────────────────────────────────────────────────────── */
  const totalPages = Math.max(1, Math.ceil(savedFloors.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedFloors = savedFloors.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const pageOffset = (safePage - 1) * PAGE_SIZE;

  /* ── Selection Checkbox column prepended to identity/numeric/action columns ── */
  const selectColumn = useMemo(
    () => ({
      key: 'select',
      label: '',
      headerRender: () => (
        <div className="flex items-center justify-center">
          <CheckSquare className="size-3.5 text-[#1d4ed8]" />
        </div>
      ),
      headerClassName: 'py-2.5 px-3 text-center w-[36px] min-w-[36px] max-w-[36px]',
      cellClassName: 'py-1.5 px-3 text-center w-[36px] min-w-[36px] max-w-[36px]',
      render: (f: Record<string, unknown>) => {
        const isOpenSpace =
          String(f.unitType || '').toLowerCase().includes('open') ||
          String(f.submissionType || '').toLowerCase().includes('open');

        if (isOpenSpace) {
          return null;
        }

        return (
          <input
            type="checkbox"
            className="w-3.5 h-3.5 accent-blue-600 cursor-pointer rounded"
            checked={selectedId === f.id}
            onChange={(e) => {
              setSelectedId(e.target.checked ? (f.id != null ? Number(f.id) : null) : null);
              setDupCount('0');
            }}
          />
        );
      },
    }),
    [selectedId]
  );

  const columns = useMemo(
    () => [
      selectColumn,
      ...buildSavedFloorsIdentityColumns(t, floorLevelMap, constructionTypeMap, subUseTypeMap, dropdownOptions?.useTypes || [], pageOffset),
      ...buildSavedFloorsNumericColumns(t),
      ...buildSavedFloorsActionColumns({ t, isLoading, isScrolledRight, onEdit, onDelete }),
    ],
    [selectColumn, t, floorLevelMap, constructionTypeMap, subUseTypeMap, dropdownOptions?.useTypes, pageOffset, isLoading, isScrolledRight, onEdit, onDelete]
  );

  const selectedFloor = selectedId != null ? savedFloors.find((f) => f.id === selectedId) : null;

  const handleDuplicate = async () => {
    if (!selectedFloor || !onDuplicate) return;
    const n = parseInt(dupCount || '0', 10);
    if (!n || n <= 0) {
      toast.error('Please enter a count greater than 0');
      return;
    }
    const safeN = Math.min(50, n);
    await onDuplicate(selectedFloor, safeN);
    setSelectedId(null);
    setDupCount('0');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full flex-1">
      {/* Header row */}
      <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center text-blue-600">
            <Layers className="size-3.5 text-blue-600" />
          </div>
          <h3 className="text-[11.5px] font-black text-[#101b87] uppercase tracking-wide">
            {t.has('floorDetails.configuredFloors')
              ? t('floorDetails.configuredFloors')
              : (t('floorDetails.allFloors', { count: savedFloors.length }) || 'CONFIGURE FLOOR DETAILS')}
          </h3>
          {savedFloors.length > 0 && (
            <span className="text-[9.5px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              {savedFloors.length}{' floor'}{savedFloors.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Duplicate action — shown when a row is selected */}
        {selectedFloor && onDuplicate && (
          <div className="flex items-center gap-1.5">
            <Copy className="size-3 text-blue-500 shrink-0" />
            <span className="text-[9.5px] font-bold text-blue-700 hidden sm:inline">
              {'Duplicate × '} 
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={dupCount}
              onFocus={(e) => {
                if (dupCount === '0') {
                  setDupCount('');
                } else {
                  e.target.select();
                }
              }}
              onBlur={() => {
                if (!dupCount || dupCount.trim() === '') {
                  setDupCount('0');
                }
              }}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '');
                if (raw === '') {
                  setDupCount('');
                  return;
                }
                const parsed = parseInt(raw, 10);
                if (isNaN(parsed)) {
                  setDupCount('0');
                } else {
                  setDupCount(String(Math.min(parsed, 50)));
                }
              }}
              className="w-12 h-6 text-[11px] font-bold text-center border border-blue-300 rounded-md bg-blue-50/70 focus:bg-white text-slate-800 focus:outline-none focus:ring-1.5 focus:ring-blue-500 shadow-2xs transition-all"
              disabled={isDuplicating}
              placeholder="0"
            />
            <button
              type="button"
              onClick={handleDuplicate}
              disabled={isDuplicating || isLoading}
              className="flex items-center gap-1 px-2 h-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-[9.5px] font-bold rounded transition-colors"
            >
              {isDuplicating ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Copy className="size-3" />
              )}
              {isDuplicating ? 'Duplicating…' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => { setSelectedId(null); setDupCount('0'); }}
              className="px-1.5 h-6 text-[9.5px] font-bold text-slate-500 hover:text-slate-700 border border-slate-200 rounded transition-colors"
            >{'✕'}</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div
        ref={tableContainerRef}
        className="overflow-x-auto overflow-y-auto min-h-[260px] max-h-[460px] custom-scrollbar"
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
          data={pagedFloors}
          columns={columns}
          emptyMessage={t('floorDetails.noFloorDetailsAdded')}
          showExpandColumn={false}
          showBorder={false}
          containerClassName="shadow-none !overflow-visible"
          tableClassName="text-xs whitespace-nowrap bg-white"
          theadClassName="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-[#101b87] text-[10px] font-black uppercase tracking-wider"
          headerCellClassName="border-r-0 py-2"
          cellClassName="border-r-0 py-1.5"
          tbodyClassName="divide-y divide-slate-100"
          rowClassName={(f) =>
            `group hover:bg-slate-50/60 transition-colors bg-white text-slate-800${selectedId === f?.id ? ' !bg-blue-50/60' : ''}`
          }
        />
      </div>

      {/* Pagination — only shown when there are more than PAGE_SIZE rows */}
      {totalPages > 1 && (
        <div className="border-t border-slate-100 px-3 py-1.5 flex items-center justify-between bg-white shrink-0">
          <span className="text-[9.5px] text-slate-500 font-semibold">
            {'Page '}{safePage}{' of '}{totalPages}{' · '}{savedFloors.length}{' total'}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex items-center justify-center w-6 h-6 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="size-3 text-slate-600" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                onClick={() => setCurrentPage(pg)}
                className={`w-6 h-6 rounded border text-[9px] font-bold transition-colors ${
                  pg === safePage
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {pg}
              </button>
            ))}
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center justify-center w-6 h-6 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="size-3 text-slate-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
