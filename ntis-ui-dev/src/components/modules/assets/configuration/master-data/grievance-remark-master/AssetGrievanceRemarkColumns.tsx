import React from "react";
import type { Column } from "@/components/common/MasterTable";
import type { AssetGrievanceRemark } from "@/types/asset-masters/asset-grievance-remark.types";
import { SortAscButton, SortDescButton, SortDefaultButton } from "@/components/common/ActionButtons";
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
    <div className="inline-flex items-center gap-1 justify-center w-full whitespace-nowrap">
      <span className="whitespace-nowrap">{label}</span>
      {renderSortButton()}
    </div>
  );
}

export function getAssetGrievanceRemarkColumns(
  t: (key: string) => string,
  tCommon: (key: string) => string,
  sortBy?: string,
  sortOrder?: string,
  onSort?: (key: string) => void
): Column<AssetGrievanceRemark>[] {
  const sortableColumns: Record<string, string> = {
    remark: "remark",
  };

  const createSortableLabel = (label: string, key: string) => {
    const apiSortKey = sortableColumns[key];
    if (onSort && apiSortKey) {
      return (
        <SortableHeader
          label={label}
          columnKey={apiSortKey}
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
      key: "remark",
      label: createSortableLabel(t("table.columns.remark"), "remark"),
      width: "30%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-all [word-break:break-all]",
      render: (value) => <TruncatedText text={typeof value === "string" ? value : ""} maxLength={30} />,
    },
    {
      key: "description",
      label: t("form.description") || "Description",
      width: "30%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-all [word-break:break-all]",
      render: (value) => <TruncatedText text={typeof value === "string" && value ? value : "-"} maxLength={30} />,
    },
    {
      key: "grievanceCategoryName",
      label: t("table.columns.remarkType"),
      width: "20%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-all [word-break:break-all]",
      render: (value) => <TruncatedText text={typeof value === "string" && value ? value : "-"} maxLength={25} />,
    },
    {
      key: "isActive",
      label: t("table.columns.status"),
      width: "10%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      isStatus: true,
    },
  ];
}
