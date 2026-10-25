"use client";
import React from "react";
import { Tooltip } from "./Tooltip";
import { cn } from "@/lib/utils/cn";
import { MatrixCellInput } from "./MatrixCellInput";
import { MatrixDeleteButton } from "./MatrixDeleteButton";
import { useTranslations } from "next-intl";
import {
  FirstPageButton,
  LastPageButton,
  NextPageButton,
  PageNumberButton,
  PrevPageButton,
} from "./ActionButtons";
 
/* ================= TYPES ================= */
 
export interface MatrixColumn {
  id: string;
  label: string | React.ReactNode;
  unit?: string;
  headerClassName?: string;
  tooltip?: string;
  width?: string;
}
 
export interface MatrixRow {
  id: string;
  cells: Record<string, string | number | undefined | null>;
  meta?: Record<string, React.ReactNode>;
}
 
export interface MatrixGridPaginationProps {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}
 
export interface MatrixGridProps {
  columns: MatrixColumn[];
  rows: MatrixRow[];
  metaColumns?: { id: string; label: string | React.ReactNode; width?: string; tooltip?: string }[];
  colorMap?: Record<string, string>;
  mode?: "view" | "edit";
  editableColumns?: string[];
  editableRowId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCellChange?: (rowId: string, columnId: string, value: any) => void;
  onCellKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onRowDelete?: (index: number) => void;
  getCellClassName?: (value: unknown, rowId: string, columnId: string) => string;
  translations: {
    action: string;
    currencySymbol?: string;
    deleteRow: string;
  };
  pagination?: MatrixGridPaginationProps;
  /** Maximum value allowed in editable cells (default: 9999) */
  cellMaxValue?: number;
  allowZero?: boolean;
}
 
/* ================= HELPER FUNCTIONS ================= */
 
/**
 * Build pagination tokens for display
 */
type PageToken = number | "dots";
 
function buildPagination(current: number, total: number): PageToken[] {
  const windowSize = 3;
  const pages: PageToken[] = [];
 
  let start = Math.max(1, current - Math.floor(windowSize / 2));
  const end = Math.min(total, start + windowSize - 1);
 
  // Shift window left if near the end
  if (end - start < windowSize - 1) {
    start = Math.max(1, end - windowSize + 1);
  }
 
  // Leading edge
  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push("dots");
  }
 
  // Middle window
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
 
  // Trailing edge
  if (end < total) {
    if (end < total - 1) pages.push("dots");
    pages.push(total);
  }
 
  return pages;
}
 
/* ================= PAGINATION COMPONENT ================= */
 
export const MatrixGridPagination = ({
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
}: MatrixGridPaginationProps) => {
  const t = useTranslations("common");
 
  // Clamp totalPages to at least 1
  const clampedTotalPages = Math.max(1, totalPages);
  const pages = React.useMemo(
    () => buildPagination(pageNumber, clampedTotalPages),
    [pageNumber, clampedTotalPages]
  );
 
  return (
    <div className="bg-[#F8FAFF] border border-[#DCEAFF] rounded-xl px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-[#6B7280]">
        {(() => {
          const start = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
          const end = Math.min(pageNumber * pageSize, totalCount);
          return (
            <>
              {t("table.showingEntries", { start, end, total: totalCount })}
              <span className="ml-2">
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
                  disabled={!onPageSizeChange}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed mx-1"
                  aria-label={t("table.rowsPerPage")}
                >
                  {pageSizeOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </span>
            </>
          );
        })()}
      </div>
 
      <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto">
        <PrevPageButton
          disabled={pageNumber <= 1 || clampedTotalPages <= 1}
          onClick={() => onPageChange(Math.max(1, pageNumber - 1))}
        />
 
        <span className="md:hidden text-sm font-semibold text-[#1E3A8A]">
          {t("table.page", { current: pageNumber, total: clampedTotalPages })}
        </span>
 
        <div className="hidden md:flex items-center gap-1">
          <FirstPageButton
            disabled={pageNumber === 1 || clampedTotalPages <= 1}
            onClick={() => onPageChange(1)}
          />
 
          {pages.map((p, i) =>
            p === "dots" ? (
              <span key={`dots-${i}`} className="px-2 text-[#94A3B8]">
                ...
              </span>
            ) : (
              <PageNumberButton
                key={`page-${p}-${i}`}
                page={p as number}
                active={pageNumber === p}
                onClick={() => onPageChange(Math.max(1, p as number))}
              />
            )
          )}
 
          <LastPageButton
            disabled={pageNumber === clampedTotalPages || clampedTotalPages <= 1}
            onClick={() => onPageChange(clampedTotalPages)}
          />
        </div>
 
        <NextPageButton
          disabled={pageNumber >= clampedTotalPages || clampedTotalPages <= 1}
          onClick={() => onPageChange(Math.max(1, pageNumber + 1))}
        />
      </div>
    </div>
  );
};
 
/* ================= COMPONENT ================= */
 
export const MatrixGrid = ({
  columns,
  rows,
  metaColumns = [],
  colorMap = {},
  mode = "view",
  editableColumns = [],
  editableRowId,
  onCellChange,
  onCellKeyDown,
  onRowDelete,
  getCellClassName,
  translations,
  pagination,
  cellMaxValue,
  allowZero = false,
}: MatrixGridProps): React.ReactElement => {
  const isEditable = mode === "edit";
 
  // Separate rate columns
  const rateColumns: MatrixColumn[] = columns.filter(
    (col) => !metaColumns.some((meta) => meta.id === col.id)
  );
 
  const totalColumns: number =
    metaColumns.length + rateColumns.length + (onRowDelete ? 1 : 0);
 
  return (
    <div className="w-full">
      {/* Table wrapper - parent controls scroll, we just set min-width */}
      <table
        aria-label="Matrix grid"
        aria-colcount={totalColumns}
        style={{
          minWidth: `${280 + rateColumns.length * 120 + (onRowDelete ? 80 : 0)}px`,
        }}
        className="bg-white rounded-lg md:rounded-2xl shadow-lg border-collapse w-full"
      >
        {/* ================= HEADER - Sticky ================= */}
        <thead className="sticky top-0 z-20">
          <tr className="bg-blue-50">
            {/* Meta headers - first column sticky left */}
            {metaColumns.map((meta, idx) => {
              const headerInnerContent = <span>{meta.label}</span>;
 
              return (
                <th
                  key={meta.id || `meta-${idx}`}
                  scope="col"
                  role="columnheader"
                  className={cn(
                    "px-1 md:px-2 py-2 h-7 font-bold text-xs md:text-sm text-center text-blue-700 bg-blue-50 whitespace-nowrap",
                    idx === 0 && "sticky left-0 z-30 bg-blue-50"
                  )}
                  style={{ minWidth: meta.width || "120px" }}
                >
                  {meta.tooltip ? (
                    <Tooltip content={meta.tooltip} placement="top">
                      {headerInnerContent}
                    </Tooltip>
                  ) : (
                    headerInnerContent
                  )}
                </th>
              );
            })}
 
            {/* Rate headers */}
            {rateColumns.map((col, colIdx) => {
              const colorClass: string =
                colorMap[col.id?.toUpperCase()] || col.headerClassName || "bg-blue-50 text-blue-700";
 
              const headerInnerContent = (
                <div>
                  <div>{col.label}</div>
                  {col.unit && (
                    <div className="text-[9px] md:text-[10px] mt-0.5 opacity-75">
                      ({col.unit})
                    </div>
                  )}
                </div>
              );
 
              return (
                <th
                  key={col.id || `col-${colIdx}`}
                  scope="col"
                  role="columnheader"
                  className={cn(
                    "px-1 py-1 h-7 text-xs font-semibold text-center bg-blue-50",
                    colorClass
                  )}
                  style={{ minWidth: col.width || "100px" }}
                >
                  {col.tooltip ? (
                    <Tooltip content={col.tooltip} placement="top">
                      {headerInnerContent}
                    </Tooltip>
                  ) : (
                    headerInnerContent
                  )}
                </th>
              );
            })}
 
            {/* Action header */}
            {onRowDelete && (
              <th
                scope="col"
                className="px-2 md:px-3 py-3 md:py-4 bg-blue-50 text-sm md:text-base text-blue-700 font-semibold text-center"
                style={{ minWidth: "80px" }}
              >
                {translations.action}
              </th>
            )}
          </tr>
        </thead>
 
        {/* ================= ROWS ================= */}
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.id || `row-${rowIndex}`} className="bg-white hover:bg-gray-50">
              {/* Meta cells - first column sticky left */}
              {metaColumns.map((meta, idx) => {
                // Get tooltip from row meta (e.g., zoneNo_tooltip) or use meta.tooltip as fallback
                const tooltipContent = (row.meta?.[`${meta.id}_tooltip`] as string) || meta.tooltip;
 
                // Special styling for Tax Zone No tooltips - smaller and closer
                const isZoneNoTooltip = meta.id === "zoneNo";
                const tooltipClassName = isZoneNoTooltip
                  ? "!min-w-[60px] !max-w-[120px] !px-2 !py-1 !text-[10px]"
                  : "";

                const cellInnerContent = (
                  <div className="px-1 md:px-2 py-1 md:py-1 bg-white rounded-md md:rounded-lg font-medium text-xs md:text-sm text-gray-700 border border-gray-300 text-center">
                    {row.meta?.[meta.id]}
                  </div>
                );
 
                return (
                  <td
                    key={meta.id || `meta-cell-${idx}`}
                    className={cn(
                      "px-0.5 md:px-1 py-1 md:py-1",
                      idx === 0 && "sticky left-0 z-10 bg-white"
                    )}
                  >
                    {tooltipContent ? (
                      <Tooltip content={tooltipContent} placement="top" className={tooltipClassName}>
                        {cellInnerContent}
                      </Tooltip>
                    ) : (
                      cellInnerContent
                    )}
                  </td>
                );
              })}
 
              {/* Rate cells */}
              {rateColumns.map((col, colIdx) => {
                const colorClass: string = colorMap[col.id?.toUpperCase?.()] || colorMap[col.id?.toLowerCase?.()] || "";
                const rawValue = row.cells[col.id];
                const value: number | undefined = rawValue !== undefined && rawValue !== null && rawValue !== ""
                  ? Number(rawValue)
                  : (allowZero ? undefined : 0);
 
                const canEdit: boolean =
                  isEditable &&
                  (!editableRowId || row.id === editableRowId) &&
                  editableColumns.includes(col.id) &&
                  typeof onCellChange === "function";
 
                const customCellClass =
                  getCellClassName && !canEdit ? getCellClassName(value, row.id, col.id) : "";
 
                const metaValue = row.meta?.[metaColumns[0]?.id];
                const labelText = typeof col.label === 'string' ? col.label : col.id;
                const metaText = typeof metaValue === 'string' || typeof metaValue === 'number'
                  ? String(metaValue)
                  : row.id;
                const metaLabel = `${labelText} for ${metaText}`;
 
                if (canEdit) {
                  return (
                    <td key={col.id || `cell-${colIdx}`} className="px-0.5 md:px-1 py-1 md:py-1">
                      <MatrixCellInput
                        value={value}
                        rowId={row.id}
                        columnId={col.id}
                        metaLabel={metaLabel}
                        colorClass={colorClass}
                        className={customCellClass}
                        readOnly={false}
                        maxValue={cellMaxValue}
                        onCellChange={onCellChange}
                        onKeyDown={onCellKeyDown}
                        allowZero={allowZero}
                      />
                    </td>
                  );
                }

                // View mode or non-editable column
                const hasValue = value !== undefined && (value > 0 || (value === 0 && allowZero));
                return (
                  <td key={col.id || `cell-${colIdx}`} className="px-0.5 md:px-1 py-1 md:py-1 text-center">
                    <div
                      className={cn(
                        "px-1 md:px-2 py-1 md:py-1 rounded-md md:rounded-lg font-bold text-xs md:text-sm text-center border w-full",
                        hasValue ? "bg-blue-50 text-blue-800 border-blue-300" : "bg-gray-50 text-gray-500 border-gray-200",
                        colorClass,
                        customCellClass
                      )}
                    >
                      {value !== undefined ? String(Number(Number(value).toFixed(2))) : "0"}
                    </div>
                  </td>
                );
              })}
 
              {/* Action cell */}
              {onRowDelete && (
                <td className="px-0.5 md:px-1 py-1 md:py-1 text-center">
                  <MatrixDeleteButton
                    rowIndex={rowIndex}
                    onRowDelete={onRowDelete}
                    ariaLabel={translations.deleteRow}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
 
      {/* ================= PAGINATION (Outside scrollable container) ================= */}
      {pagination && (
        <div className="mt-4">
          <MatrixGridPagination {...pagination} />
        </div>
      )}
    </div>
  );
};
MatrixGrid.displayName = 'MatrixGrid';