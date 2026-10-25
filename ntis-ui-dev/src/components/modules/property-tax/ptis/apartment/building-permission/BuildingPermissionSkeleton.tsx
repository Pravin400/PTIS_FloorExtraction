'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface BuildingPermissionSkeletonProps {
  count?: number;
  className?: string;
}

export const BuildingPermissionSkeleton: React.FC<BuildingPermissionSkeletonProps> = ({
  count = 8,
  className,
}) => {
  return (
    <div
      data-testid="building-permission-skeleton"
      className={cn(
        'w-full overflow-hidden max-h-[238px] rounded-xl',
        className
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="group relative bg-white rounded-xl border border-slate-200/80 p-2.5 shadow-2xs flex items-stretch gap-2.5 animate-pulse before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-slate-200"
          >
            {/* Left: Thumbnail skeleton */}
            <div className="w-14 h-18 rounded-lg bg-slate-100 shrink-0 flex items-center justify-center border border-slate-200/60" />

            {/* Right: Details skeleton */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              {/* Header: Icon + Title + Badge */}
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 shrink-0" />
                  <div className="h-3.5 bg-slate-200/80 rounded w-20" />
                </div>
                <div className="h-4 w-14 bg-slate-100 rounded" />
              </div>

              {/* Middle: Certificate Number & Date */}
              <div className="flex flex-col gap-1 my-1">
                <div className="h-3 bg-slate-100 rounded w-28" />
                <div className="h-2.5 bg-slate-100 rounded w-16" />
              </div>

              {/* Footer: View & Edit buttons */}
              <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-slate-100">
                <div className="h-5 w-12 bg-slate-100 rounded-md" />
                <div className="h-5 w-12 bg-slate-100 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BuildingPermissionSkeleton;
