'use client';

import React, { useMemo } from 'react';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils/cn';

import { StatusBadge } from './StatusBadge';

import {
  FirstPageButton,
  LastPageButton,
  NextPageButton,
  PageNumberButton,
  PrevPageButton,
} from './ActionButtons';

export interface PaginationConfig {
  /** Whether pagination is enabled */

  enabled: boolean;

  /** Controls whether the page size selector dropdown is shown */

  showPageSizeSelector?: boolean;
}

interface PageSizeSelectorProps {
  pageSize: number;

  pageSizeOptions: number[];

  onPageSizeChange?: (size: number) => void;
}

function isPrimitive(val: unknown): val is string | number | boolean | null | undefined {
  return (
    typeof val === 'string' ||
    typeof val === 'number' ||
    typeof val === 'boolean' ||
    val === null ||
    typeof val === 'undefined'
  );
}

export interface Column<T extends Record<string, unknown> = Record<string, unknown>> {
  key: keyof T;

  label: string | React.ReactNode;

  width?: string;

  isStatus?: boolean;

  render?: (value: T[keyof T] | undefined, row: T, rowIndex: number) => React.ReactNode;

  headerClassName?: string;

  cellClassName?: string;

  align?: 'left' | 'center' | 'right';

  /** Optional function to determine rowSpan for a data cell. Return 0 to skip rendering. */
  rowSpan?: (row: T, rowIndex: number) => number;

  /** Optional function to determine colSpan for a data cell. Return 0 to skip rendering. */
  colSpan?: (row: T, rowIndex: number) => number;
}

export interface HeaderCell {
  key?: string;

  label: React.ReactNode;

  rowSpan?: number;

  colSpan?: number;

  headerClassName?: string;

  align?: 'left' | 'center' | 'right';
}

export interface AutomationTableProps<T extends Record<string, unknown> = Record<string, unknown>> {
  columns: Column<T>[];

  headerRows?: HeaderCell[][];

  data: T[];

  loading?: boolean;

  pageNumber?: number;

  pageSize?: number;

  totalCount?: number;

  totalPages?: number;

  onPageChange?: (page: number) => void;

  /**

   * Callback when page size changes.

   * Only used if page size selector is enabled.

   */

  onPageSizeChange?: (size: number) => void;

  /**

   * @deprecated Use paginationConfig.enabled instead.

   * Controls whether pagination is enabled.

   */

  isPagination?: boolean;

  /**

   * @deprecated Use paginationConfig.showPageSizeSelector instead.

   * Controls whether the page size selector dropdown is shown.

   */

  isPageSize?: boolean;

  renderActions?: (row: T) => React.ReactNode;

  actionLabel?: string;

  getRowKey?: (row: T, index: number) => React.Key;

  maxBodyHeightClassName?: string;

  height?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

  emptyText?: string;

  loadingText?: string;

  containerClassName?: string;

  tableClassName?: string;

  theadClassName?: string;

  rowClassName?: (row: T, index: number) => string;

  /* ===== HEADER ===== */

  headerTitle?: string;

  headerSubtitle?: string;

  headerExtra?: React.ReactNode;

  /* ===== FOOTER ===== */

  footerLeftContent?: React.ReactNode;

  footerRightContent?: React.ReactNode;

  pageSizeOptions?: number[];

  /** Custom className for the footer container */

  footerClassName?: string;

  /** Custom className for the footer left section */

  footerLeftClassName?: string;

  /** Custom className for the footer right section */

  footerRightClassName?: string;

  paginationConfig?: PaginationConfig;

  /** Callback when a row is clicked */
  onRowClick?: (row: T, index: number) => void;
}

function PageSizeSelector({
  pageSize,

  pageSizeOptions,

  onPageSizeChange,
}: PageSizeSelectorProps): React.ReactElement {
  return (
    <select
      value={pageSize}
      onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
      disabled={!onPageSizeChange}
      className="ml-2 border border-blue-200 rounded-md p-1 focus:ring-2 focus:ring-blue-500 outline-none bg-white disabled:opacity-50"
      aria-label="Rows per page"
    >
      {pageSizeOptions.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

type PageToken = number | 'dots';

/* =========================

   PAGINATION

========================= */

function buildPagination(current: number, total: number): PageToken[] {
  const pages: PageToken[] = [];

  const window = 3;

  const start = Math.max(1, current - Math.floor(window / 2));

  const end = Math.min(total, start + window - 1);

  if (start > 1) {
    pages.push(1);

    if (start > 2) pages.push('dots');
  }

  for (let i = start; i <= end; i++) pages.push(i);

  if (end < total) {
    if (end < total - 1) pages.push('dots');

    pages.push(total);
  }

  return pages;
}

/* =========================

   MASTER TABLE

========================= */

export function AutomationTable<T extends Record<string, unknown> = Record<string, unknown>>({
  columns,

  headerRows,

  data,

  loading,

  pageNumber,

  pageSize,

  totalCount,

  totalPages,

  onPageChange,

  onPageSizeChange,

  isPagination,

  isPageSize,

  actionLabel,

  renderActions,

  getRowKey,
  maxBodyHeightClassName,
  height,
  emptyText,

  loadingText,

  containerClassName,

  tableClassName,

  theadClassName,

  rowClassName,

  headerTitle,

  headerSubtitle,

  headerExtra,

  footerLeftContent,

  footerRightContent,

  pageSizeOptions = [5, 10, 20, 50],

  footerClassName,

  footerLeftClassName,

  footerRightClassName,

  paginationConfig,
  onRowClick,
}: AutomationTableProps<T>): React.ReactElement {
  const t = useTranslations('common');

  const HEIGHT_CLASSES = {
    xs: 'max-h-[300px]',
    sm: 'max-h-[400px]',
    md: 'max-h-[500px]',
    lg: 'max-h-[600px]',
    xl: 'max-h-[700px]',
    xxl: 'max-h-[800px]',
  };

  const bodyHeightClass = height
    ? HEIGHT_CLASSES[height]
    : maxBodyHeightClassName || 'max-h-[calc(100vh-260px)]';

  // Determine effective pagination settings

  const isPaginationEnabled = paginationConfig?.enabled ?? isPagination;

  const isPageSizeEnabled = paginationConfig?.showPageSizeSelector ?? isPageSize;

  // Use translations for default values

  const actualActionLabel = actionLabel || t('table.columns.actions');

  const actualEmptyText = emptyText || t('messages.noData');

  const actualLoadingText = loadingText || t('actions.loading');

  const hasActions = !!renderActions;

  const hasHeader = !!headerTitle || !!headerSubtitle || !!headerExtra;

  const hasFooter = !!(footerLeftContent || footerRightContent);

  const pages = useMemo(
    () => (pageNumber && totalPages ? buildPagination(pageNumber, Math.max(1, totalPages)) : []),

    [pageNumber, totalPages]
  );

  /* =========================

     TABLE

  ========================= */

  const TableContent = (
    <div className={cn('overflow-auto', bodyHeightClass)}>
      <table className={cn('w-full text-sm', tableClassName)}>
        <thead
          className={cn(
            'sticky top-0 z-20',

            !headerRows && 'bg-gradient-to-r from-[#E2EEFF] via-[#D6E8FF] to-[#E2EEFF]',

            !headerRows && 'border-b border-blue-200',

            !headerRows && 'transition-colors duration-200',

            !headerRows && 'hover:from-[#D6E8FF] hover:via-[#CFE3FF] hover:to-[#D6E8FF]',

            headerRows && 'bg-white shadow-sm',

            theadClassName
          )}
        >
          {headerRows ? (
            headerRows.map((row, rIndex) => (
              <tr key={`hrow-${rIndex}`} className={cn('font-medium text-slate-600', rIndex === 0 ? 'border-b border-slate-200 font-semibold text-slate-700' : 'border-b border-slate-200')}>
                {row.map((cell, cIndex) => (
                  <th
                    key={cell.key || `hcell-${rIndex}-${cIndex}`}
                    colSpan={cell.colSpan}
                    rowSpan={cell.rowSpan}
                    className={cn(
                      'px-2 py-2 border-r border-slate-200 last:border-r-0',
                      cell.align === 'center'
                        ? 'text-center'
                        : cell.align === 'right'
                          ? 'text-right'
                          : 'text-left',
                      cell.headerClassName
                    )}
                  >
                    {cell.label}
                  </th>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              {columns.map((col, index) => (
                <th
                  key={`${String(col.key)}-${index}`}
                  style={{ width: col.width }}
                  className={cn(
                    'px-2 py-3 text-sm font-semibold text-[#1E3A8A]',

                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                        ? 'text-right'
                        : 'text-left',

                    index === 0 && 'rounded-tl-lg',

                    !hasActions && index === columns.length - 1 && 'rounded-tr-lg',

                    col.headerClassName
                  )}
                >
                  {col.label}
                </th>
              ))}

              {hasActions && (
                <th className="px-4 py-3 text-center text-sm font-semibold text-[#1E3A8A]">
                  {actualActionLabel}
                </th>
              )}
            </tr>
          )}
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length + (hasActions ? 1 : 0)}
                className="py-10 text-center text-gray-500"
              >
                {actualLoadingText}
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (hasActions ? 1 : 0)}
                className="py-10 text-center text-gray-500"
              >
                {actualEmptyText}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={getRowKey ? getRowKey(row, i) : i}
                onClick={() => onRowClick?.(row, i)}
                className={cn(
                  'border-b border-blue-100 hover:bg-blue-50/40',
                  onRowClick ? 'cursor-pointer' : '',
                  rowClassName?.(row, i)
                )}
              >
                {columns.map((col, colIndex) => {
                  const value = row[col.key];
                  const colSpan = col.colSpan ? col.colSpan(row, i) : undefined;
                  const rowSpan = col.rowSpan ? col.rowSpan(row, i) : undefined;

                  // If colSpan or rowSpan is explicitly 0, we skip rendering this cell (it's merged into another)
                  if (colSpan === 0 || rowSpan === 0) return null;

                  return (
                    <td
                      key={`${String(col.key)}-${colIndex}`}
                      colSpan={colSpan}
                      rowSpan={rowSpan}
                      className={cn(
                        'px-2 py-2 text-gray-700',

                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                            ? 'text-right'
                            : 'text-left',

                        col.cellClassName
                      )}
                    >
                      {col.render ? (
                        col.render(value, row, i)
                      ) : col.isStatus ? (
                        isPrimitive(value) ? (
                          <StatusBadge value={value ?? null} variant="status" />
                        ) : (
                          <span>-</span>
                        )
                      ) : (
                        <span>
                          {value === null || typeof value === 'undefined'
                            ? '-'
                            : isPrimitive(value)
                              ? String(value)
                              : '-'}
                        </span>
                      )}
                    </td>
                  );
                })}

                {hasActions && (
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {renderActions?.(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className={cn('flex flex-col gap-4', containerClassName)}>
      <div className="border border-blue-200 rounded-xl bg-white shadow-sm">
        {/* ================= HEADER ================= */}

        {hasHeader && (
          <div className="px-4 py-2 border-b rounded-t-xl border-blue-200 bg-[#F8FAFF] flex flex-col md:flex-row md:items-center justify-end gap-4">
            {(headerTitle || headerSubtitle) && (
              <div className="w-full">
                {headerTitle && (
                  <h3 className="text-sm font-semibold text-[#1E3A8A]">{headerTitle}</h3>
                )}

                {headerSubtitle && <p className="text-sm text-[#6B7280] mt-1">{headerSubtitle}</p>}
              </div>
            )}
            {headerExtra && <div className="flex items-center gap-2 w-full">{headerExtra}</div>}
          </div>
        )}

        {/* ================= TABLE ================= */}

        {TableContent}

        {/* ================= FOOTER / PAGINATION ================= */}

        {(hasFooter || isPaginationEnabled || isPageSizeEnabled) && (
          <div
            className={cn(
              'bg-[#F8FAFF] border-t border-[#DCEAFF] rounded-b-xl px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm',
              footerClassName
            )}
          >
            {/* LEFT SIDE: Custom Content OR Info Text + PageSize */}
            <div
              className={cn('flex items-center gap-4 text-sm text-[#6B7280]', footerLeftClassName)}
            >
              {footerLeftContent
                ? footerLeftContent
                : (isPaginationEnabled || isPageSizeEnabled) && (
                  <div data-testid="pagination-info" className="flex items-center gap-2">
                    {/* Show counts only if pagination enabled */}

                    {isPaginationEnabled && (
                      <span className="whitespace-nowrap">
                        {t('table.showingEntries', {
                          start:
                            totalCount === 0 ? 0 : ((pageNumber || 1) - 1) * (pageSize || 10) + 1,

                          end:
                            totalCount === 0
                              ? 0
                              : Math.min((pageNumber || 1) * (pageSize || 10), totalCount || 0),

                          total: totalCount || 0,
                        })}
                      </span>
                    )}

                    {/* Show PageSize selector if enabled and onPageSizeChange is provided */}

                    {isPageSizeEnabled && (
                      <PageSizeSelector
                        pageSize={pageSize || 10}
                        pageSizeOptions={pageSizeOptions}
                        onPageSizeChange={onPageSizeChange}
                      />
                    )}
                  </div>
                )}
            </div>

            {/* RIGHT SIDE: Custom Content + Pagination Controls */}
            <div
              className={cn(
                'flex items-center justify-between md:justify-end gap-2 w-full md:w-auto',
                footerRightClassName
              )}
            >
              {footerRightContent}

              {/* RIGHT SIDE: Pagination Controls */}

              {isPaginationEnabled &&
                typeof pageNumber === 'number' &&
                typeof totalPages === 'number' &&
                onPageChange && (
                  <div className="flex items-center gap-2">
                    <PrevPageButton
                      disabled={pageNumber <= 1}
                      onClick={() => onPageChange(pageNumber - 1)}
                    />

                    <div className="flex items-center gap-1">
                      <FirstPageButton
                        disabled={pageNumber === 1}
                        onClick={() => onPageChange(1)}
                      />

                      {pages.map((p, i) =>
                        p === 'dots' ? (
                          <span key={`dots-${i}`} className="px-2 text-[#94A3B8]">
                            ...
                          </span>
                        ) : (
                          <PageNumberButton
                            key={`page-${p}-${i}`}
                            page={p as number}
                            active={pageNumber === p}
                            onClick={() => onPageChange(p as number)}
                          />
                        )
                      )}

                      <LastPageButton
                        disabled={pageNumber === totalPages}
                        onClick={() => onPageChange(totalPages)}
                      />
                    </div>

                    <NextPageButton
                      disabled={pageNumber >= totalPages}
                      onClick={() => onPageChange(pageNumber + 1)}
                    />
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}