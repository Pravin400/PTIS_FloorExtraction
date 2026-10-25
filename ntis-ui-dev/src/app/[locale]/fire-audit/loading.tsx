export default function FireAuditLoading() {
  return (
    <div className="w-full space-y-4 p-4 animate-pulse">
      <div className="h-28 rounded-2xl border border-[#e6e8ec] bg-white p-6">
        <div className="h-3 w-24 rounded bg-[#f4f6f8]" />
        <div className="mt-3 h-6 w-1/3 rounded bg-[#e6e8ec]" />
        <div className="mt-3 h-4 w-1/2 rounded bg-[#f4f6f8]" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-40 rounded-2xl border border-[#e6e8ec] bg-white" />
        ))}
      </div>
    </div>
  );
}
