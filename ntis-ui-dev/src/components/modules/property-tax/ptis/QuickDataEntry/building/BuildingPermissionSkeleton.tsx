import React from "react";

/**
 * BuildingPermissionSkeleton
 * Smooth, animated skeleton placeholder for Building Permissions & Documents tab.
 * Accurately mirrors the 12-column layout, sidebar certificate list, document attachment preview,
 * two-column form inputs, and bottom action footer.
 */
export function BuildingPermissionSkeleton(): React.ReactElement {
  return (
    <div
      aria-label="Loading building permissions"
      className="flex-1 flex flex-col min-h-0 h-full lg:h-[calc(100vh-125px)] max-h-[calc(100vh-125px)] overflow-hidden p-2 sm:p-2.5 gap-2 animate-pulse"
    >
      {/* Header: Title + Level Selector Pills */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-1.5 shrink-0">
        <div className="h-6 w-64 bg-slate-200/90 rounded-md" />
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <div className="h-7 w-28 bg-blue-600/70 rounded-lg shadow-xs" />
          <div className="h-7 w-24 bg-white border border-slate-200/80 rounded-lg" />
          <div className="h-7 w-24 bg-white border border-slate-200/80 rounded-lg" />
        </div>
      </div>

      {/* Scope Guidance Banner */}
      <div className="p-2.5 rounded-lg border border-blue-100 bg-blue-50/50 flex items-center gap-2 shrink-0">
        <div className="w-4 h-4 rounded bg-blue-200/80 shrink-0" />
        <div className="h-3.5 w-80 max-w-full bg-blue-200/60 rounded" />
      </div>

      {/* Main Grid: Sidebar (3 cols) + Detail Pane (9 cols) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
        {/* Left Sidebar Skeleton */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col h-full min-h-0 bg-white border border-slate-200/80 rounded-xl p-2.5 gap-2.5 overflow-hidden shadow-xs">
          {/* Search bar */}
          <div className="h-9 w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-slate-300/70 shrink-0" />
            <div className="h-3 w-32 bg-slate-200 rounded" />
          </div>

          {/* Show Active First Toggle Row */}
          <div className="flex items-center justify-between px-1 py-0.5">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-slate-300/70" />
              <div className="h-3 w-24 bg-slate-200/80 rounded" />
            </div>
            <div className="w-8 h-4 bg-slate-200 rounded-full" />
          </div>

          {/* Certificates Card List */}
          <div className="flex-1 flex flex-col gap-2 overflow-hidden">
            {[
              { w: "w-20", active: true, selected: false },
              { w: "w-36", active: false, selected: false },
              { w: "w-32", active: true, selected: true },
              { w: "w-28", active: false, selected: false },
              { w: "w-32", active: false, selected: false },
              { w: "w-20", active: false, selected: false },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg flex items-center justify-between gap-2 ${
                  item.selected
                    ? "border-2 border-blue-500/80 bg-blue-50/20 shadow-xs"
                    : "border border-slate-200/80 bg-white"
                }`}
              >
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <div className={`h-3.5 ${item.w} ${item.selected ? "bg-blue-900/60" : "bg-slate-200/90"} rounded`} />
                  <div className={`h-3 w-20 rounded-full ${item.active ? "bg-purple-100" : "bg-slate-100"}`} />
                </div>
                <div className={`w-8 h-4.5 rounded-full shrink-0 ${item.active ? "bg-blue-400/70" : "bg-slate-200"}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Right Detail Pane Skeleton */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col h-full min-h-0 bg-white border border-slate-200/80 rounded-xl p-3.5 gap-3.5 overflow-hidden shadow-xs">
          {/* Certificate Attachment Title */}
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-52 bg-slate-200/90 rounded" />
            <div className="w-2 h-2 rounded-full bg-red-400" />
          </div>

          {/* Document Attachment Box */}
          <div className="border border-blue-100 rounded-xl bg-blue-50/15 p-3.5 space-y-3.5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100/70 flex items-center justify-center shrink-0">
                <div className="w-5 h-5 rounded bg-blue-200/80" />
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="h-4 w-36 bg-slate-200/90 rounded" />
                <div className="h-4 w-28 bg-emerald-100/80 rounded-md" />
              </div>
            </div>

            {/* 4 Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="h-8.5 w-32 bg-blue-600/70 rounded-lg shadow-xs" />
              <div className="h-8.5 w-36 bg-white border border-slate-200 rounded-lg" />
              <div className="h-8.5 w-32 bg-red-50/60 border border-red-200/80 rounded-lg" />
              <div className="h-8.5 w-28 bg-blue-50/60 border border-blue-200/80 rounded-lg" />
            </div>
          </div>

          {/* 2-Column Form Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <div className="h-3.5 w-44 bg-slate-200/90 rounded" />
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
              </div>
              <div className="h-10 w-full bg-slate-50 border border-slate-200/80 rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <div className="h-3.5 w-40 bg-slate-200/90 rounded" />
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
              </div>
              <div className="h-10 w-full bg-slate-50 border border-slate-200/80 rounded-lg" />
            </div>
          </div>

          {/* Hint Line */}
          <div className="flex items-center gap-2 pt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
            <div className="h-3 w-80 max-w-full bg-slate-200/70 rounded" />
          </div>
        </div>
      </div>

      {/* Bottom Sticky Footer */}
      <div className="flex items-center justify-between p-2.5 bg-slate-50 border-t border-slate-200/80 rounded-b-xl shrink-0">
        <div className="h-9 w-44 bg-red-50/70 border border-red-200/80 rounded-lg" />
        <div className="h-9 w-32 bg-emerald-600/70 rounded-lg shadow-xs" />
      </div>
    </div>
  );
}

export default BuildingPermissionSkeleton;
