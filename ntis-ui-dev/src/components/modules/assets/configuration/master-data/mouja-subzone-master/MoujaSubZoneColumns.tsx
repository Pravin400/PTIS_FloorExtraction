import React from "react";
import type { Column } from "@/components/common/MasterTable";
import type { Mouja, SubZoneDetails } from "@/types/asset-masters/mouja-subzone.types";
import { SortAscButton, SortDescButton, SortDefaultButton } from "@/components/common/ActionButtons";

interface SortableHeaderProps {
  label: string;
  columnKey: string;
  sortBy?: string;
  sortOrder?: string;
  onSort: (key: string) => void;
  tCommon: (key: string) => string;
}

function SortableHeader({
  label,
  columnKey,
  sortBy,
  sortOrder,
  onSort,
  tCommon,
}: SortableHeaderProps): React.ReactElement {
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

export function getMoujaColumns(
  t: (key: string) => string,
  tCommon: (key: string) => string,
  sortBy?: string,
  sortOrder?: string,
  onSort?: (key: string) => void
): Column<Mouja>[] {
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
          tCommon={tCommon}
        />
      );
    }
    return label;
  };

  return [
    {
      key: "moujaNo",
      label: createSortableLabel(t("list.table.moujaNo"), "moujaNo"),
      width: "35%",
      align: "center",
      render: (value) => (
        <span className="break-all font-semibold text-blue-700">
          {typeof value === "string" ? value : ""}
        </span>
      ),
    },
    {
      key: "moujaName",
      label: createSortableLabel(t("list.table.moujaName"), "moujaName"),
      width: "45%",
      align: "center",
      render: (value) => <span className="break-all">{typeof value === "string" ? value : ""}</span>,
    },
    {
      key: "isActive",
      label: t("list.table.status"),
      width: "20%",
      align: "center",
      isStatus: true,
    },
  ];
}

export function getSubZoneColumns(
  t: (key: string) => string,
  tCommon: (key: string) => string,
  sortBy?: string,
  sortOrder?: string,
  onSort?: (key: string) => void
): Column<SubZoneDetails>[] {
  const sortableColumns = ["subZoneNo", "subZoneName"];

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
      key: "subZoneNo",
      label: createSortableLabel(t("list.table.subZoneNo"), "subZoneNo"),
      width: "35%",
      align: "center",
      render: (value) => <span className="break-all">{typeof value === "string" ? value : ""}</span>,
    },
    {
      key: "subZoneName",
      label: createSortableLabel(t("list.table.subZoneName"), "subZoneName"),
      width: "45%",
      align: "center",
      render: (value) => <span className="break-all">{typeof value === "string" ? value : ""}</span>,
    },
    {
      key: "isActive",
      label: t("list.table.status"),
      width: "20%",
      align: "center",
      isStatus: true,
    },
  ];
}
