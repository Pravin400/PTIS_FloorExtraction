'use client';

import { useTranslations } from 'next-intl';
import {
  Button,
  FirstPageButton,
  PrevPageButton,
  NextPageButton,
  LastPageButton,
} from '@/components/common';

interface AssetRegisterTablePaginationProps {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  pageNumbers: number[];
  handlePageChange: (page: number) => void;
  handlePageSizeChange: (size: number) => void;
}

export function AssetRegisterTablePagination({
  totalCount,
  pageNumber,
  pageSize,
  totalPages,
  pageNumbers,
  handlePageChange,
  handlePageSizeChange,
}: AssetRegisterTablePaginationProps) {
  const t = useTranslations('assetRegister');
  const startEntry = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const endEntry = Math.min(pageNumber * pageSize, totalCount);

  return (
    <div className="px-3 py-1.5 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
      <div className="flex items-center space-x-3">
        <span>
          {t('Showing_assets_range', { start: startEntry, end: endEntry, total: totalCount })}
        </span>
        <select
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          className="bg-white text-slate-700 border border-slate-200 rounded px-2 py-1 text-xs font-semibold focus:outline-none shadow-2xs cursor-pointer hover:border-slate-300"
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </div>

      <div className="flex items-center space-x-1">
        {/* First Page */}
        <FirstPageButton
          disabled={pageNumber <= 1}
          onClick={() => handlePageChange(1)}
          className="!p-1.5 !h-auto !w-auto !rounded hover:!bg-slate-200 !text-slate-500 disabled:!opacity-40 !border-none !shadow-none !bg-transparent transition-colors cursor-pointer"
          aria-label={t('First_Page') || 'First Page'}
        />

        {/* Prev Page */}
        <PrevPageButton
          disabled={pageNumber <= 1}
          onClick={() => handlePageChange(pageNumber - 1)}
          className="!p-1.5 !h-auto !w-auto !rounded hover:!bg-slate-200 !text-slate-500 disabled:!opacity-40 !border-none !shadow-none !bg-transparent transition-colors cursor-pointer"
          aria-label={t('Previous_Page') || 'Previous Page'}
        />

        {/* Page number buttons */}
        {pageNumbers.map((p) => (
          <Button
            key={`page-${p}`}
            variant="ghost"
            size="xs"
            onClick={() => handlePageChange(p)}
            className={`!w-7 !h-7 !min-w-0 !px-0 !gap-0 !rounded-md !text-xs !font-bold !transition-colors !duration-150 cursor-pointer focus:!ring-0 focus:!ring-offset-0 focus-visible:![outline-style:auto] ${
              p === pageNumber
                ? '!bg-[#1E64E6] hover:!bg-[#1E64E6] !text-white !shadow-xs'
                : '!bg-transparent !text-slate-700 hover:!bg-slate-200 !shadow-none'
            }`}
          >
            {p}
          </Button>
        ))}

        {/* Next Page */}
        <NextPageButton
          disabled={pageNumber >= totalPages}
          onClick={() => handlePageChange(pageNumber + 1)}
          className="!p-1.5 !h-auto !w-auto !rounded hover:!bg-slate-200 !text-slate-600 disabled:!opacity-40 !border-none !shadow-none !bg-transparent transition-colors cursor-pointer"
          aria-label={t('Next_Page') || 'Next Page'}
        />

        {/* Last Page */}
        <LastPageButton
          disabled={pageNumber >= totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="!p-1.5 !h-auto !w-auto !rounded hover:!bg-slate-200 !text-slate-600 disabled:!opacity-40 !border-none !shadow-none !bg-transparent transition-colors cursor-pointer"
          aria-label={t('Last_Page') || 'Last Page'}
        />
      </div>
    </div>
  );
}
