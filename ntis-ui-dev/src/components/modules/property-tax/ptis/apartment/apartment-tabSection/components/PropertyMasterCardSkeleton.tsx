'use client';

import React from 'react';
import { Building2 } from 'lucide-react';

export const PropertyMasterCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col lg:flex-row items-stretch gap-2 font-sans select-none animate-pulse">
      {/* 1. LEFT / CENTER: MAIN PROPERTY MASTER SKELETON */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200/90 shadow-2xs px-2 pt-1.5 pb-2 flex flex-col sm:flex-row items-stretch gap-2 min-w-0">
        {/* Photo Box Skeleton */}
        <div className="w-full sm:w-[105px] lg:w-[110px] xl:w-[125px] h-[155px] sm:h-auto min-h-[140px] rounded-lg border border-slate-200/80 bg-slate-100 shrink-0 flex flex-col items-center justify-center gap-1.5 p-2">
          <Building2 className="w-8 h-8 text-slate-300 animate-pulse" />
          <div className="h-2 w-12 bg-slate-200 rounded" />
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 flex flex-col justify-start gap-2 min-w-0 pt-0.5">
          {/* Header Row Skeleton */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="h-6 w-28 bg-blue-100/70 rounded-md" />
              <div className="h-6 w-32 bg-slate-200 rounded-md" />
              <div className="h-6 w-44 bg-slate-200 rounded-md" />
            </div>
            <div className="w-7 h-7 bg-slate-200 rounded-full shrink-0" />
          </div>

          {/* 3 Columns Details Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
            {[1, 2, 3].map((col) => (
              <div key={`col-skel-${col}`} className="space-y-2">
                {[1, 2, 3].map((item) => (
                  <div key={`item-skel-${col}-${item}`} className="flex items-center gap-2">
                    <div className="h-3 w-16 bg-slate-200 rounded shrink-0" />
                    <div className="h-3.5 flex-1 bg-slate-100 rounded" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. RIGHT: REVENUE & TAX METRICS SKELETON */}
      <div className="w-full lg:w-[275px] xl:w-[315px] 2xl:w-[380px] bg-white rounded-xl border border-slate-200/90 shadow-2xs p-2 xl:p-2.5 shrink-0 flex flex-col justify-between gap-2">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
          <div className="h-4 w-28 bg-blue-100/70 rounded" />
          <div className="h-4 w-12 bg-slate-200 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-14 bg-slate-50 border border-slate-100 rounded-lg p-2 flex flex-col justify-center gap-1">
            <div className="h-2.5 w-12 bg-slate-200 rounded" />
            <div className="h-4 w-16 bg-slate-300 rounded" />
          </div>
          <div className="h-14 bg-slate-50 border border-slate-100 rounded-lg p-2 flex flex-col justify-center gap-1">
            <div className="h-2.5 w-12 bg-slate-200 rounded" />
            <div className="h-4 w-16 bg-slate-300 rounded" />
          </div>
        </div>
        <div className="h-8 bg-slate-100 rounded-lg" />
      </div>
    </div>
  );
};
