import React from "react";
import { Column } from "@/components/common";
import type { Office } from "@/types/office.types";
import { SortAscButton, SortDescButton, SortDefaultButton } from "@/components/common";

function SortableHeader({
  label,
  columnKey,
  sortBy,
  sortOrder,
  onSort,
  tCommon,
  align = 'left',
}: {
  label: string;
  columnKey: string;
  sortBy?: string;
  sortOrder?: string;
  onSort: (key: string) => void;
  tCommon: (key: string) => string;
  align?: 'left' | 'center' | 'right';
}): React.ReactElement {
  const isActive = sortBy === columnKey;
  const isAsc = isActive && sortOrder === "asc";
  const isDesc = isActive && sortOrder === "desc";

  const renderSortButton = () => {
    if (isAsc) return <SortAscButton onClick={() => onSort(columnKey)} aria-label={`${tCommon("table.sort.verb")} ${label} ${tCommon("table.sort.ascending")}`} />;
    if (isDesc) return <SortDescButton onClick={() => onSort(columnKey)} aria-label={`${tCommon("table.sort.verb")} ${label} ${tCommon("table.sort.descending")}`} />;
    return <SortDefaultButton onClick={() => onSort(columnKey)} aria-label={`${tCommon("table.sort.by")} ${label}`} />;
  };

  const justifyClass = align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start';

  return (
    <div className={`flex items-center gap-1 w-full ${justifyClass}`}>
      <span>{label}</span>
      {renderSortButton()}
    </div>
  );
}

export function getOfficeColumns(
  t: (key: string) => string,
  tCommon: (key: string) => string,
  sortBy?: string,
  sortOrder?: string,
  onSort?: (key: string) => void
): Column<Office>[] {
  const sortableColumns = ["officeCode", "officeName", "type"];

  const createSortableLabel = (label: string, key: string, align: 'left' | 'center' | 'right' = 'left') => {
    if (onSort && sortableColumns.includes(key)) {
      return (
        <SortableHeader
          label={label}
          columnKey={key}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
          tCommon={(k) => tCommon(k)}
          align={align}
        />
      );
    }
    return label;
  };

  return [
    {
      key: "officeCode",
      label: createSortableLabel(t("list.table.officeCode") || "Office Code", "officeCode", "left"),
      width: "15%",
      align: "left",
      render: (value) => (typeof value === "string" ? value : ""),
    },
    {
      key: "officeName",
      label: createSortableLabel(t("list.table.officeName") || "Office Name", "officeName", "left"),
      width: "35%",
      align: "left",
      render: (value) => (typeof value === "string" ? value : ""),
    },
    {
      key: "type",
      label: createSortableLabel(t("list.table.type") || "Type", "type", "left"),
      width: "20%",
      align: "left",
      render: (value) => (typeof value === "string" ? value : ""),
    },
    {
      key: "isActive",
      label: createSortableLabel(t("list.table.status") || "Status", "isActive", "center"),
      width: "20%",
      align: "center",
      isStatus: true,
    },
  ];
}
