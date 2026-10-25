import React from "react";
import type { Column } from "@/components/common/MasterTable";
import type { AssetGrievanceCategory } from "@/types/asset-masters/asset-grievance-category.types";
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

export function getAssetGrievanceCategoryColumns(
  t: (key: string) => string,
  tCommon: (key: string) => string,
  sortBy?: string,
  sortOrder?: string,
  onSort?: (key: string) => void
): Column<AssetGrievanceCategory>[] {
  const sortableColumns = [
    "grievanceTypeCode",
    "grievanceTypeName",
    "grievanceTypeNameLocal",
    "targetTableName",
    "slaDays",
    "displaySequence",
    "isActive",
  ];

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
      key: "grievanceTypeCode",
      label: createSortableLabel(t("list.headers.typeCode"), "grievanceTypeCode"),
      width: "9%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-all [word-break:break-all] font-medium",
      render: (value) => <TruncatedText text={typeof value === "string" ? value : ""} maxLength={20} />,
    },
    {
      key: "grievanceTypeName",
      label: createSortableLabel(t("list.headers.name"), "grievanceTypeName"),
      width: "13%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-all [word-break:break-all]",
      render: (value) => <TruncatedText text={typeof value === "string" ? value : ""} maxLength={25} />,
    },
    {
      key: "grievanceTypeNameLocal",
      label: createSortableLabel(t("list.headers.nameLocal"), "grievanceTypeNameLocal"),
      width: "12%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-all [word-break:break-all]",
      render: (value) => <TruncatedText text={typeof value === "string" && value ? value : "-"} maxLength={25} />,
    },
    {
      key: "codeFormat",
      label: t("list.headers.codeFormat"),
      width: "11%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-all [word-break:break-all]",
      render: (value) => <TruncatedText text={typeof value === "string" && value ? value : "-"} maxLength={25} />,
    },
    {
      key: "targetTableName",
      label: createSortableLabel(t("list.headers.targetTableName"), "targetTableName"),
      width: "11%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-all [word-break:break-all]",
      render: (value) => <TruncatedText text={typeof value === "string" && value ? value : "-"} maxLength={20} />,
    },
    {
      key: "description",
      label: t("list.headers.description"),
      width: "13%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "break-all [word-break:break-all]",
      render: (value) => <TruncatedText text={typeof value === "string" && value ? value : "-"} maxLength={30} />,
    },
    {
      key: "slaDays",
      label: createSortableLabel(t("list.headers.sla"), "slaDays"),
      width: "7%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      render: (value) => (value != null ? `${String(value)} ${t("list.days")}` : "-"),
    },
    {
      key: "displaySequence",
      label: createSortableLabel(t("list.headers.displaySequence"), "displaySequence"),
      width: "7%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      render: (value) => (value != null ? String(value) : "-"),
    },
    {
      key: "isActive",
      label: createSortableLabel(t("list.headers.status"), "isActive"),
      width: "7%",
      align: "center",
      headerClassName: "whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      isStatus: true,
    },
  ];
}
