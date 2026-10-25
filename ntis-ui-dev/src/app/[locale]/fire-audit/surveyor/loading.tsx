export default function SurveyorLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-3.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-18 sm:h-22 rounded-2xl sm:rounded-3xl bg-white/70 border border-slate-200/80 shadow-[2px_2px_6px_rgba(15,23,42,0.04)]"
          />
        ))}
      </div>
    </div>
  );
}
