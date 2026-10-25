import React from "react";
import type { Column } from "@/components/common/MasterTable";
import type { AssetPhotoType } from "@/types/asset-masters/asset-photo-type.types";
import { SortAscButton, SortDescButton, SortDefaultButton } from "@/components/common/ActionButtons";
import { StatusBadge } from "@/components/common/StatusBadge";

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
 * Returns the table column configuration for Asset Photo Type Master.
 */
export function getAssetPhotoTypeColumns(
  t: (key: string) => string,
  tCommon: (key: string) => string,
  sortBy?: string,
  sortOrder?: string,
  onSort?: (key: string) => void
): Column<AssetPhotoType>[] {
  const sortableColumns = ["photoTypeCode", "photoTypeName", "displayOrder", "description"];

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
      key: "photoTypeCode",
      label: createSortableLabel(t("list.table.photoTypeCode"), "photoTypeCode"),
      width: "14%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-words",
      render: (value) => (typeof value === "string" ? value : ""),
    },
    {
      key: "photoTypeName",
      label: createSortableLabel(t("list.table.photoTypeName"), "photoTypeName"),
      width: "16%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-words",
      render: (value) => (typeof value === "string" ? value : ""),
    },
    {
      key: "description",
      label: createSortableLabel(t("list.table.description"), "description"),
      width: "18%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-words",
      render: (value) => (typeof value === "string" ? value : "-"),
    },
    {
      key: "displayOrder",
      label: createSortableLabel(t("list.table.displayOrder"), "displayOrder"),
      width: "10%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-words",
      render: (value) => (value != null ? String(value) : "-"),
    },
    {
      key: "assetCategoryName",
      label: t("list.table.assetCategoryAndType"),
      width: "16%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-words",
      render: (_, row) => {
        const parts = [];
        if (row.assetCategoryName) parts.push(row.assetCategoryName);
        if (row.assetTypeName) parts.push(row.assetTypeName);
        return parts.length > 0 ? parts.join(" / ") : "-";
      },
    },
    {
      key: "isSubUnit",
      label: t("list.table.isSubUnit"),
      width: "8%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-words",
      render: (value) => (
        <StatusBadge
          value={Boolean(value)}
          activeLabel={t("yes")}
          inactiveLabel={t("no")}
        />
      ),
    },
    {
      key: "isRequired",
      label: t("list.table.isRequired"),
      width: "9%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-words",
      render: (value) => (
        <StatusBadge
          value={Boolean(value)}
          activeLabel={t("yes")}
          inactiveLabel={t("no")}
        />
      ),
    },
    {
      key: "isActive",
      label: t("list.table.status"),
      width: "9%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-words",
      isStatus: true,
    },
  ];
}
