"use client";

import React from "react";
import { Badge } from "@/components/common/Badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SortAscButton, SortDescButton, SortDefaultButton } from "@/components/common/ActionButtons";
import { TruncatedText } from "@/components/common/TruncatedText";
import type { SortDirection } from "@/components/common/SortableColumnHeader";
import type { Column } from "@/components/common/MasterTable";
import type { MasterDataRecord } from "@/types/asset-masters/master-data.types";
import { getSafeMessage } from "@/lib/utils/asset-utils/createSafeMasterTranslator";

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

export function getInventoryCategoryColumns(
  t: (key: string) => string,
  sortBy?: string,
  sortOrder?: SortDirection,
  onSort?: (field: string) => void
): Column<MasterDataRecord>[] {
  const createSortableLabel = (label: string, key: string, justify: "start" | "center" | "end" = "start") => {
    if (onSort) {
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
      key: "id",
      width: "15%",
      label: createSortableLabel(t("labels.code"), "typeCode"),
      render: (_, r) => (
        <Badge variant="secondary" size="sm" className="break-all max-w-[120px]">
          <TruncatedText text={String((r as Record<string, unknown>).code || (r as Record<string, unknown>).typeCode || "")} maxLength={15} />
        </Badge>
      ),
    },
    {
      key: "name",
      width: "25%",
      label: createSortableLabel(t("labels.name"), "typeName"),
      render: (_, r) => (
        <div className="max-w-[280px]">
          <div className="font-semibold text-sm text-slate-800 break-words">
            <TruncatedText text={r.name} maxLength={50} />
          </div>
          <div className="text-xs text-slate-500 break-all mt-0.5">
            <TruncatedText text={r.description} maxLength={100} />
          </div>
        </div>
      ),
    },
    {
      key: "assetCategoryName",
      width: "18%",
      label: (
        getSafeMessage(t, "labels.assetCategory") ||
        getSafeMessage(t, "labels.category") ||
        getSafeMessage(t, "labels.group") ||
        "Asset Category"
      ),
      render: (_, r) => {
        const catName = (r as Record<string, unknown>).assetCategoryName as string | undefined;
        const catId = (r as Record<string, unknown>).assetCategoryId as number | undefined;
        return (
          <div className="text-sm font-medium text-slate-700 break-words">
            <TruncatedText text={catName || (catId ? `Category #${catId}` : "-")} maxLength={40} />
          </div>
        );
      },
    },
    {
      key: "depreciationRate",
      width: "14%",
      label: t("labels.depreciationRate"),
      align: "center",
      render: (_, r) => (
        <div className="text-sm font-medium text-slate-700 text-center">
          {r.depreciationRate !== undefined && r.depreciationRate !== null ? `${r.depreciationRate}%` : "-"}
        </div>
      ),
    },
    {
      key: "displayOrder",
      width: "13%",
      label: createSortableLabel(
        getSafeMessage(t, "labels.displayOrder") || "Display Order",
        "displayOrder",
        "center"
      ),
      align: "center",
      render: (_, r) => (
        <div className="text-sm font-medium text-slate-700 text-center">
          {r.displayOrder !== undefined && r.displayOrder !== null ? r.displayOrder : "-"}
        </div>
      ),
    },
    {
      key: "status",
      width: "15%",
      label: t("labels.status"),
      render: (_, r) => <StatusBadge value={r.status} />,
    },
  ];
}
