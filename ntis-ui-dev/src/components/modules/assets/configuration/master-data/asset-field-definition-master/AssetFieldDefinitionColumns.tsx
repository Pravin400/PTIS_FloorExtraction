import React from "react";
import type { Column } from "@/components/common/MasterTable";
import type { AssetFieldDefinition } from "@/types/asset-masters/asset-field-definition.types";
import { SortAscButton, SortDescButton, SortDefaultButton, ViewButton } from "@/components/common/ActionButtons";
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

export function getAssetFieldDefinitionColumns(
  t: (key: string) => string,
  tCommon: (key: string) => string,
  sortBy?: string,
  sortOrder?: string,
  onSort?: (key: string) => void,
  onViewOptions?: (row: AssetFieldDefinition) => void
): Column<AssetFieldDefinition>[] {
  const sortableColumns = ["fieldCode", "fieldName"];

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
      key: "fieldCode",
      label: createSortableLabel(t("list.table.fieldCode"), "fieldCode"),
      width: "15%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-words max-w-[180px]",
      render: (value) => (
        <TruncatedText text={typeof value === "string" ? value : ""} maxLength={20} />
      ),
    },
    {
      key: "fieldName",
      label: createSortableLabel(t("list.table.fieldName"), "fieldName"),
      width: "15%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-words max-w-[180px]",
      render: (value) => (
        <TruncatedText text={typeof value === "string" ? value : ""} maxLength={20} />
      ),
    },
    {
      key: "fieldLabel",
      label: t("list.table.fieldLabel"),
      width: "15%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-words max-w-[200px]",
      render: (value) => (
        <TruncatedText text={typeof value === "string" ? value : ""} maxLength={25} />
      ),
    },
    {
      key: "fieldType",
      label: t("list.table.fieldType"),
      width: "10%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-words max-w-[120px]",
      render: (value) => (
        <TruncatedText text={typeof value === "string" ? value : ""} maxLength={15} />
      ),
    },
    {
      key: "fieldGroup",
      label: t("list.table.fieldGroup"),
      width: "15%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-words max-w-[180px]",
      render: (value) => (
        <TruncatedText text={typeof value === "string" && value ? value : "-"} maxLength={20} />
      ),
    },
    {
      key: "displayOrder",
      label: t("list.table.displayOrder"),
      width: "10%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-words",
      render: (value) => (value != null ? String(value) : "-"),
    },
    {
      key: "isRequired",
      label: t("list.table.isRequired"),
      width: "10%",
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
      key: "viewOptions",
      label: t("list.table.viewOptions") || "View Options",
      width: "10%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-words",
      render: (_value, row) => {
        const isOptionType = ["radio", "checkbox", "select"].includes(row.fieldType);
        const hasOptions = Boolean(row.optionsJson && row.optionsJson.trim() !== "");
        if (isOptionType && hasOptions) {
          return (
            <ViewButton
              aria-label={t("list.table.viewOptions") || "View Options"}
              onClick={() => onViewOptions?.(row)}
            />
          );
        }
        return "-";
      },
    },
    {
      key: "isActive",
      label: t("list.table.status"),
      width: "10%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-words",
      isStatus: true,
    },
  ];
}
