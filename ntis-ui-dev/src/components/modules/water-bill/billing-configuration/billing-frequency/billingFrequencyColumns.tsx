import type { Column } from "@/components/common/MasterTable";
import type { BillingFrequencyMaster } from "@/types/water-bill/billing-configuration/billingFrequencyMaster.types";
import { SortAscButton, SortDescButton, SortDefaultButton } from "@/components/common/ActionButtons";

function SortableHeader({
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
    <div className="flex items-center gap-1 justify-start w-full">
      <span>{label}</span>
      {isAsc ? (
        <SortAscButton
          onClick={() => onSort(columnKey)}
          aria-label={`${tCommon("table.sort.verb")} ${label} ${tCommon("table.sort.ascending")}`}
        />
      ) : isDesc ? (
        <SortDescButton
          onClick={() => onSort(columnKey)}
          aria-label={`${tCommon("table.sort.verb")} ${label} ${tCommon("table.sort.descending")}`}
        />
      ) : (
        <SortDefaultButton
          onClick={() => onSort(columnKey)}
          aria-label={`${tCommon("table.sort.by")} ${label}`}
        />
      )}
    </div>
  );
}

export function getBillingFrequencyColumns(
  t: (key: string) => string,
  tCommon: (key: string) => string,
  sortBy?: string,
  sortOrder?: string,
  onSort?: (key: string) => void
): Column<BillingFrequencyMaster>[] {
  const sortableColumns = ["billingFrequency", "periodsPerYear", "sequenceNo", "description"];

  const createSortableLabel = (label: string, key: string) => {
    if (onSort && sortableColumns.includes(key)) {
      return (
        <SortableHeader
          label={label}
          columnKey={key}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
          tCommon={tCommon}
        />
      );
    }
    return label;
  };

  return [
    {
      key: "billingFrequency",
      label: createSortableLabel(t("table.billingFrequency"), "billingFrequency"),
      width: "25%",
      render: (value) => (typeof value === "string" ? value : "-"),
    },
    {
      key: "periodsPerYear",
      label: createSortableLabel(t("table.periodsPerYear"), "periodsPerYear"),
      width: "15%",
      render: (value) => (value !== undefined && value !== null ? String(value) : "-"),
    },
    {
      key: "description",
      label: createSortableLabel(t("table.description"), "description"),
      width: "30%",
      render: (value) => (typeof value === "string" && value.trim() ? value : "—"),
    },
    {
      key: "sequenceNo",
      label: createSortableLabel(t("table.sequenceNo"), "sequenceNo"),
      width: "15%",
      render: (value) => (value !== undefined && value !== null ? String(value) : "-"),
    },
    {
      key: "isActive",
      label: t("table.status"),
      width: "15%",
      isStatus: true,
    },
  ];
}
