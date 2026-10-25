import type { Column } from "@/components/common/MasterTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TruncatedText } from "@/components/common/TruncatedText";
import type { TariffWorkbench } from "@/types/water-bill/tariff-workbench/tariffWorkbench.types";
import { formatNumericDate } from "@/lib/utils/format";
import { Eye, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

type Translator = (key: string, values?: Record<string, string | number>) => string;

interface SortableProps {
  label: string;
  columnKey: string;
  sortBy?: string;
  sortOrder?: string;
  onSort: (key: string) => void;
  tCommon: Translator;
}

function SortableHeader({ label, columnKey, sortBy, sortOrder, onSort, tCommon }: SortableProps) {
  const isActive = sortBy === columnKey || (columnKey === "year" && sortBy === "yearCode");
  const isAsc = isActive && sortOrder === "asc";
  const isDesc = isActive && sortOrder === "desc";

  return (
    <button
      type="button"
      onClick={() => onSort(columnKey)}
      className="inline-flex items-center justify-center gap-1 cursor-pointer select-none group mx-auto font-semibold text-[#1E3A8A] hover:text-blue-700 transition-colors"
      title={`${tCommon("table.sort.by")} ${label}`}
      aria-label={`${tCommon("table.sort.by")} ${label}`}
    >
      <span>{label}</span>
      <span className="inline-flex items-center text-slate-400 group-hover:text-blue-600 transition-colors">
        {isAsc ? <ArrowUp className="w-3.5 h-3.5 text-blue-600 stroke-[2.5]" /> : isDesc ? <ArrowDown className="w-3.5 h-3.5 text-blue-600 stroke-[2.5]" /> : <ArrowUpDown className="w-3.5 h-3.5" />}
      </span>
    </button>
  );
}

export function getTariffColumns(
  t: Translator,
  tCommon: Translator,
  currentSortBy?: string,
  currentSortOrder?: "asc" | "desc",
  onSort?: (key: string) => void,
  onViewRateSlabs?: (row: TariffWorkbench) => void
): Column<TariffWorkbench>[] {
  const sortableColumns = ["tariffCode", "year", "tariffName", "description", "effectiveFrom", "effectiveTo"];

  const createSortableLabel = (label: string, key: string) => {
    if (onSort && sortableColumns.includes(key)) {
      return (
        <SortableHeader
          label={label}
          columnKey={key}
          sortBy={currentSortBy}
          sortOrder={currentSortOrder}
          onSort={onSort}
          tCommon={tCommon}
        />
      );
    }
    return label;
  };

  return [
    {
      key: "tariffCode",
      label: createSortableLabel(t("table.tariffCode"), "tariffCode"),
      align: "center",
      render: (_value, row) => (
        <div className="flex items-center justify-center w-full">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 font-mono shadow-2xs">
            {row.tariffCode || "-"}
          </span>
        </div>
      ),
    },
    {
      key: "year",
      label: createSortableLabel(t("table.financialYear"), "year"),
      align: "center",
      render: (_value, row) => (
        <div className="flex items-center justify-center w-full">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/90 tabular-nums shadow-2xs">
            {row.year || row.yearCode || "-"}
          </span>
        </div>
      ),
    },
    {
      key: "connectionTypeName",
      label: t("table.connectionType"),
      align: "center",
      render: (_value, row) => <span className="text-slate-700">{row.connectionTypeName || "-"}</span>,
    },
    {
      key: "connectionCategoryName",
      label: t("table.connectionCategory"),
      align: "center",
      render: (_value, row) => <span className="text-slate-700">{row.connectionCategoryName || "-"}</span>,
    },
    {
      key: "tapSizeName",
      label: t("table.tapSize"),
      align: "center",
      render: (_value, row) => (
        <div className="flex items-center justify-center w-full">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs">
            {row.tapSizeName || "-"}
          </span>
        </div>
      ),
    },
    {
      key: "tariffName",
      label: createSortableLabel(t("table.tariffName"), "tariffName"),
      align: "center",
      render: (_value, row) => (
        <div className="flex items-center justify-center w-full">
          <TruncatedText text={row.tariffName} maxLength={25} className="font-medium text-slate-900 text-sm" placement="top" />
        </div>
      ),
    },
    {
      key: "description",
      label: t("table.description"),
      align: "center",
      render: (_value, row) => (
        <div className="flex items-center justify-center w-full">
          <TruncatedText text={row.description} maxLength={25} className="text-slate-600 text-sm" placement="top" />
        </div>
      ),
    },
    {
      key: "effectiveFrom",
      label: createSortableLabel(t("table.effectiveFrom"), "effectiveFrom"),
      align: "center",
      render: (_value, row) => {
        const val = formatNumericDate(row.effectiveFrom);
        return (
          <div className="flex items-center justify-center w-full">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200/90 tabular-nums shadow-2xs">
              {val === "-" ? "—" : val}
            </span>
          </div>
        );
      },
    },
    {
      key: "effectiveTo",
      label: createSortableLabel(t("table.effectiveTo"), "effectiveTo"),
      align: "center",
      render: (_value, row) => {
        const val = formatNumericDate(row.effectiveTo);
        return (
          <div className="flex items-center justify-center w-full">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200/90 tabular-nums shadow-2xs">
              {val === "-" ? "—" : val}
            </span>
          </div>
        );
      },
    },
    {
      key: "isActive",
      label: t("table.status") || "Status",
      align: "center",
      render: (_value, row) => (
        <div className="flex items-center justify-center w-full">
          <StatusBadge value={Boolean(row.isActive)} activeLabel={tCommon("status.active")} inactiveLabel={tCommon("status.inactive")} />
        </div>
      ),
    },
    {
      key: "rateSlabs",
      label: t("table.rateSlabs") || "Rate Slabs",
      align: "center",
      render: (_value, row) => (
        <div className="flex items-center justify-center w-full">
          <button
            type="button"
            onClick={() => onViewRateSlabs?.(row)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 rounded-md border border-blue-200 transition-colors shadow-xs cursor-pointer"
            title={`${t("table.view") || "View"} ${t("table.rateSlabs") || "Rate Slabs"}`}
            aria-label={`${t("table.view") || "View"} ${t("table.rateSlabs") || "Rate Slabs"}`}
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>{t("table.view") || "View"}</span>
          </button>
        </div>
      ),
    },
  ];
}
