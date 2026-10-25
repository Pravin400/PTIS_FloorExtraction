'use client';

import React, { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import { ChevronRight, ChevronLeft, ChevronsUp, ChevronsDown } from 'lucide-react';
import { Tooltip } from '@/components/common/Tooltip';
import {
  FirstPageButton,
  LastPageButton,
  NextPageButton,
  PageNumberButton,
  PrevPageButton,
  IconOnlyActionButton,
} from '@/components/common/ActionButtons';

interface PageSizeSelectorProps {
  pageSize: number;
  pageSizeOptions: number[];
  onPageSizeChange?: (size: number) => void;
}

type PageToken = number | 'dots';

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
      className="ml-2 border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none bg-white disabled:opacity-50 disabled:bg-slate-100"
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

export interface Column<T extends Record<string, unknown> = Record<string, unknown>> {
  key: string;
  label: React.ReactNode;
  headerTooltip?: string | boolean;
  render?: (value: T[keyof T] | undefined, row: T, rowIndex: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  headerClassName?: string;
  cellClassName?: string;
  groupRowSpan?: boolean;
  onCellClick?: (e: React.MouseEvent) => void;
}

export interface RowGroup<T extends Record<string, unknown>> {
  srNo: number;
  row1?: T;
  row2: T;
}

export interface ApartmentQCMasterTableProps<T extends Record<string, unknown>> {
  data: T[] | RowGroup<T>[];
  columns: Column<T>[];
  loading?: boolean;
  dataMode?: 'flat' | 'grouped';

  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;

  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;

  onRowClick?: (row: T, index: number) => void;

  getRowKey?: (row: T | RowGroup<T>, index: number) => React.Key;

  header?: React.ReactNode;
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;

  className?: string;
  tableClassName?: string;
  theadClassName?: string;
  height?: string | number;
  pageSizeOptions?: number[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function ApartmentQCMasterTable<T extends Record<string, unknown>>({
  data,
  columns: initialColumns,
  loading = false,
  dataMode = 'flat',

  pageNumber,
  pageSize,
  totalCount,
  totalPages,

  onPageChange,
  onPageSizeChange,

  onRowClick,
  getRowKey,

  header,
  headerExtra,
  footer,

  tableClassName,
  theadClassName,
  height,
  pageSizeOptions = [5, 10, 20, 50],
  isExpanded,
  onToggleExpand,
}: ApartmentQCMasterTableProps<T>) {
  const t = useTranslations('common');
  const tQc = useTranslations('appartmentQC');
  const [hoveredGroupIndex, setHoveredGroupIndex] = useState<number | null>(null);
  const [isKYCExpanded, setIsKYCExpanded] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const isGrouped = dataMode === 'grouped';
  const groupedData: RowGroup<T>[] = isGrouped ? (data as RowGroup<T>[]) : [];
  const flatData: T[] = !isGrouped ? (data as T[]) : [];
  const pages = useMemo(
    () => (pageNumber && totalPages ? buildPagination(pageNumber, Math.max(1, totalPages)) : []),
    [pageNumber, totalPages]
  );

  const columns = useMemo(() => {
    const kycSequence = [
      'bhk',
      'wing',
      'flatOrShopNo',
      'flatOrShopName',
      'ownerName',
      'occupierName',
      'renterName',
      'mobileNo',
      'emailId',
    ];

    const desiredSequence = [
      'propertyNo',
      'rentMonthly',
      'floor',
      'constructionYear',
      'assessmentYear',
      'constructionType',
      'typeOfUse',
      'oldConstArea',
      'carpetArea',
      'builtupArea',
      'toiletCount',
      'ocDate',
      'propertyTypeName',
      'apartmentType',
      'rateableValue',
      'capitalValue',
      'newTaxTotalCV',
      'totalTax'
    ];

    const constTypeIndex = initialColumns.findIndex(c => c.key === 'constructionType');

    if (constTypeIndex === -1) {
      return initialColumns;
    }

    const presentKycColumns = kycSequence
      .map(key => initialColumns.find(c => c.key === key))
      .filter(Boolean) as Column<T>[];

    const kycToggleColumn: Column<T> = {
      key: 'kyc_toggle',
      groupRowSpan: true,
      headerTooltip: tQc('tooltips.kyc'),
      label: (
        <Tooltip
          content={
            <div className="max-w-xs  whitespace-normal">
              {tQc('tooltips.kyc')}
            </div>
          }
          placement="top"
        >
          <div className="flex items-center justify-center h-full py-1 font-semibold text-[11px] text-white">
            {tQc('columns.kyc')}
          </div>
        </Tooltip>
      ),
      cellClassName: 'text-center',
      onCellClick: (e) => {
        e.stopPropagation();
        setIsKYCExpanded(prev => {
          const next = !prev;
          if (next) {
            setIsBlinking(true);
            setTimeout(() => setIsBlinking(false), 1000);
          }
          return next;
        });
      },
      render: () => (
        <Tooltip content={isKYCExpanded ? tQc('tooltips.hideKycDetails') : tQc('tooltips.viewKycDetails')} placement="top">
          <div className="flex items-center justify-center cursor-pointer w-full h-full">
            <div className="flex items-center justify-center w-6 h-6 border rounded shadow-sm transition-all bg-white border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50">
              {isKYCExpanded ? <ChevronLeft className="w-3 h-3" strokeWidth={2.5} /> : <ChevronRight className="w-3 h-3" strokeWidth={2.5} />}
            </div>
          </div>
        </Tooltip>
      )
    };

    // First two columns (Sr.No and Type(Old/New))
    const firstTwoColumns = initialColumns.slice(0, 2);

    // Filter rest based on desired sequence
    const orderedRestColumns = desiredSequence
      .map(key => initialColumns.find(c => c.key === key))
      .filter(Boolean) as Column<T>[];

    // Find index to insert KYC (after propertyNo)
    const propertyNoIndex = orderedRestColumns.findIndex(c => c.key === 'propertyNo');
    const insertKycPos = propertyNoIndex !== -1 ? propertyNoIndex + 1 : 0;

    let kycGroup: Column<T>[] = [];
    if (isKYCExpanded) {
      const kycCols = presentKycColumns.map(col => ({
        ...col,
        cellClassName: cn(col.cellClassName, isBlinking && 'animate-pulse bg-blue-50 transition-all duration-300'),
        headerClassName: col.headerClassName
      }));
      kycGroup = [kycToggleColumn, ...kycCols];
    } else {
      kycGroup = [kycToggleColumn];
    }

    const result = [
      ...firstTwoColumns,
      ...orderedRestColumns.slice(0, insertKycPos),
      ...kycGroup,
      ...orderedRestColumns.slice(insertKycPos)
    ];

    return result;
  }, [initialColumns, isKYCExpanded, isBlinking, tQc]);

  const renderCellContent = (col: Column<T>, row: T, rowIndex: number) => {
    const value = row[col.key] as T[keyof T] | undefined;
    return col.render ? col.render(value, row, rowIndex) : String(value ?? '-');
  };

  return (
    <div className={cn('flex flex-col border border-blue-200 rounded-xl bg-white shadow-sm')}>
      {header}
      {headerExtra}

      <div className="border-slate-200 rounded-b-xl bg-white overflow-hidden border">
        <div className="overflow-auto" style={height ? { maxHeight: height } : undefined}>
          <table className={cn('w-full min-w-max border-collapse text-sm', tableClassName)}>
            <thead
              className={cn(
                'sticky top-0 z-20 border-0',
                'bg-[#1e3a8a]',
                theadClassName
              )}
            >
              <tr className="bg-[#1e3a8a] border-0 text-white">
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className={cn(
                      'px-1 py-1 text-[11px] font-semibold  uppercase tracking-wider text-white  border-rwhitespace-nowrap',
                      col.align === 'center'
                        ? 'text-center'
                        : col.align === 'right'
                          ? 'text-right'
                          : 'text-left',
                      col.headerClassName
                    )}
                    style={{ width: col.width }}
                  >
                    <span className="flex items-center  justify-center rounded-md border border-gray-400 text-xs text-slate-300 w-full h-full ">
                      {col.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="py-10 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-600"></div>
                      {/* eslint-disable-next-line i18next/no-literal-string */}
                      <span>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : isGrouped ? (
                groupedData.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="py-10 text-center text-slate-500">
                      {t('table.noData')}
                    </td>
                  </tr>
                ) : (
                  groupedData.map((group, groupIndex) => {
                    const hasOldRow = !!group.row1;
                    const isGroupHovered = hoveredGroupIndex === groupIndex;

                    return (
                      <React.Fragment key={groupIndex}>
                        {/* NEW ROW - Soft Green Theme */}
                        <tr
                          className={cn(
                            'cursor-pointer border-r-2 transition-colors duration-150 ',
                            isGroupHovered ? 'bg-emerald-100' : 'bg-white',
                            !hasOldRow && 'border-b-2 border-blue-200'
                          )}
                          onMouseEnter={() => setHoveredGroupIndex(groupIndex)}
                          onMouseLeave={() => setHoveredGroupIndex(null)}
                          onClick={() => onRowClick?.(group.row2, groupIndex)}
                        >
                          {columns.map((col) => {
                            return (
                              <td
                                key={String(col.key)}
                                rowSpan={col.groupRowSpan && hasOldRow ? 2 : undefined}
                                onClick={col.onCellClick}
                                className={cn(
                                  'px-3 text-slate-700 border-l  border-r border-blue-200',
                                  col.groupRowSpan && [
                                    'font-semibold text-center  align-middle border-l',
                                    isGroupHovered
                                      ? 'bg-emerald-100 border-emerald-500'
                                      : 'bg-emerald-50 border-emerald-400',
                                  ],
                                  col.key === 'Type(Old/New)' && [
                                    'border-l border-l-emerald-400',
                                    'border-r border-r-emerald-400',
                                  ],
                                  col.cellClassName
                                )}
                              >
                                {col.key === 'Type(Old/New)' ? (
                                  <div className="flex items-center justify-center">
                                    {renderCellContent(col, group.row2, groupIndex)}
                                  </div>
                                ) : (
                                  renderCellContent(col, group.row2, groupIndex)
                                )}
                              </td>
                            );
                          })}
                        </tr>

                        {/* OLD ROW - Soft Amber Theme */}
                        {hasOldRow && (
                          <tr
                            className={cn(
                              'cursor-pointer border-r transition-colors duration-150 border-b-2 border-blue-200',
                              isGroupHovered ? 'bg-amber-100' : 'bg-white'
                            )}
                            onMouseEnter={() => setHoveredGroupIndex(groupIndex)}
                            onMouseLeave={() => setHoveredGroupIndex(null)}
                            onClick={() => onRowClick?.(group.row1!, groupIndex)}
                          >
                            {columns.map((col) =>
                              col.groupRowSpan ? null : (
                                <td
                                  key={String(col.key)}
                                  onClick={col.onCellClick}
                                  className={cn(
                                    'px-3 text-slate-600 border-l border-blue-200 border-r',
                                    col.key === 'Type(Old/New)' && [
                                      'border-l border-l-blue-400',
                                      'border-r border-r-blue-400',
                                    ],
                                    col.cellClassName
                                  )}
                                >
                                  {col.key === 'Type(Old/New)' ? (
                                    <div className="flex items-center justify-center">
                                      {renderCellContent(col, group.row1!, groupIndex)}
                                    </div>
                                  ) : (
                                    renderCellContent(col, group.row1!, groupIndex)
                                  )}
                                </td>
                              )
                            )}
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )
              ) : (
                flatData.map((row, rowIndex) => (
                  <tr
                    key={getRowKey?.(row, rowIndex) ?? rowIndex}
                    className={cn(
                      'transition-colors duration-150 cursor-pointer border-b border-slate-200',
                      rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50',
                      'hover:bg-blue-100'
                    )}
                    onClick={() => onRowClick?.(row, rowIndex)}
                  >
                    {columns.map((col) => {
                      return (
                        <td key={String(col.key)} onClick={col.onCellClick} className="px-3 py-2.5 text-slate-700 border-l border-slate-100 border-r border-slate-100">
                          {renderCellContent(col, row, rowIndex)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer - Official Government Style */}
        <div className="bg-slate-50 border-t border-slate-200 rounded-b-xl px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <div data-testid="pagination-info" className="flex items-center gap-2">
              <span className="whitespace-nowrap">
                {t('table.showingEntries', {
                  start: totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1,
                  end: totalCount === 0 ? 0 : Math.min(pageNumber * pageSize, totalCount),
                  total: totalCount,
                })}
              </span>

              <PageSizeSelector
                pageSize={pageSize}
                pageSizeOptions={pageSizeOptions}
                onPageSizeChange={onPageSizeChange}
              />
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto">
            {onPageChange && (
              <div className="flex items-center gap-2">
                <PrevPageButton
                  disabled={pageNumber <= 1}
                  onClick={() => onPageChange(pageNumber - 1)}
                />

                <div className="flex items-center gap-1">
                  <FirstPageButton disabled={pageNumber === 1} onClick={() => onPageChange(1)} />

                  {pages.map((p, i) =>
                    p === 'dots' ? (
                      <span key={`dots-${i}`} className="px-2 text-slate-400">
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

            {onToggleExpand && (
              <Tooltip
                content={isExpanded ? tQc('tooltips.collapseTable') : tQc('tooltips.expandTable')}
                placement="top"
              >
                <IconOnlyActionButton
                  icon={isExpanded ? ChevronsUp : ChevronsDown}
                  onClick={onToggleExpand}
                  variant="secondary"
                  className="ml-2 !p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-md transition-colors"
                  aria-label={isExpanded ? tQc('tooltips.collapseTable') : tQc('tooltips.expandTable')}
                />
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {footer}
    </div>
  );
}


