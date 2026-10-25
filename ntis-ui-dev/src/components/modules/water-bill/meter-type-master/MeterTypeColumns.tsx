import React from "react";
import type { Column } from "@/components/common/MasterTable";
import type { MeterType } from "@/types/water-bill/meter-type-master.types";
import { SortAscButton, SortDescButton, SortDefaultButton } from "@/components/common/ActionButtons";
import { StatusBadge } from "@/components/common/StatusBadge";

function SortableHeader({
  label,
  columnKey,
  sortBy,
  sortOrder,
  onSort,
}: {
  label: string;
  columnKey: string;
  sortBy?: string;
  sortOrder?: string;
  onSort: (key: string) => void;
}): React.ReactElement {
  const isActive = sortBy === columnKey;
  const isAsc = isActive && sortOrder === "asc";
  const isDesc = isActive && sortOrder === "desc";

  return (
    <div className="flex items-center gap-1 justify-start w-full">
      <span>{label}</span>
      {isAsc ? (
        <SortAscButton onClick={() => onSort(columnKey)} aria-label={`Sort ${label} ascending`} />
      ) : isDesc ? (
        <SortDescButton onClick={() => onSort(columnKey)} aria-label={`Sort ${label} descending`} />
      ) : (
        <SortDefaultButton onClick={() => onSort(columnKey)} aria-label={`Sort by ${label}`} />
      )}
    </div>
  );
}

export function getMeterTypeColumns(
  sortBy?: string,
  sortOrder?: string,
  onSort?: (key: string) => void,
  t?: (key: string) => string
): Column<MeterType>[] {
  const createSortableLabel = (label: string, key: string) => {
    if (onSort) {
      return (
        <SortableHeader
          label={label}
          columnKey={key}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
        />
      );
    }
    return label;
  };

  return [
    {
      key: "meterTypeCode",
      label: createSortableLabel(t ? t("table.code") : "MeterTypeCode", "meterTypeCode"),
      width: "15%",
      render: (_, row) => (
        <span className="inline-block px-2.5 py-1 text-xs font-mono font-bold bg-[#F0F4FA] text-blue-900 border border-blue-200/80 rounded-md tracking-wider">
          {row.meterTypeCode || row.code}
        </span>
      ),
    },
    {
      key: "meterType",
      label: createSortableLabel(t ? t("table.name") : "Meter Type", "meterType"),
      width: "25%",
      render: (_, row) => <span className="font-medium text-slate-900">{row.meterType}</span>,
    },
    {
      key: "description",
      label: createSortableLabel(t ? t("table.description") : "Description", "description"),
      width: "40%",
      render: (_, row) => <span className="text-slate-600 text-xs line-clamp-2">{row.description || "-"}</span>,
    },
    {
      key: "isActive",
      label: createSortableLabel(t ? t("table.status") : "Status", "isActive"),
      width: "20%",
      render: (_, row) => <StatusBadge value={row.isActive} />,
    },
  ];
}
