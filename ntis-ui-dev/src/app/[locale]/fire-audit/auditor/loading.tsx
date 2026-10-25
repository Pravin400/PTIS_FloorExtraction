export default function AuditorLoading() {
  return (
    <div className="w-full space-y-4 p-4 lg:p-6 animate-pulse">
      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-slate-200 bg-white p-3 space-y-2"
          >
            <div className="h-3 w-16 rounded bg-slate-200" />
            <div className="h-6 w-10 rounded bg-slate-200" />
          </div>
        ))}
      </div>
      {/* Filters Skeleton */}
      <div className="h-14 rounded-2xl border border-slate-200 bg-white" />
      {/* Table Skeleton */}
      <div className="h-96 rounded-2xl border border-slate-200 bg-white" />
    </div>
  );
}
