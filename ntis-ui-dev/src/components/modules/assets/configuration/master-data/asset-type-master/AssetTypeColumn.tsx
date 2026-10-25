"use client";

import React from "react";
import { Badge } from "@/components/common/Badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SortAscButton, SortDescButton, SortDefaultButton } from "@/components/common/ActionButtons";
import { TruncatedText } from "@/components/common/TruncatedText";
import type { Column } from "@/components/common/MasterTable";
import type { MasterDataRecord } from "@/types/asset-masters/master-data.types";

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
    <div className="flex items-center gap-1 justify-center w-full">
      <span>{label}</span>
      {renderSortButton()}
    </div>
  );
}

export function getAssetTypeColumns(
  t: (key: string) => string,
  tCommon: (key: string) => string,
  sortBy?: string,
  sortOrder?: string,
  onSort?: (field: string) => void
): Column<MasterDataRecord>[] {
  const sortableColumns = ["typeCode", "typeName", "typeNameLocal", "description"];

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
      key: "id",
      width: "12%",
      align: "center",
      label: createSortableLabel(t("labels.code"), "typeCode"),
      render: (_, r) => (
        <Badge variant="secondary" size="sm">
          {String((r as Record<string, unknown>).code || (r as Record<string, unknown>).typeCode || "")}
        </Badge>
      ),
    },
    {
      key: "name",
      width: "18%",
      align: "center",
      label: createSortableLabel(t("labels.name"), "typeName"),
      render: (_, r) => (
        <div className="font-semibold text-sm text-slate-800">
          <TruncatedText text={r.name} maxLength={22} />
        </div>
      ),
    },
    {
      key: "description",
      width: "16%",
      align: "center",
      label: createSortableLabel(t("labels.description"), "description"),
      render: (_, r) => (
        <div className="text-sm text-slate-700">
          <TruncatedText text={r.description} maxLength={22} />
        </div>
      ),
    },
    {
      key: "typeNameLocal",
      width: "15%",
      align: "center",
      label: createSortableLabel(t("labels.typeNameLocal"), "typeNameLocal"),
      render: (_, r) => (
        <div className="text-sm text-slate-700">
          <TruncatedText text={(r as Record<string, unknown>).typeNameLocal as string} maxLength={22} />
        </div>
      ),
    },
    {
      key: "allowUnitRegistration",
      width: "14%",
      align: "center",
      label: t("labels.unitRegistration"),
      render: (_, r) => (
        <Badge variant={(r as Record<string, unknown>).allowUnitRegistration ? "success" : "secondary"} size="sm">
          {(r as Record<string, unknown>).allowUnitRegistration ? t("labels.yes") : t("labels.no")}
        </Badge>
      ),
    },
    {
      key: "allowRoomRegistration",
      width: "14%",
      align: "center",
      label: t("labels.roomRegistration"),
      render: (_, r) => (
        <Badge variant={(r as Record<string, unknown>).allowRoomRegistration ? "success" : "secondary"} size="sm">
          {(r as Record<string, unknown>).allowRoomRegistration ? t("labels.yes") : t("labels.no")}
        </Badge>
      ),
    },
    {
      key: "isSubUnit",
      width: "12%",
      align: "center",
      label: t("labels.isSubUnit"),
      render: (_, r) => (
        <Badge variant={(r as Record<string, unknown>).isSubUnit ? "success" : "secondary"} size="sm">
          {(r as Record<string, unknown>).isSubUnit ? t("labels.yes") : t("labels.no")}
        </Badge>
      ),
    },
    {
      key: "categoryName",
      width: "17%",
      align: "center",
      label: t("labels.categoryName"),
      render: (_, r) => (
        <div className="text-sm text-slate-700">
          <TruncatedText text={String((r as Record<string, unknown>).categoryName || "-")} maxLength={25} />
        </div>
      ),
    },
    {
      key: "status",
      width: "10%",
      align: "center",
      label: t("labels.status"),
      isStatus: true,
      render: (_, r) => <StatusBadge value={r.status} />,
    },
  ];
}
