"use client";

import { useTranslations } from "next-intl";
import {
  FirstPageButton,
  LastPageButton,
  NextPageButton,
  PageNumberButton,
  PrevPageButton,
} from "@/components/common/ActionButtons";

interface PropertySearchPaginationProps {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pages: (number | "dots")[];
  PAGE_SIZE_OPTIONS: number[];
}

export function PropertySearchPagination({
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pages,
  PAGE_SIZE_OPTIONS,
}: PropertySearchPaginationProps) {
  const tCommon = useTranslations("common");

  return (
    <div className="bg-[#F8FAFF] border-t border-[#DCEAFF] rounded-b-xl px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm text-xs">
      <div className="flex items-center gap-4 text-[#6B7280]">
        <div data-testid="pagination-info" className="flex items-center gap-2">
          <span className="whitespace-nowrap">
            {tCommon("table.showingEntries", {
              start: totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1,
              end: totalCount === 0 ? 0 : Math.min(pageNumber * pageSize, totalCount),
              total: totalCount,
            })}
          </span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="ml-2 border border-blue-200 rounded-md p-1 focus:ring-2 focus:ring-blue-500 outline-none bg-white disabled:opacity-50 text-xs"
            aria-label="Rows per page"
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto">
        <div className="flex items-center gap-2">
          <PrevPageButton
            disabled={pageNumber <= 1}
            onClick={() => onPageChange(pageNumber - 1)}
          />

          <div className="flex items-center gap-1">
            <FirstPageButton disabled={pageNumber === 1} onClick={() => onPageChange(1)} />

            {pages.map((p, index) =>
              p === "dots" ? (
                <span key={`dots-${index}`} className="px-2 text-[#94A3B8]">
                  ...
                </span>
              ) : (
                <PageNumberButton
                  key={`page-${p}-${index}`}
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
      </div>
    </div>
  );
}
