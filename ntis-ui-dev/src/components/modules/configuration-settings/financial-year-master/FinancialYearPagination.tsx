"use client";

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  FirstPageButton,
  LastPageButton,
  NextPageButton,
  PrevPageButton,
  Select,
} from '@/components/common';
import { PageNumberButton } from '@/components/common/ActionButtons';

type PageToken = number | 'dots';

function buildPagination(current: number, total: number): PageToken[] {
  const pages: PageToken[] = [];
  const windowSize = 3;
  const start = Math.max(1, current - Math.floor(windowSize / 2));
  const end = Math.min(total, start + windowSize - 1);

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

interface FinancialYearPaginationProps {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
}

export function FinancialYearPagination({
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  pageSizeOptions = [5, 10, 20, 50],
  onPageSizeChange,
}: FinancialYearPaginationProps) {
  const tCommon = useTranslations('common');
  const pages = useMemo(
    () => buildPagination(pageNumber, Math.max(1, totalPages)),
    [pageNumber, totalPages]
  );

  const start = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const end = totalCount === 0 ? 0 : Math.min(pageNumber * pageSize, totalCount);

  return (
    <div className="bg-[#F8FAFF] border-t border-[#DCEAFF] rounded-b-xl px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm">
      <div className="flex items-center gap-4 text-sm text-[#6B7280]">
         <span className="whitespace-nowrap font-medium text-[#1E3A8A]">
          {tCommon('table.showingEntries', { start, end, total: totalCount })}
        </span>
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-[#6B7280] whitespace-nowrap">{tCommon('table.rowsPerPage')}:</span>
            <Select
              value={String(pageSize)}
              options={pageSizeOptions.map((s) => ({ label: String(s), value: String(s) }))}
              onChange={(_, val) => onPageSizeChange(Number(val))}
              selectSize="sm"
              className="w-20"
              ariaLabel="Rows per page"
            />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto">
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
      </div>
    </div>
  );
}
