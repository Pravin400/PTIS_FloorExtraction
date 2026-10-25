import React from "react";
import type { Column } from "@/components/common/MasterTable";
import type { Floor } from "@/types/floor.types";
import { SortAscButton, SortDescButton, SortDefaultButton } from "@/components/common/ActionButtons";

/**
 * Renders a sortable column header with sort icon
 */
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
}): React.ReactElement {
  const isActive = sortBy === columnKey;
  const isAsc = isActive && sortOrder === "asc";
  const isDesc = isActive && sortOrder === "desc";

  const renderSortButton = () => {
    if (isAsc) {
      return (
        <SortAscButton
          onClick={() => onSort(columnKey)}
          aria-label={`${tCommon("table.sort.verb")} ${label} ${tCommon("table.sort.ascending")}`}
        />
      );
    }
    if (isDesc) {
      return (
        <SortDescButton
          onClick={() => onSort(columnKey)}
          aria-label={`${tCommon("table.sort.verb")} ${label} ${tCommon("table.sort.descending")}`}
        />
      );
    }
    return (
      <SortDefaultButton
        onClick={() => onSort(columnKey)}
        aria-label={`${tCommon("table.sort.by")} ${label}`}
      />
    );
  };

  return (
    <div className="flex items-center gap-1 justify-center w-full">
      <span>{label}</span>
      {renderSortButton()}
    </div>
  );
}

export const floorColumns = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, values?: Record<string, any>) => string,
  tCommon: (key: string) => string,
  sortBy?: string,
  sortOrder?: string,
  onSort?: (key: string) => void,
  floorLabel?: string
): Column<Floor>[] => {
  // Sortable columns (all columns sortable in UI)
  const sortableColumns = ["floorCode", "descriptionEnglish", "description", "sequenceNo", "isActive"];

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
      key: "floorCode",
      label: createSortableLabel(t("table.columns.floorCode", { floor: floorLabel ?? "" }), "floorCode"),
      width: "15%",
      headerClassName: "text-center",
      cellClassName: "text-center",
    },
    {
      key: "descriptionEnglish",
      label: createSortableLabel(t("table.columns.descriptionEnglish"), "descriptionEnglish"),
      width: "25%",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (value) => <span>{(value as string) || "-"}</span>,
    },
    {
      key: "description",
      label: createSortableLabel(t("table.columns.descriptionRegional"), "description"),
      width: "25%",
      headerClassName: "text-center",
      cellClassName: "text-center",
    },
    {
      key: "sequenceNo",
      label: createSortableLabel(t("table.columns.sequenceNo"), "sequenceNo"),
      width: "15%",
      headerClassName: "text-center",
      cellClassName: "text-center",
    },
    {
      key: "isActive",
      label: createSortableLabel(t("table.columns.status"), "isActive"),
      width: "20%",
      isStatus: true,
      headerClassName: "text-center",
      cellClassName: "text-center",
    },
  ];
};