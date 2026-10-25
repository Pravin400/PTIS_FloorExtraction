export default function GrievanceLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="h-28 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center space-y-3">
        <div className="h-6 bg-slate-200 rounded-md w-1/3" />
        <div className="h-4 bg-slate-100 rounded-md w-1/2" />
      </div>

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-44 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4"
          >
            <div className="w-10 h-10 bg-slate-200 rounded-xl" />
            <div className="h-5 bg-slate-200 rounded-md w-3/4" />
            <div className="h-4 bg-slate-100 rounded-md w-full" />
          </div>
        ))}
      </div>

      {/* Content Block Skeleton */}
      <div className="h-96 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="h-6 bg-slate-200 rounded-md w-1/4" />
        <div className="h-4 bg-slate-100 rounded-md w-full" />
        <div className="h-4 bg-slate-100 rounded-md w-5/6" />
        <div className="h-4 bg-slate-100 rounded-md w-4/6" />
      </div>
    </div>
  );
}
