'use client';

import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, RotateCcw } from 'lucide-react';
import { Tooltip } from '@/components/common/Tooltip';
import { cn } from '@/lib/utils/cn';
import {
  isApartmentColumnSortable,
  sortDirectionOf,
  type ApartmentSortPanel,
  type ApartmentSortState,
} from '@/lib/utils/apartment-sort';

export interface PtisColumnDef {
  key: string;
  labelKey: string;
  titleKey: string;
  defaultLabel: string;
  defaultTitle: string;
  className: string;
}

interface PtisTableHeaderProps {
  /** Which of the three tables this header belongs to (decides what a column is sorted by). */
  panel: ApartmentSortPanel;
  columns: PtisColumnDef[];
  /** Translates a column key; returns the key itself (or nothing) when there is no translation. */
  translate: (key: string) => string;
  /** Classes of the sticky <thead> and of its row: the colour of the table. */
  theadClassName: string;
  rowClassName: string;
  sort?: ApartmentSortState | null;
  onSort?: (panel: ApartmentSortPanel, column: string) => void;
  onClearSort?: () => void;
  /** Tooltip of the reset button on the # column. */
  resetSortLabel?: string;
}

/**
 * Splits multi-word header labels into 2 lines so columns don't stretch unnecessarily wide,
 * e.g. "PROP NO" -> "PROP" and below "NO", "CONST TYPE" -> "CONST" and below "TYPE".
 */
/** The sort arrow of a sortable header (the label is formatted over two lines here, so this header draws its own button). */
function SortIcon({ direction }: { direction: 'asc' | 'desc' | null }) {
  const Icon = direction === 'asc' ? ArrowUp : direction === 'desc' ? ArrowDown : ArrowUpDown;
  return <Icon className={cn('w-3 h-3', direction ? 'opacity-100' : 'opacity-35')} />;
}

export function formatPtisHeaderLabel(label: string, align: 'left' | 'center' | 'right' = 'left'): React.ReactNode {
  const alignClass =
    align === 'right'
      ? 'items-end text-right'
      : align === 'center'
      ? 'items-center text-center'
      : 'items-start text-left';

  if (label.includes('\n')) {
    const parts = label.split('\n');
    return (
      <span className={cn('inline-flex flex-col leading-[1.15]', alignClass)}>
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {i > 0 && ' '}
            <span>{part}</span>
          </React.Fragment>
        ))}
      </span>
    );
  }

  const spaceIndex = label.indexOf(' ');
  if (spaceIndex > 0) {
    const line1 = label.slice(0, spaceIndex);
    const line2 = label.slice(spaceIndex + 1);
    return (
      <span className={cn('inline-flex flex-col leading-[1.15]', alignClass)}>
        <span>{line1}</span>
        {' '}
        <span>{line2}</span>
      </span>
    );
  }

  return <span>{label}</span>;
}

/** The header of one comparison table: every data column is a sort button (ascending, descending, off). */
export const PtisTableHeader: React.FC<PtisTableHeaderProps> = ({
  panel,
  columns,
  translate,
  theadClassName,
  rowClassName,
  sort,
  onSort,
  onClearSort,
  resetSortLabel,
}) => (
  <thead className={theadClassName}>
    <tr className={rowClassName}>
      {columns.map((col) => {
        const label = translate(col.labelKey) || col.defaultLabel;
        const title = translate(col.titleKey) || col.defaultTitle;
        const isIndex = col.key === 'action' || col.key === 'index';
        const direction = sortDirectionOf(sort, panel, col.key);
        const sortable = !!onSort && isApartmentColumnSortable(panel, col.key);
        const ariaSort = direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : sortable ? 'none' : undefined;

        const align: 'left' | 'center' | 'right' = col.className.includes('text-right')
          ? 'right'
          : col.className.includes('text-center')
          ? 'center'
          : 'left';
        const formattedLabel = formatPtisHeaderLabel(label, align);

        return (
          <th key={col.key} aria-sort={ariaSort} className={cn('whitespace-nowrap align-middle', col.className)}>
            {sortable ? (
              <Tooltip content={title} placement="top">
                <button
                  type="button"
                  onClick={() => onSort?.(panel, col.key)}
                  className="inline-flex items-center gap-1 whitespace-nowrap rounded cursor-pointer uppercase tracking-wider font-bold text-[10px] hover:opacity-75 focus:outline-none focus-visible:ring-1 focus-visible:ring-current"
                >
                  {formattedLabel}
                  <SortIcon direction={direction} />
                </button>
              </Tooltip>
            ) : isIndex && sort && onClearSort ? (
              <button
                type="button"
                onClick={onClearSort}
                title={resetSortLabel}
                aria-label={resetSortLabel}
                className="inline-flex items-center gap-0.5 rounded cursor-pointer hover:opacity-75"
              >
                <span>{label}</span>
                <RotateCcw className="w-3 h-3" />
              </button>
            ) : (
              <Tooltip content={title} placement="top">
                <span className="cursor-help inline-block">{formattedLabel}</span>
              </Tooltip>
            )}
          </th>
        );
      })}
    </tr>
  </thead>
);
