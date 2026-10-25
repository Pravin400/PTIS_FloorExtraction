'use client';

import type { UnitPoolPaginationProps } from '@/types/asset/floor-details.types';

export function UnitPoolPagination({
  totalRows,
  activePage,
  totalPages,
  PAGE_SIZE,
  setCurrentPage,
}: UnitPoolPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="px-3 py-1 flex items-center justify-between bg-[#FAFBFD] border border-t-0 border-slate-200 rounded-b-xl shrink-0 h-[28px] text-[10px] select-none shadow-sm">
      <span className="text-slate-500 font-bold">
        {'Showing '}{((activePage - 1) * PAGE_SIZE) + 1}{'–'}{Math.min(activePage * PAGE_SIZE, totalRows)}{' of '}{totalRows}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setCurrentPage(1)}
          disabled={activePage === 1}
          className="w-6 h-[20px] flex items-center justify-center border border-slate-200 rounded text-[10px] font-black bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-sm"
        >
          &laquo;
        </button>
        <button
          type="button"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={activePage === 1}
          className="w-6 h-[20px] flex items-center justify-center border border-slate-200 rounded text-[10px] font-black bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-sm"
        >
          ‹
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => setCurrentPage(page)}
            className={`w-6 h-[20px] flex items-center justify-center rounded text-[10px] font-black transition-colors cursor-pointer ${
              activePage === page
                ? 'bg-blue-600 text-white shadow-sm font-black'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={activePage === totalPages}
          className="w-6 h-[20px] flex items-center justify-center border border-slate-200 rounded text-[10px] font-black bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-sm"
        >
          ›
        </button>
        <button
          type="button"
          onClick={() => setCurrentPage(totalPages)}
          disabled={activePage === totalPages}
          className="w-6 h-[20px] flex items-center justify-center border border-slate-200 rounded text-[10px] font-black bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-sm"
        >
          &raquo;
        </button>
      </div>
    </div>
  );
}
