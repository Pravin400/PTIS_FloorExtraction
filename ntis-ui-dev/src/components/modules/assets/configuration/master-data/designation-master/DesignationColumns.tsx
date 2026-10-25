import React from "react";
import type { Column } from "@/components/common/MasterTable";
import type { Designation } from "@/types/asset-masters/designation.types";
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

export function getDesignationColumns(
  t: (key: string) => string,
  tCommon: (key: string) => string,
  sortBy?: string,
  sortOrder?: string,
  onSort?: (key: string) => void
): Column<Designation>[] {
  const sortableColumns = ["designationCode", "designationName", "designationLocal"];

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
      key: "designationCode",
      label: createSortableLabel(t("list.table.designationCode"), "designationCode"),
      width: "15%",
      align: "center",
      render: (value) => (typeof value === "string" ? value : ""),
    },
    {
      key: "designationName",
      label: createSortableLabel(t("list.table.designationName"), "designationName"),
      width: "20%",
      align: "center",
      render: (value) => (typeof value === "string" ? value : ""),
    },
    {
      key: "designationLocal",
      label: createSortableLabel(t("list.table.designationLocal"), "designationLocal"),
      width: "15%",
      align: "center",
      render: (value) => (typeof value === "string" ? value : ""),
    },
    {
      key: "designationDescription",
      label: t("list.table.description"),
      width: "15%",
      align: "center",
      render: (value) => (typeof value === "string" ? value : "-"),
    },
    {
      key: "owningDepartmentName",
      label: t("list.table.owningDepartment"),
      width: "15%",
      align: "center",
      render: (value) => (typeof value === "string" ? value : "-"),
    },
    {
      key: "isActive",
      label: t("list.table.status"),
      width: "10%",
      align: "center",
      isStatus: true,
    },
  ];
}
