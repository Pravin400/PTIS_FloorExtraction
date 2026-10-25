import React from "react";
import type { Column } from "@/components/common/MasterTable";
import type { AssessmentYearRange } from "@/types/assessment-year-range.types";
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
 * Returns the table column configuration for Assessment Year Range Master.
 * Generic function that works for both RV and CV.
 */
export function getAssessmentYearRangeColumns<T extends AssessmentYearRange>(
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string) => string,
  sortBy?: string,
  sortOrder?: string,
  onSort?: (key: string) => void,
  assessmentLabel?: string
): Column<T>[] {
  const values = { assessment: assessmentLabel ?? "", entity: assessmentLabel ?? "" };
  // Only fromYear and toYear are sortable
  const sortableColumns = ["fromYear", "toYear"];

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
      key: "fromYear",
      label: createSortableLabel(t("list.table.fromYear", values), "fromYear"),
      width: "25%",
      render: (_, row: T) => row.fromYear,
    },
    {
      key: "toYear",
      label: createSortableLabel(t("list.table.toYear", values), "toYear"),
      width: "25%",
      render: (_, row: T) => row.toYear,
    },
    {
      key: "isActive",
      label: createSortableLabel(t("list.table.status", values), "isActive"),
      width: "25%",
      isStatus: true,
    },
  ];
}
