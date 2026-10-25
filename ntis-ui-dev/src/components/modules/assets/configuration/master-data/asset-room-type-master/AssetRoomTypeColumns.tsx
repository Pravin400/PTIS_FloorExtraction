import React from "react";
import type { Column } from "@/components/common/MasterTable";
import type { AssetRoomType } from "@/types/asset-masters/asset-room-type.types";
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

/**
 * Returns the table column configuration for Asset Room Type Master.
 */
export function getAssetRoomTypeColumns(
  t: (key: string) => string,
  tCommon: (key: string) => string,
  sortBy?: string,
  sortOrder?: string,
  onSort?: (key: string) => void
): Column<AssetRoomType>[] {
  const sortableColumns = ["roomTypeCode", "roomTypeName", "description"];

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
      key: "roomTypeCode",
      label: createSortableLabel(t("list.table.roomTypeCode"), "roomTypeCode"),
      width: "20%",
      align: "center",
      render: (value) => (typeof value === "string" ? value : ""),
    },
    {
      key: "roomTypeName",
      label: createSortableLabel(t("list.table.roomTypeName"), "roomTypeName"),
      width: "20%",
      align: "center",
      render: (value) => (typeof value === "string" ? value : ""),
    },
    {
      key: "description",
      label: createSortableLabel(t("list.table.description"), "description"),
      width: "20%",
      align: "center",
      render: (value) => (typeof value === "string" ? value : "-"),
    },
    {
      key: "assetCategoryName",
      label: t("list.table.assetCategoryAndType"),
      width: "30%",
      align: "center",
      render: (_, row) => {
        const parts = [];
        if (row.assetCategoryName) parts.push(row.assetCategoryName);
        if (row.assetTypeName) parts.push(row.assetTypeName);
        return parts.length > 0 ? parts.join(" / ") : "-";
      },
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
