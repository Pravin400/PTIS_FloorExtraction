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
  sticky?: 'left' | 'right';
  stickyOffset?: string;
  stickyZIndex?: number;
  renderTh?: (col: Column<T>, index: number) => React.ReactNode;
}

export interface ExpandableMasterTableProps<T extends Record<string, unknown> = Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  /** Callback when page size changes. Only used if page size selector is enabled. */
  onPageSizeChange?: (size: number) => void;
  /** Controls whether pagination is enabled */
  isPagination?: boolean;
  /** Controls whether the page size selector dropdown is shown */
  isPageSize?: boolean;
  renderActions?: (row: T) => React.ReactNode;
  actionLabel?: string;
  actionHeaderAlign?: 'left' | 'center' | 'right';
  actionCellAlign?: 'left' | 'center' | 'right';
  actionHeaderClassName?: string;
  actionCellClassName?: string;
  getRowKey?: (row: T, index: number) => React.Key;
  maxBodyHeightClassName?: string;
  height?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  emptyText?: string;
  loadingText?: string;
  containerClassName?: string;
  tableClassName?: string;
  theadClassName?: string;
  customThead?: React.ReactNode;
  tbodyClassName?: string;
  rowClassName?: (row: T, index: number) => string;
  /** When true, omits the outer card border/bg and renders table content directly */
  bareCard?: boolean;

  /* ===== EXPANDABLE ROW REQUIREMENT ===== */
  /** Render expanded row content beneath the target row (wrapped in a single full-width td) */
  renderExpandedRow?: (row: T, index: number) => React.ReactNode;
  /** Render custom expanded row(s) directly without td wrapper, allowing multiple <tr> elements */
  renderCustomExpandedRows?: (row: T, index: number) => React.ReactNode;
  /** Custom class for expanded row <tr> */
  expandedRowClassName?: string;
  /** Custom class for expanded row <td> */
  expandedCellClassName?: string;

  /** Custom renderer for entire primary row if needed */
  renderRow?: (row: T, index: number, defaultRowNode: React.ReactNode) => React.ReactNode;

  /* ===== HEADER ===== */
  headerTitle?: string;
  headerSubtitle?: string;
  headerExtra?: React.ReactNode;

  /* ===== FOOTER ===== */
  footerLeftContent?: React.ReactNode;
  footerRightContent?: React.ReactNode;
  pageSizeOptions?: number[];
  footerClassName?: string;
  footerLeftClassName?: string;
  footerRightClassName?: string;
  paginationConfig?: PaginationConfig;

  /** Callback when a row is clicked */
  onRowClick?: (row: T, index: number) => void;
  /** Ref to attach to the inner scrollable container */
  scrollContainerRef?: React.Ref<HTMLDivElement>;
  /** Scroll event handler for inner container */
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
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
    >
      {pageSizeOptions.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function buildPagination(currentPage: number, totalPages: number): (number | 'dots')[] {
  const pages: (number | 'dots')[] = [];
  const maxButtons = 5;

  if (totalPages <= maxButtons) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }

  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, currentPage + 2);

  if (currentPage <= 3) {
    start = 1;
    end = 5;
  } else if (currentPage >= totalPages - 2) {
    start = totalPages - 4;
    end = totalPages;
  }

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push('dots');
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) pages.push('dots');
    pages.push(totalPages);
  }

  return pages;
}

export function ExpandableMasterTable<T extends Record<string, unknown> = Record<string, unknown>>({
  columns,
  data,
  loading = false,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
  isPagination = false,
  isPageSize = false,
  renderActions,
  actionLabel,
  actionHeaderAlign = 'center',
  actionCellAlign = 'center',
  actionHeaderClassName,
  actionCellClassName,
  getRowKey,
  maxBodyHeightClassName,
  height,
  emptyText,
  loadingText,
  containerClassName,
  tableClassName,
  theadClassName,
  customThead,
  tbodyClassName,
  rowClassName,
  bareCard = false,
  renderExpandedRow,
  renderCustomExpandedRows,
  expandedRowClassName,
  expandedCellClassName,
  renderRow,
  headerTitle,
  headerSubtitle,
  headerExtra,
  footerLeftContent,
  footerRightContent,
  pageSizeOptions = [10, 20, 50, 100],
  footerClassName,
  footerLeftClassName,
  footerRightClassName,
  paginationConfig,
  onRowClick,
  scrollContainerRef,
  onScroll,
}: ExpandableMasterTableProps<T>): React.ReactElement {
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

  const isPaginationEnabled = paginationConfig?.enabled ?? isPagination;
  const isPageSizeEnabled = paginationConfig?.showPageSizeSelector ?? isPageSize;

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

  const totalColSpan = columns.length + (hasActions ? 1 : 0);

  /* =========================
     TABLE CONTENT
  ========================= */
  const TableContent = (
    <div ref={scrollContainerRef} onScroll={onScroll} className={cn('overflow-auto', bodyHeightClass)}>
      <table className={cn('w-full text-sm', tableClassName)}>
        {customThead ? (
          customThead
        ) : (
          <thead
            className={cn(
              'sticky top-0 z-20',
              'bg-gradient-to-r from-[#E2EEFF] via-[#D6E8FF] to-[#E2EEFF]',
              'border-b border-blue-200',
              'transition-colors duration-200',
              'hover:from-[#D6E8FF] hover:via-[#CFE3FF] hover:to-[#D6E8FF]',
              theadClassName
            )}
          >
          <tr>
            {columns.map((col, index) => {
              const stickyStyle: React.CSSProperties = {
                width: col.width,
                ...(col.sticky === 'left' && typeof col.stickyOffset !== 'undefined'
                  ? { left: col.stickyOffset }
                  : {}),
                ...(col.sticky === 'right' && typeof col.stickyOffset !== 'undefined'
                  ? { right: col.stickyOffset }
                  : {}),
                ...(typeof col.stickyZIndex === 'number'
                  ? { zIndex: col.stickyZIndex }
                  : {}),
              };

              return (
                <th
                  key={String(col.key)}
                  style={stickyStyle}
                  className={cn(
                    'px-2 py-3 text-sm font-semibold text-[#1E3A8A]',
                    col.sticky && 'sticky',
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
                  {col.renderTh ? col.renderTh(col, index) : col.label}
                </th>
              );
            })}

            {hasActions && (
              <th
                className={cn(
                  'px-4 py-3 text-sm font-semibold text-[#1E3A8A]',
                  actionHeaderAlign === 'left'
                    ? 'text-left'
                    : actionHeaderAlign === 'right'
                      ? 'text-right'
                      : 'text-center',
                  actionHeaderClassName
                )}
              >
                {actualActionLabel}
              </th>
            )}
          </tr>
        </thead>
        )}

        <tbody className={tbodyClassName}>
          {loading ? (
            <tr>
              <td
                colSpan={totalColSpan}
                className="py-10 text-center text-gray-500"
              >
                {actualLoadingText}
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={totalColSpan}
                className="py-10 text-center text-gray-500"
              >
                {actualEmptyText}
              </td>
            </tr>
          ) : (
            data.map((row, i) => {
              const rowKey = getRowKey ? getRowKey(row, i) : i;
              const expandedContent = renderExpandedRow ? renderExpandedRow(row, i) : null;
              const customExpandedRows = renderCustomExpandedRows ? renderCustomExpandedRows(row, i) : null;

              const defaultRowNode = (
                <tr
                  onClick={() => onRowClick?.(row, i)}
                  className={cn(
                    'border-b border-blue-100 hover:bg-blue-50/40',
                    onRowClick ? 'cursor-pointer' : '',
                    rowClassName?.(row, i)
                  )}
                >
                  {columns.map((col) => {
                    const value = row[col.key];
                    const stickyStyle: React.CSSProperties = {
                      ...(col.sticky === 'left' && typeof col.stickyOffset !== 'undefined'
                        ? { left: col.stickyOffset }
                        : {}),
                      ...(col.sticky === 'right' && typeof col.stickyOffset !== 'undefined'
                        ? { right: col.stickyOffset }
                        : {}),
                      ...(typeof col.stickyZIndex === 'number'
                        ? { zIndex: col.stickyZIndex }
                        : {}),
                    };

                    return (
                      <td
                        key={String(col.key)}
                        style={stickyStyle}
                        className={cn(
                          'px-2 py-2 text-gray-700',
                          col.sticky && 'sticky',
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
                            <span className="font-medium">-</span>
                          )
                        ) : (
                          <span className="font-medium">
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
                    <td
                      className={cn(
                        'px-4 py-2',
                        actionCellAlign === 'left'
                          ? 'text-left'
                          : actionCellAlign === 'right'
                            ? 'text-right'
                            : 'text-center',
                        actionCellClassName
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-center gap-2',
                          actionCellAlign === 'left'
                            ? 'justify-start'
                            : actionCellAlign === 'right'
                              ? 'justify-end'
                              : 'justify-center'
                        )}
                      >
                        {renderActions?.(row)}
                      </div>
                    </td>
                  )}
                </tr>
              );

              return (
                <React.Fragment key={rowKey}>
                  {renderRow ? renderRow(row, i, defaultRowNode) : defaultRowNode}

                  {/* STANDARD EXPANDED SUB-ROW (Single TD colSpan) */}
                  {expandedContent && (
                    <tr className={cn('bg-slate-50/50', expandedRowClassName)}>
                      <td
                        colSpan={totalColSpan}
                        className={cn('p-3 border border-slate-300', expandedCellClassName)}
                      >
                        {expandedContent}
                      </td>
                    </tr>
                  )}

                  {/* CUSTOM MULTI-ROW EXPANSION (Direct TRs) */}
                  {customExpandedRows}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  if (bareCard) {
    return TableContent;
  }

  return (
    <div className={cn('flex flex-col gap-4', containerClassName)}>
      <div className="border border-blue-200 rounded-xl bg-white shadow-sm">
        {/* ================= HEADER ================= */}
        {hasHeader && (
          <div className="px-4 py-3 border-b rounded-t-xl border-blue-200 bg-[#F8FAFF] flex flex-col md:flex-row md:items-center justify-end gap-4">
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
              'bg-[#F8FAFF] border-t border-[#DCEAFF] rounded-b-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm',
              footerClassName
            )}
          >
            {/* LEFT SIDE: Custom Content OR Info Text + PageSize */}
            <div
              className={cn('flex flex-wrap items-center gap-3 text-sm text-[#6B7280]', footerLeftClassName)}
            >
              {footerLeftContent
                ? footerLeftContent
                : (isPaginationEnabled || isPageSizeEnabled) && (
                    <div data-testid="pagination-info" className="flex flex-wrap items-center gap-2">
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
                'flex flex-wrap items-center justify-end gap-2 max-w-full overflow-x-auto',
                footerRightClassName
              )}
            >
              {footerRightContent}

              {isPaginationEnabled &&
                typeof pageNumber === 'number' &&
                typeof totalPages === 'number' &&
                onPageChange && (
                  <div className="flex flex-wrap items-center gap-1 max-w-full">
                    <PrevPageButton
                      disabled={pageNumber <= 1}
                      onClick={() => onPageChange(pageNumber - 1)}
                    />

                    <div className="flex flex-wrap items-center gap-1">
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
