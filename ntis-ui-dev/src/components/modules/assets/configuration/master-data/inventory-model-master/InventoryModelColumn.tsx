"use client";

import React from "react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SortAscButton, SortDescButton, SortDefaultButton } from "@/components/common/ActionButtons";
import type { SortDirection } from "@/components/common/SortableColumnHeader";
import type { Column } from "@/components/common/MasterTable";
import type { MasterDataRecord } from "@/types/asset-masters/master-data.types";

function SortableHeader({
  label,
  columnKey,
  sortBy,
  sortOrder,
  onSort,
  tCommon,
  justify = "start",
}: {
  label: string;
  columnKey: string;
  sortBy?: string;
  sortOrder?: string | null;
  onSort: (key: string) => void;
  tCommon?: (key: string) => string;
  justify?: "start" | "center" | "end";
}): React.ReactElement {
  const isActive = sortBy === columnKey;
  const isAsc = isActive && sortOrder === "asc";
  const isDesc = isActive && sortOrder === "desc";

  const renderSortButton = () => {
    if (isAsc) {
      return (
        <SortAscButton
          onClick={() => onSort(columnKey)}
          aria-label={tCommon ? `${tCommon("table.sort.verb")} ${label} ${tCommon("table.sort.ascending")}` : `Sort ${label} ascending`}
        />
      );
    }
    if (isDesc) {
      return (
        <SortDescButton
          onClick={() => onSort(columnKey)}
          aria-label={tCommon ? `${tCommon("table.sort.verb")} ${label} ${tCommon("table.sort.descending")}` : `Sort ${label} descending`}
        />
      );
    }
    return (
      <SortDefaultButton
        onClick={() => onSort(columnKey)}
        aria-label={tCommon ? `${tCommon("table.sort.by")} ${label}` : `Sort by ${label}`}
      />
    );
  };

  const justifyClass = justify === "center" ? "justify-center" : justify === "end" ? "justify-end" : "justify-start";

  return (
    <div className={`flex items-center gap-1 ${justifyClass} w-full`}>
      <span>{label}</span>
      {renderSortButton()}
    </div>
  );
}

export function getInventoryModelColumns(
  t: (key: string) => string,
  sortBy?: string,
  sortOrder?: SortDirection,
  onSort?: (field: string) => void
): Column<MasterDataRecord>[] {
  const sortableColumns = ["modelName", "inventoryItemName", "isActive"];

  const createSortableLabel = (label: string, key: string, justify: "start" | "center" | "end" = "start") => {
    if (onSort && sortableColumns.includes(key)) {
      return (
        <SortableHeader
          label={label}
          columnKey={key}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
          justify={justify}
        />
      );
    }
    return label;
  };

  return [
    {
      key: "inventoryItemName",
      width: "20%",
      label: createSortableLabel(t("labels.itemName"), "inventoryItemName"),
      render: (_, r) => (
        <div className="font-semibold text-sm text-slate-800 break-all whitespace-normal">
          {r.inventoryItemName || (r as Record<string, unknown>).InventoryItemName as string || "-"}
        </div>
      ),
    },
    {
      key: "name",
      width: "20%",
      label: createSortableLabel(t("labels.name"), "modelName"),
      render: (_, r) => (
        <div className="font-semibold text-sm text-slate-800 break-all whitespace-normal">
          {r.name}
        </div>
      ),
    },
    {
      key: "description",
      width: "35%",
      label: t("labels.description"),
      render: (_, r) => (
        <div className="text-sm text-slate-600 line-clamp-2 break-all whitespace-normal">
          {r.description || "-"}
        </div>
      ),
    },
    {
      key: "displayOrder",
      width: "12%",
      label: t("labels.displayOrder"),
      align: "center",
      render: (_, r) => (
        <div className="text-sm font-medium text-slate-700 text-center">
          {r.displayOrder !== undefined && r.displayOrder !== null ? r.displayOrder : "-"}
        </div>
      ),
    },
    {
      key: "status",
      width: "13%",
      label: createSortableLabel(t("labels.status"), "isActive"),
      render: (_, r) => <StatusBadge value={r.status} />,
    },
  ];
}
