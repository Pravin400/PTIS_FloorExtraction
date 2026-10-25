import React from "react";
import type { Column } from "@/components/common/MasterTable";
import type { AssetTypeOfUse, AssetSubTypeOfUse } from "@/types/asset-masters/type-of-use.types";
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

export function getTypeOfUseColumns(
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string) => string,
  sortBy?: string,
  sortOrder?: string,
  onSort?: (key: string) => void
): Column<AssetTypeOfUse>[] {
  const sortableColumns = ["typeOfUseCode", "description", "type", "searchSequence"];
  const getTypeLabel = (typeValue: string): string => {
    switch (typeValue) {
      case "R":
        return t("type.options.residential", { default: "R - Residential" });
      case "C":
        return t("type.options.commercial", { default: "C - Commercial" });
      case "I":
        return t("type.options.industrial", { default: "I - Industrial" });
      case "N":
        return t("type.options.nontaxable", { default: "N - Non-taxable" });
      default:
        return typeValue;
    }
  };

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
      key: "typeOfUseCode",
      label: createSortableLabel(t("type.fields.code.label", { default: "Code" }), "typeOfUseCode"),
      width: "25%",
      align: "center",
      render: (value) => (
        <span className="break-all font-semibold text-blue-700">
          {typeof value === "string" ? value : ""}
        </span>
      ),
    },
    {
      key: "description",
      label: createSortableLabel(t("type.fields.description.label", { default: "Description" }), "description"),
      width: "35%",
      align: "center",
      render: (value) => <span className="break-all">{typeof value === "string" ? value : ""}</span>,
    },
    {
      key: "type",
      label: createSortableLabel(t("type.fields.type.label", { default: "Type" }), "type"),
      width: "20%",
      align: "center",
      render: (value) => {
        const typeStr = typeof value === "string" ? value : "";
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {getTypeLabel(typeStr)}
          </span>
        );
      },
    },
    {
      key: "isActive",
      label: tCommon("table.columns.status"),
      width: "20%",
      align: "center",
      isStatus: true,
    },
  ];
}

export function getSubTypeOfUseColumns(
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tCommon: (key: string) => string,
  sortBy?: string,
  sortOrder?: string,
  onSort?: (key: string) => void
): Column<AssetSubTypeOfUse>[] {
  const sortableColumns = ["description"];

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
      key: "description",
      label: createSortableLabel(t("subtype.fields.description.label", { default: "Sub-Type Name" }), "description"),
      width: "55%",
      align: "center",
      render: (value) => <span className="break-all">{typeof value === "string" ? value : ""}</span>,
    },
    {
      key: "searchSequence",
      label: createSortableLabel(t("subtype.fields.sequence.label", { default: "Sequence" }), "searchSequence"),
      width: "25%",
      align: "center",
      render: (value) => <span>{typeof value === "number" ? value : "-"}</span>,
    },
    {
      key: "isActive",
      label: tCommon("table.columns.status"),
      width: "20%",
      align: "center",
      isStatus: true,
    },
  ];
}
