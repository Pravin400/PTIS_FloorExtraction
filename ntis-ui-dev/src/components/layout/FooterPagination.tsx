'use client';

import React from 'react';
import { Tooltip } from '@/components/common/Tooltip';
import {
  FirstPageButton,
  LastPageButton,
  NextPageButton,
  PrevPageButton,
} from '@/components/common/ActionButtons';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

interface FooterPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  firstUrl?: string | null;
  prevUrl?: string | null;
  nextUrl?: string | null;
  lastUrl?: string | null;
  leftContent?: React.ReactNode;
  isPropertyPagination?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  isPropertySelected?: boolean;
}

export const FooterPagination = ({
  currentPage,
  totalPages,
  onPageChange,
  leftContent,
  isPropertyPagination: _isPropertyPagination = false,
  isLoading = false,
  disabled = false,
  isPropertySelected: _isPropertySelected = true,
}: FooterPaginationProps) => {
  const t = useTranslations('ptis');

  const firstTooltip = _isPropertyPagination ? t('buttons.firstProperty') : t('buttons.firstPage');
  const prevTooltip = _isPropertyPagination ? t('buttons.previousProperty') : t('buttons.previousPage');
  const nextTooltip = _isPropertyPagination ? t('buttons.nextProperty') : t('buttons.nextPage');
  const lastTooltip = _isPropertyPagination ? t('buttons.lastProperty') : t('buttons.lastPage');

  const displayCurrent = currentPage === 0 ? (totalPages > 0 ? 1 : '-') : currentPage;
  const middleText = _isPropertyPagination
    ? t('table.property', { current: displayCurrent, total: totalPages })
    : t('table.page', { current: displayCurrent, total: totalPages });

  const effectivePage = currentPage === 0 ? 1 : currentPage;

  return (
    <nav 
      aria-label={t('pagination.label')} 
      className="flex flex-col sm:flex-row items-center justify-center sm:justify-between md:justify-start gap-2.5 sm:gap-3 w-full md:w-auto shrink-0"
    >
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-sm" role="group" aria-label={t('pagination.controls')}>
        <Tooltip content={firstTooltip} placement="top">
          <FirstPageButton
            onClick={() => onPageChange?.(1)}
            disabled={disabled || isLoading || effectivePage <= 1 || !onPageChange}
            className={cn(
              "hidden sm:flex w-7 h-7 !p-0 !min-w-0 bg-transparent border-none hover:bg-white hover:shadow-sm cursor-pointer",
              isLoading && "opacity-50 !cursor-wait"
            )}
            aria-label={firstTooltip}
          />
        </Tooltip>
        <Tooltip content={prevTooltip} placement="top">
          <PrevPageButton
            onClick={() => onPageChange?.(Math.max(1, effectivePage - 1))}
            disabled={disabled || isLoading || effectivePage <= 1 || !onPageChange}
            className={cn(
              "w-7 h-7 !p-0 !min-w-0 bg-transparent border-none hover:bg-white hover:shadow-sm cursor-pointer",
              isLoading && "opacity-50 !cursor-wait"
            )}
            aria-label={prevTooltip}
          />
        </Tooltip>
        
        <div 
          className="px-2 flex sm:px-2.5 items-center justify-center min-w-[110px] sm:min-w-[130px] select-none h-7 gap-1.5"
          aria-live="polite"
          aria-atomic="true"
        >
          {isLoading ? (
            <div className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600 shrink-0" aria-hidden="true" />
              <span className="text-[11px] sm:text-[12px] font-bold text-blue-700 tracking-tight whitespace-nowrap">
                {middleText}
              </span>
            </div>
          ) : (
            <span className="text-[11px] sm:text-[12px] font-bold text-slate-600 tracking-tight whitespace-nowrap">
              {middleText}
            </span>
          )}
        </div>

        <Tooltip content={nextTooltip} placement="top">
          <NextPageButton
            onClick={() => onPageChange?.(Math.min(totalPages, effectivePage + 1))}
            disabled={disabled || isLoading || (effectivePage >= totalPages && totalPages > 0) || !onPageChange}
            className={cn(
              "w-7 h-7 !p-0 !min-w-0 bg-transparent border-none hover:bg-white hover:shadow-sm cursor-pointer",
              isLoading && "opacity-50 !cursor-wait"
            )}
            aria-label={nextTooltip}
          />
        </Tooltip>
        <Tooltip content={lastTooltip} placement="top">
          <LastPageButton
            onClick={() => onPageChange?.(totalPages)}
            disabled={disabled || isLoading || (effectivePage >= totalPages && totalPages > 0) || !onPageChange}
            className={cn(
              "hidden sm:flex w-7 h-7 !p-0 !min-w-0 bg-transparent border-none hover:bg-white hover:shadow-sm cursor-pointer",
              isLoading && "opacity-50 !cursor-wait"
            )}
            aria-label={lastTooltip}
          />
        </Tooltip>
      </div>

      {leftContent && (
        <div className="flex items-center gap-2 sm:gap-3 pl-0 sm:pl-3 border-t sm:border-t-0 sm:border-l border-slate-200/60 pt-2.5 sm:pt-0 ml-0 sm:ml-2">
          {leftContent}
        </div>
      )}
    </nav>
  );
};
