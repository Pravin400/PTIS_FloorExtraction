import React from "react";
import type { Column } from "@/components/common/MasterTable";
import type { Mouja } from "@/types/mouja.types";
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
  /** Returns the localized verb phrase, e.g. "Sort ascending" / "Sort by" */
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
    <div className="flex items-center gap-1 justify-start w-full">
      <span>{label}</span>
      {renderSortButton()}
    </div>
  );
}
 
/**
 * Returns the table column configuration for Mouja Master.
 *
 * @param t          - Translation function from useTranslations("mouja.moujaMaster")
 * @param tCommon    - Translation function from useTranslations("common"); must be passed
 *                     from a component/hook so that no hook is called inside this plain function.
 * @param sortBy     - Current sort column key
 * @param sortOrder  - Current sort order ("asc" | "desc")
 * @param onSort     - Callback invoked when a column header is clicked
 * @param moujaLabel - Localized alias label override for "Mouja"
 * @returns Array of column definitions
 */
export function getMoujaColumns(
  t: (key: string, values?: Record<string, string | number>) => string,
  tCommon: (key: string) => string,
  sortBy?: string,
  sortOrder?: string,
  onSort?: (key: string) => void,
  moujaLabel?: string
): Column<Mouja>[] {
  const values = moujaLabel ? { mouja: moujaLabel, entity: moujaLabel } : undefined;

  // Whitelisted sortable columns
  const sortableColumns = ["moujaNo", "moujaName"];
 
  const createSortableLabel = (label: string, key: string) => {
    if (onSort && sortableColumns.includes(key)) {
      return (
        <SortableHeader
          label={label}
          columnKey={key}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
          tCommon={(k) => tCommon(k)}
        />
      );
    }
    return label;
  };
 
  return [
    {
      key: "moujaNo",
      label: createSortableLabel(t("list.table.moujaNo", values), "moujaNo"),
      width: "30%",
      render: (value) => (typeof value === "string" ? value : ""),
    },
    {
      key: "moujaName",
      label: createSortableLabel(t("list.table.moujaName", values), "moujaName"),
      width: "40%",
      render: (value) => (typeof value === "string" ? value : ""),
    },
    {
      key: "isActive",
      label: t("list.table.status"),
      width: "20%",
      isStatus: true,
    },
  ];
}

