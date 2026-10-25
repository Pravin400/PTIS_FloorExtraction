'use client';

import React from 'react';
import { AssessmentUnit, PtisTaxMode } from '@/types/property-tax/apartment';
import { cn } from '@/lib/utils/cn';
import { ExistingAssessmentTableHeader } from './ExistingAssessmentTableHeader';
import type { ApartmentSortPanel, ApartmentSortState } from '@/lib/utils/apartment-sort';
import { ExistingAssessmentTableRow } from './ExistingAssessmentTableRow';
import { PtisTableSkeleton } from './PtisTableSkeleton';
import { PtisEmptyTableState } from './PtisEmptyTableState';

interface ExistingAssessmentTableProps {
  /** Faint row background by unit id (the type / BHK of the unit). */
  rowTints?: Record<string, string>;
  sort?: ApartmentSortState | null;
  onSort?: (panel: ApartmentSortPanel, column: string) => void;
  onClearSort?: () => void;
  units: AssessmentUnit[];
  hoveredUnitId: string | null;
  expandedUnitIds: string[];
  onHoverUnit: (id: string | null) => void;
  onToggleExpandRow: (id: string) => void;
  onViewDocument?: (guid: string, title?: string) => void;
  onViewRules?: (unit: AssessmentUnit) => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  taxMode?: PtisTaxMode;
  isLoading?: boolean;
  isFullscreen?: boolean;
}

import { useTranslations } from 'next-intl';

export const ExistingAssessmentTable: React.FC<ExistingAssessmentTableProps> = ({
  units,
  hoveredUnitId,
  expandedUnitIds,
  onHoverUnit,
  onToggleExpandRow,
  onViewDocument,
  onViewRules,
  scrollRef,
  onScroll,
  taxMode,
  isLoading = false,
  isFullscreen = false,
  sort,
  rowTints,
  onSort,
  onClearSort,
}) => {
  const t = useTranslations('ptisRedesign.subTables');
  const showRv = taxMode !== 'capital';
  const showCv = taxMode !== 'rateable';
  const totalCols = showRv && showCv ? 22 : showRv || showCv ? 21 : 20;

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className={cn(
        'w-full overflow-auto text-[11px] font-sans bg-white select-none ios-scrollbar sticky bottom-0',
        '[&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-slate-400/70 hover:[&::-webkit-scrollbar-thumb]:bg-slate-500 [&::-webkit-scrollbar-thumb]:rounded-full',
        isFullscreen ? 'h-full' : 'h-auto max-h-[396px]'
      )}
    >
      <table className="w-full text-left border-collapse min-w-max">
        <ExistingAssessmentTableHeader
          taxMode={taxMode}
          sort={sort}
          onSort={onSort}
          onClearSort={onClearSort}
        />
        <tbody className="divide-y divide-zinc-200 text-zinc-800 font-semibold text-[13px]">
          {isLoading && <PtisTableSkeleton columnCount={totalCols} rowCount={8} />}
          {!isLoading &&
            units.map((unit, idx) => (
              <ExistingAssessmentTableRow
                tintColor={rowTints?.[unit.id]}
                key={unit.id ? `${unit.id}-${idx}` : idx}
                unit={unit}
                idx={idx}
                isHovered={hoveredUnitId === unit.id}
                isExpanded={expandedUnitIds.includes(unit.id)}
                onHoverUnit={onHoverUnit}
                onToggleExpandRow={onToggleExpandRow}
                onViewDocument={onViewDocument}
                onViewRules={onViewRules}
                taxMode={taxMode}
              />
            ))}
        </tbody>
      </table>
      {!isLoading && units.length === 0 && (
        <PtisEmptyTableState
          message={t('emptyExistingState') || 'No existing assessment units found.'}
        />
      )}
    </div>
  );
};
