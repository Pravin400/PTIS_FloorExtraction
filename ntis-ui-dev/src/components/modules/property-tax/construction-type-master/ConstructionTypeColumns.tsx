import React from "react";
import type { Column } from "@/components/common/MasterTable";
import type { ConstructionType } from "@/types/construction.types";
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
 * Returns the table column configuration for Construction Type Master.
 *
 * @param t       - Translation function from useTranslations("construction.constructionType")
 * @param tCommon - Translation function from useTranslations("common"); must be passed
 *                  from a component/hook so that no hook is called inside this plain function.
 * @param sortBy  - Current sort column key
 * @param sortOrder - Current sort order ("asc" | "desc")
 * @param onSort  - Callback invoked when a column header is clicked
 * @returns Array of column definitions
 */
export function getConstructionTypeColumns(
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string) => string,
  sortBy?: string,
  sortOrder?: string,
  onSort?: (key: string) => void,
  constructionTypeLabel?: string
): Column<ConstructionType>[] {
  const values = { constructionType: constructionTypeLabel ?? "", entity: constructionTypeLabel ?? "" };
  // Whitelisted sortable columns
  const sortableColumns = ["constructionCode", "descriptionEnglish", "description", "searchSequence"];

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
      key: "constructionCode",
      label: createSortableLabel(t("list.table.constructionCode", values), "constructionCode"),
      width: "18%",
      render: (value) => (typeof value === "string" ? value : ""),
    },
    {
      key: "descriptionEnglish",
      label: createSortableLabel(t("list.table.descriptionEnglish", values), "descriptionEnglish"),
      width: "26%",
      render: (value) => (typeof value === "string" ? value : ""),
    },
    {
      key: "description",
      label: createSortableLabel(t("list.table.description", values), "description"),
      width: "26%",
      render: (value) => (typeof value === "string" ? value : ""),
    },
    {
      key: "searchSequence",
      label: createSortableLabel(t("list.table.searchSequence", values), "searchSequence"),
      width: "15%",
      render: (value) => (typeof value === "number" ? value : ""),
    },
    {
      key: "isActive",
      label: createSortableLabel(t("list.table.status", values), "isActive"),
      width: "15%",
      isStatus: true,
    },
  ];
}