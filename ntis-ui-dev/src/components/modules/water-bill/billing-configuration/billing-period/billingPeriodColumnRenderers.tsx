import { SortAscButton, SortDescButton, SortDefaultButton } from "@/components/common/ActionButtons";
import { formatNumericDate } from "@/lib/utils/format";

export function SortableHeader({
  label,
  columnKey,
  sortBy,
  sortOrder,
  onSort,
  tCommon,
}: {
  label: string;
  columnKey: string;
  sortBy?: string;
  sortOrder?: string;
  onSort: (key: string) => void;
  tCommon: (key: string) => string;
}) {
  const isActive = sortBy === columnKey;
  const isAsc = isActive && sortOrder === "asc";
  const isDesc = isActive && sortOrder === "desc";

  return (
    <div
      className="inline-flex items-center gap-0.5 justify-start cursor-pointer select-none group"
      onClick={() => onSort(columnKey)}
    >
      <span>{label}</span>
      {isAsc ? (
        <SortAscButton
          onClick={(e) => {
            e.stopPropagation();
            onSort(columnKey);
          }}
          aria-label={`${tCommon("table.sort.verb")} ${label} ${tCommon("table.sort.ascending")}`}
          className="!h-auto !w-auto !p-0 !px-0.5 !py-0 !min-w-0"
        />
      ) : isDesc ? (
        <SortDescButton
          onClick={(e) => {
            e.stopPropagation();
            onSort(columnKey);
          }}
          aria-label={`${tCommon("table.sort.verb")} ${label} ${tCommon("table.sort.descending")}`}
          className="!h-auto !w-auto !p-0 !px-0.5 !py-0 !min-w-0"
        />
      ) : (
        <SortDefaultButton
          onClick={(e) => {
            e.stopPropagation();
            onSort(columnKey);
          }}
          aria-label={`${tCommon("table.sort.by")} ${label}`}
          className="!h-auto !w-auto !p-0 !px-0.5 !py-0 !min-w-0 text-slate-400 group-hover:text-blue-600"
        />
      )}
    </div>
  );
}

export const renderDateCell = (dateStr?: string | null) => {
  const formatted = formatNumericDate(dateStr);
  if (formatted === "-" || formatted === "—" || !formatted) {
    return <span className="text-slate-400 font-normal">—</span>;
  }
  return <span className="tabular-nums font-medium text-slate-700 text-xs">{formatted}</span>;
};

export const renderBillingFrequency = (value?: unknown) => {
  const frequency = typeof value === "string" ? value.trim() : "";
  if (!frequency) return <span className="text-slate-400">—</span>;

  let badgeCls = "bg-slate-100 text-slate-700 border-slate-200/70";
  if (/quarter/i.test(frequency)) {
    badgeCls = "bg-blue-50 text-blue-700 border-blue-200/70";
  } else if (/half/i.test(frequency)) {
    badgeCls = "bg-indigo-50 text-indigo-700 border-indigo-200/70";
  } else if (/annual/i.test(frequency)) {
    badgeCls = "bg-emerald-50 text-emerald-700 border-emerald-200/70";
  } else if (/month/i.test(frequency)) {
    badgeCls = "bg-amber-50 text-amber-700 border-amber-200/70";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${badgeCls}`}>
      {frequency}
    </span>
  );
};

export const renderDateRange = (
  start?: string | null,
  end?: string | null,
  toLabel = "to",
  variant: "current" | "pending" = "current"
) => {
  const startStr = formatNumericDate(start);
  const endStr = formatNumericDate(end);
  const isStartEmpty = !start || startStr === "-" || startStr === "—";
  const isEndEmpty = !end || endStr === "-" || endStr === "—";

  if (isStartEmpty && isEndEmpty) return <span className="text-slate-400 font-normal">—</span>;

  const isCurrent = variant === "current";
  const containerCls = isCurrent
    ? "bg-amber-50/60 border-amber-200/80"
    : "bg-purple-50/50 border-purple-200/80";
  const toCls = isCurrent ? "text-amber-700 font-semibold" : "text-purple-700 font-semibold";

  return (
    <div className={`inline-flex flex-col items-center justify-center px-2 py-0.5 rounded-md border text-xs leading-tight ${containerCls}`}>
      <span className="font-semibold text-slate-800 tabular-nums text-[11px]">
        {isStartEmpty ? "—" : startStr}
      </span>
      <span className="text-[11px] font-normal text-slate-500 tabular-nums inline-flex items-center gap-1">
        <span className={toCls}>{toLabel}</span>
        <span className="font-medium text-slate-700">{isEndEmpty ? "—" : endStr}</span>
      </span>
    </div>
  );
};
