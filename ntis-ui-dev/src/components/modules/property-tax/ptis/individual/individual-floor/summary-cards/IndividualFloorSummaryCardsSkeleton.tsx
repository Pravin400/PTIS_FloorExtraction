'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';
import type { IndividualFloorSummaryCardsSkeletonProps } from '@/types/summaryCard.types';

export const IndividualFloorSummaryCardsSkeleton: React.FC<IndividualFloorSummaryCardsSkeletonProps> = ({
  taxMode = 'rateable',
  className,
}) => {
  const isCapitalMode = taxMode === 'capital';
  const cardCount = isCapitalMode ? 4 : 5;

  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 my-0 select-none w-full items-stretch',
        isCapitalMode ? 'xl:grid-cols-4' : 'xl:grid-cols-5',
        className
      )}
    >
      {Array.from({ length: cardCount }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-xl border border-slate-200 p-2.5 px-3 shadow-2xs flex items-center gap-2.5 min-w-0 w-full animate-pulse"
        >
          <div className="w-8.5 h-8.5 rounded-lg bg-slate-200 shrink-0" />
          <div className="h-7 w-[1px] bg-slate-200 shrink-0" />
          <div className="flex flex-col min-w-0 flex-1 justify-center gap-1.5">
            <div className="flex items-center justify-between gap-1.5 min-w-0">
              <div className="h-3.5 bg-slate-200 rounded w-20" />
              <div className="h-5 w-14 bg-slate-200 rounded-md shrink-0 ml-auto" />
            </div>
            <div className="h-3 bg-slate-200 rounded w-28" />
          </div>
        </div>
      ))}
    </div>
  );
};
