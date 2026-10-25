import React from "react";
import type { Column } from "@/components/common/MasterTable";
import type { AssetDocumentDefinition } from "@/types/asset-masters/asset-document-definition.types";
import { SortAscButton, SortDescButton, SortDefaultButton } from "@/components/common/ActionButtons";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TruncatedText } from "@/components/common/TruncatedText";

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

export function getAssetDocumentDefinitionColumns(
  t: (key: string) => string,
  tCommon: (key: string) => string,
  sortBy?: string,
  sortOrder?: string,
  onSort?: (key: string) => void
): Column<AssetDocumentDefinition>[] {
  const sortableColumns = ["documentCode", "documentName", "displayOrder"];

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
      key: "documentCode",
      label: createSortableLabel(t("list.table.documentCode"), "documentCode"),
      width: "20%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-words max-w-[200px]",
      render: (value) => (
        <TruncatedText text={typeof value === "string" ? value : ""} maxLength={25} />
      ),
    },
    {
      key: "documentName",
      label: createSortableLabel(t("list.table.documentName"), "documentName"),
      width: "20%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-words max-w-[220px]",
      render: (value) => (
        <TruncatedText text={typeof value === "string" ? value : ""} maxLength={30} />
      ),
    },
    {
      key: "description",
      label: t("list.table.description"),
      width: "25%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-words max-w-[280px]",
      render: (value) => (
        <TruncatedText text={typeof value === "string" && value ? value : "-"} maxLength={35} />
      ),
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
      key: "isRequired",
      label: t("list.table.isRequired"),
      width: "12%",
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
      width: "13%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-words",
      isStatus: true,
    },
  ];
}
