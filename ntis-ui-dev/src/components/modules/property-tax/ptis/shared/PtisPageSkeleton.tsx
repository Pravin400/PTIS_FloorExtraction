import React from 'react';

export function PtisPageSkeleton(): React.ReactElement {
  return (
    <div className="flex flex-col gap-4 pb-20 w-full animate-pulse">
      {/* Top Search Bar Skeleton */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-wrap items-center gap-3">
        <div className="h-9 w-28 bg-slate-100 rounded-lg" />
        <div className="h-9 w-36 bg-slate-100 rounded-lg" />
        <div className="h-9 w-28 bg-slate-100 rounded-lg" />
        <div className="h-9 w-10 bg-slate-200 rounded-lg" />
      </div>

      {/* Main Body Skeleton */}
      <div className="flex flex-col lg:flex-row gap-3 w-full items-start">
        {/* Main Content Area */}
        <div className="flex-1 min-w-0 w-full flex flex-col gap-4">
          {/* Top Property Info Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-32 bg-slate-200 rounded-md" />
                <div className="h-6 w-40 bg-slate-100 rounded-md" />
              </div>
              <div className="h-6 w-24 bg-slate-100 rounded-md" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="h-3 w-16 bg-slate-100 rounded" />
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Workflow / Steps Bar */}
          <div className="h-10 bg-white rounded-xl border border-slate-200/80 flex items-center px-4 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 w-24 bg-slate-100 rounded" />
            ))}
          </div>

          {/* Valuation Tabs Bar */}
          <div className="h-10 bg-white rounded-xl border border-slate-200/80 flex items-center px-4 gap-3">
            <div className="h-7 w-28 bg-blue-100 rounded-lg" />
            <div className="h-7 w-28 bg-slate-100 rounded-lg" />
            <div className="h-7 w-28 bg-slate-100 rounded-lg" />
          </div>

          {/* Main Content Area Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs min-h-[300px] flex flex-col gap-4">
            <div className="h-5 w-48 bg-slate-200 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-32 bg-slate-50 border border-slate-100 rounded-xl" />
              <div className="h-32 bg-slate-50 border border-slate-100 rounded-xl" />
              <div className="h-32 bg-slate-50 border border-slate-100 rounded-xl" />
            </div>
            <div className="h-48 bg-slate-50 border border-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PtisPageSkeleton;
