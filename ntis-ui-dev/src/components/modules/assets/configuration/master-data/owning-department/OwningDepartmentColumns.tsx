"use client";

import React from "react";
import type { Column } from "@/components/common/MasterTable";
import type { OwningDepartment } from "@/types/asset-masters/owning-department.types";
import { SortAscButton, SortDescButton, SortDefaultButton } from "@/components/common/ActionButtons";

interface GetOwningDepartmentColumnsProps {
  t: (key: string) => string;
  tCommon: (key: string) => string;
  sortBy?: string;
  sortOrder?: string;
  onSort: (key: string) => void;
}

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
    <div className="flex items-center gap-1 justify-start w-full">
      <span>{label}</span>
      {renderSortButton()}
    </div>
  );
}

export function getColumns({
  t,
  tCommon,
  sortBy,
  sortOrder,
  onSort,
}: GetOwningDepartmentColumnsProps): Column<OwningDepartment>[] {
  const createSortableLabel = (label: string, dataKey: string) => {
    return (
      <SortableHeader
        label={label}
        columnKey={dataKey}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={onSort}
        tCommon={tCommon}
      />
    );
  };

  return [
    {
      key: "owningDepartmentName",
      label: createSortableLabel(t("columns.owningDepartmentName"), "owningDepartmentName"),
      width: "35%",
      render: (v) => (typeof v === "string" ? v : ""),
    },
    {
      key: "description",
      label: createSortableLabel(t("columns.description"), "description"),
      width: "45%",
      render: (v) => (typeof v === "string" ? v : ""),
    },
    {
      key: "isActive",
      label: t("columns.status"),
      width: "10%",
      isStatus: true,
    },
  ];
}
