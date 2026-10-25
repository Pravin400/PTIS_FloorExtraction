"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import { FirstPageButton, LastPageButton, NextPageButton, PageNumberButton, PrevPageButton } from "./ActionButtons";

/* ---------- Card List ---------- */

export interface CardListProps<T> {
  data: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  emptyText?: string;
  emptyIcon?: React.ReactNode;
  maxHeightClassName?: string;
  className?: string;
}

export function CardList<T>({
  data,
  renderCard,
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
  emptyText,
  emptyIcon,
  maxHeightClassName = "max-h-[570px]",
  className,
}: CardListProps<T>) {
  return (
    <div className={cn("bg-white border border-[#DCEAFF] rounded-2xl shadow-sm overflow-hidden", className)}>
      <div className="p-2">
        <div className={cn("flex flex-wrap -mx-2 overflow-y-auto overflow-x-visible", maxHeightClassName)}>
          {data.length === 0 ? (
            <div className="w-full text-center py-8 text-gray-500">
              {emptyIcon}
              <p className="text-sm">{emptyText || "No data available"}</p>
            </div>
          ) : (
            data.map((item, index) => renderCard(item, index))
          )}
        </div>
      </div>

      <CardPagination
        pageNumber={pageNumber}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={pageSizeOptions}
        className="border-t border-[#DCEAFF] rounded-none shadow-none"
      />
    </div>
  );
}

/* ---------- Helpers ---------- */

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

/* ---------- Pagination Control ---------- */
export interface CardPaginationProps {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export const CardPagination = ({
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  className = "",
}: CardPaginationProps) => {
  const t = useTranslations("common");

  // Clamp pageNumber to valid range
  const safeTotalPages = Math.max(1, totalPages);
  const clampedPageNumber = Math.min(Math.max(1, pageNumber), safeTotalPages);

  const pages = React.useMemo(
    () => buildPagination(clampedPageNumber, totalPages),
    [clampedPageNumber, totalPages]
  );

  // If there are no items, show page 1 of 1 and disable all navigation
  const isEmpty = totalCount === 0 || totalPages === 0;
  const start = isEmpty ? 0 : (clampedPageNumber - 1) * pageSize + 1;
  const end = isEmpty ? 0 : Math.min(clampedPageNumber * pageSize, totalCount);

  return (
    <div
      className={cn(
        "bg-[#F8FAFF] border border-[#DCEAFF] rounded-xl px-4 py-1 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm text-[#6B7280]">
        <>
          {t("table.showingEntries", { start, end, total: totalCount })}
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            disabled={!onPageSizeChange}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed mx-1"
          >
            {pageSizeOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto">
        <PrevPageButton
          disabled={clampedPageNumber <= 1 || isEmpty}
          onClick={() => onPageChange(clampedPageNumber - 1)}
        />

        <span className="md:hidden text-sm font-semibold text-[#1E3A8A]">
          {t("table.page", { current: isEmpty ? 1 : clampedPageNumber, total: isEmpty ? 1 : totalPages })}
        </span>

        <div className="hidden md:flex items-center gap-1">
          <FirstPageButton
            disabled={clampedPageNumber === 1 || isEmpty}
            onClick={() => onPageChange(1)}
          />

          {pages.map((p, i) =>
            p === "dots" ? (
              <span key={`dots-${i}`} className="px-2 text-[#94A3B8]"> ... </span>
            ) : (
              <PageNumberButton
                key={`page-${p}-${i}`}
                page={p as number}
                active={clampedPageNumber === p}
                onClick={() => onPageChange(p as number)}
              />
            )
          )}

          <LastPageButton
            disabled={clampedPageNumber === totalPages || isEmpty}
            onClick={() => onPageChange(Math.max(1, totalPages))}
          />
        </div>

        <NextPageButton
          disabled={clampedPageNumber >= totalPages || isEmpty}
          onClick={() => onPageChange(clampedPageNumber + 1)}
        />
      </div>
    </div>
  );
};
