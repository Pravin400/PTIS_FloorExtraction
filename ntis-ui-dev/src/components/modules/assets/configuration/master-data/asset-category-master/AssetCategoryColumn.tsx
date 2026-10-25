"use client";

import React from "react";
import { Badge } from "@/components/common/Badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SortAscButton, SortDescButton, SortDefaultButton } from "@/components/common/ActionButtons";
import { TruncatedText } from "@/components/common/TruncatedText";
import type { Column } from "@/components/common/MasterTable";
import type { AssetCategoryTableRow } from "@/types/asset-masters/asset-category.types";

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

export function getAssetCategoryColumns(
  t: (key: string) => string,
  tCommon: (key: string) => string,
  sortBy?: string,
  sortOrder?: string,
  onSort?: (field: string) => void
): Column<AssetCategoryTableRow>[] {
  const sortableColumns = ["categoryCode", "categoryName", "description"];

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
      key: "categoryCode",
      width: "15%",
      label: createSortableLabel(t("labels.code"), "categoryCode"),
      render: (_, r) => (
        <Badge variant="secondary" size="sm">
          <TruncatedText text={String(r.categoryCode ?? "")} maxLength={15} />
        </Badge>
      ),
    },
    {
      key: "categoryName",
      width: "25%",
      label: createSortableLabel(t("labels.name"), "categoryName"),
      render: (_, r) => (
        <TruncatedText
          text={r.categoryName}
          maxLength={25}
          className="font-semibold text-sm text-slate-800"
        />
      ),
    },
    {
      key: "description",
      width: "25%",
      label: createSortableLabel(t("labels.description"), "description"),
      render: (_, r) => (
        <TruncatedText
          text={r.description}
          maxLength={30}
          className="text-sm text-slate-600"
        />
      ),
    },
    {
      key: "valuationType",
      width: "15%",
      label: t("labels.valuationType"),
      render: (_, r) => (
        <TruncatedText
          text={String(r.valuationType || "-")}
          maxLength={20}
          className="text-sm text-slate-700 font-medium"
        />
      ),
    },
    {
      key: "status",
      width: "12%",
      label: t("labels.status"),
      isStatus: true,
      render: (_, r) => <StatusBadge value={r.status as string} />,
    },
  ];
}
