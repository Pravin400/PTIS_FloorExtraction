import React from "react";
import type { Column } from "@/components/common/MasterTable";
import type { InventoryName, InventoryNameCategory } from "@/types/asset-masters/inventory-name.types";
import { SortAscButton, SortDescButton, SortDefaultButton } from "@/components/common/ActionButtons";
import { TruncatedText } from "@/components/common/TruncatedText";

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

export function getInventoryNameColumns(
  t: (key: string) => string,
  tCommon: (key: string) => string,
  sortBy?: string,
  sortOrder?: string,
  onSort?: (key: string) => void,
  categories?: InventoryNameCategory[]
): Column<InventoryName>[] {
  const sortableColumns = ["subTypeCode", "subTypeName", "isActive"];

  const createSortableLabel = (label: string, key: string, justify: "start" | "center" | "end" = "start") => {
    if (onSort && sortableColumns.includes(key)) {
      return (
        <SortableHeader
          label={label}
          columnKey={key}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
          tCommon={(k) => tCommon(k)}
          justify={justify}
        />
      );
    }
    return label;
  };

  const categoryMap = new Map<number, string>();
  if (categories) {
    categories.forEach((cat) => {
      categoryMap.set(cat.id, cat.categoryName);
    });
  }

  return [
    {
      key: "subTypeCode",
      label: createSortableLabel(t("configuration.masterData.form.labels.code"), "subTypeCode"),
      width: "15%",
      render: (value) => <div className="font-semibold text-sm text-slate-800">{typeof value === "string" ? value : ""}</div>,
    },
    {
      key: "subTypeName",
      label: createSortableLabel(t("configuration.masterData.form.labels.name"), "subTypeName"),
      width: "20%",
      render: (value) => <div className="font-semibold text-sm text-slate-800 break-all whitespace-normal">{typeof value === "string" ? value : ""}</div>,
    },
    {
      key: "description",
      label: t("configuration.masterData.form.labels.description"),
      width: "25%",
      render: (value) => (
        <div className="text-sm text-slate-600 break-all whitespace-normal">
          <TruncatedText text={typeof value === "string" && value ? value : "-"} maxLength={100} />
        </div>
      ),
    },
    {
      key: "inventoryItemCategoryId",
      label: t("configuration.masterData.form.labels.category"),
      width: "30%",
      render: (value) => {
        if (value === null || value === undefined) return "-";
        const categoryId = typeof value === "number" ? value : Number(value);
        return <span className="text-sm text-slate-600">{categoryMap.get(categoryId) || "-"}</span>;
      },
    },
    {
      key: "displayOrder",
      label: t("configuration.masterData.form.labels.displayOrder"),
      width: "10%",
      align: "center",
      render: (value) => (
        <div className="text-sm font-medium text-slate-700 text-center">
          {value !== undefined && value !== null ? String(value) : "-"}
        </div>
      ),
    },
    {
      key: "isActive",
      label: createSortableLabel(t("configuration.masterData.form.labels.status"), "isActive"),
      width: "10%",
      isStatus: true,
    },
  ];
}
