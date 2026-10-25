'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export const ApartmentWingSkeleton: React.FC = () => {
  const t = useTranslations('ptisRedesign.wingIntelligence');

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={t('loadingWings')}
      className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm overflow-hidden relative font-sans select-none animate-pulse"
    >
      {/* Top Nav Tabs Skeleton */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-100 mb-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-20 bg-blue-100/80 rounded-lg" />
          <div className="h-7 w-32 bg-slate-100 rounded-lg" />
          <div className="h-7 w-24 bg-slate-100 rounded-lg" />
        </div>
        <div className="h-7 w-28 bg-slate-100 rounded-lg" />
      </div>

      {/* Header Skeleton */}
      <div className="flex items-center justify-between py-1 mb-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-36 bg-slate-200 rounded" />
          <div className="h-5 w-8 bg-blue-100 rounded-full" />
        </div>
        <div className="h-5 w-16 bg-slate-100 rounded" />
      </div>

      {/* 3 Wing Cards Skeleton with Wide Cascading Deck behind 3rd column */}
      <div className="relative w-full pt-8 pb-3 pr-10 sm:pr-24 md:pr-48 lg:pr-56 overflow-visible">
        <div className="flex items-stretch gap-3 md:gap-4 lg:gap-5">
          {/* Column 1 Skeleton */}
          <div className="flex-1 min-w-0 relative">
            <div className="w-full border border-slate-200/90 rounded-xl p-3 bg-white flex flex-col gap-2.5 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100/80" />
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                </div>
                <div className="w-5 h-5 rounded-full bg-slate-100" />
              </div>
              <div className="space-y-2.5 py-1">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-16 bg-slate-100 rounded" />
                  <div className="h-3.5 w-12 bg-slate-200 rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-20 bg-slate-100 rounded" />
                  <div className="h-3.5 w-14 bg-slate-200 rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-14 bg-slate-100 rounded" />
                  <div className="h-3.5 w-16 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="h-6 w-20 bg-slate-100 rounded-full" />
                <div className="h-6 w-16 bg-blue-100/70 rounded-full" />
              </div>
            </div>
          </div>

          {/* Column 2 Skeleton */}
          <div className="flex-1 min-w-0 relative hidden md:block">
            <div className="w-full border border-slate-200/90 rounded-xl p-3 bg-white flex flex-col gap-2.5 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-purple-100/80" />
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                </div>
                <div className="w-5 h-5 rounded-full bg-slate-100" />
              </div>
              <div className="space-y-2.5 py-1">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-16 bg-slate-100 rounded" />
                  <div className="h-3.5 w-12 bg-slate-200 rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-20 bg-slate-100 rounded" />
                  <div className="h-3.5 w-14 bg-slate-200 rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-14 bg-slate-100 rounded" />
                  <div className="h-3.5 w-16 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="h-6 w-20 bg-slate-100 rounded-full" />
                <div className="h-6 w-16 bg-blue-100/70 rounded-full" />
              </div>
            </div>
          </div>

          {/* Column 3 Skeleton (With Wide Stacked Cards behind it) */}
          <div className="flex-1 min-w-0 relative hidden lg:block">
            {/* Stacked Layer 2 (Farther: Card E) */}
            <div
              style={{
                transform: 'translate(145px, -26px) scale(0.95)',
                zIndex: 6,
                opacity: 0.88,
                transformOrigin: 'bottom left',
              }}
              className="absolute inset-0 rounded-xl border-2 border-white shadow-xl ring-1 ring-slate-300/80 bg-white p-3 flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-pink-100/80" />
                  <div className="h-4 w-20 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="space-y-2 py-1">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-14 bg-slate-100 rounded" />
                  <div className="h-3 w-10 bg-slate-200 rounded" />
                </div>
              </div>
            </div>

            {/* Stacked Layer 1 (Closer: Card D) */}
            <div
              style={{
                transform: 'translate(75px, -14px) scale(0.975)',
                zIndex: 8,
                opacity: 0.96,
                transformOrigin: 'bottom left',
              }}
              className="absolute inset-0 rounded-xl border-2 border-white shadow-xl ring-1 ring-slate-300/80 bg-white p-3 flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100/80" />
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="space-y-2 py-1">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-16 bg-slate-100 rounded" />
                  <div className="h-3 w-12 bg-slate-200 rounded" />
                </div>
              </div>
            </div>

            {/* Front Card in Column 3 */}
            <div className="relative z-10 w-full border border-slate-200/90 rounded-xl p-3 bg-white flex flex-col gap-2.5 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-100/80" />
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                </div>
                <div className="w-5 h-5 rounded-full bg-slate-100" />
              </div>
              <div className="space-y-2.5 py-1">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-16 bg-slate-100 rounded" />
                  <div className="h-3.5 w-12 bg-slate-200 rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-20 bg-slate-100 rounded" />
                  <div className="h-3.5 w-14 bg-slate-200 rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-14 bg-slate-100 rounded" />
                  <div className="h-3.5 w-16 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="h-6 w-20 bg-slate-100 rounded-full" />
                <div className="h-6 w-16 bg-blue-100/70 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApartmentWingSkeleton;
