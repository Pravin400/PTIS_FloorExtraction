import type React from "react";
import type { Column } from "@/components/common/MasterTable";
import type { OwnershipType } from "@/types/asset-masters/ownership-type.types";
import { SortAscButton, SortDescButton, SortDefaultButton } from "@/components/common/ActionButtons";

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
  }

  return (
    <div className="flex items-center gap-1 justify-start w-full">
      <span>{label}</span>
      {renderSortButton()}
    </div>
  );
}

export function getOwnershipTypeColumns(
  t: (key: string) => string,
  tCommon: (key: string) => string,
  sortBy?: string,
  sortOrder?: string,
  onSort?: (key: string) => void
): Column<OwnershipType>[] {
  const sortableColumns = ["ownershipTypeName"];

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
      key: "ownershipTypeName",
      label: createSortableLabel(t("configuration.masterData.form.labels.name"), "ownershipTypeName"),
      width: "35%",
      render: (value) => <div className="font-semibold text-sm text-slate-800 break-all whitespace-normal">{typeof value === "string" ? value : ""}</div>,
    },
    {
      key: "description",
      label: t("configuration.masterData.form.labels.description"),
      width: "40%",
      render: (value) => (
        <div className="text-sm text-slate-600 line-clamp-2 break-all whitespace-normal">
          {typeof value === "string" && value ? value : "-"}
        </div>
      ),
    },
    {
      key: "isActive",
      label: t("configuration.masterData.form.labels.status"),
      width: "15%",
      isStatus: true,
    },
  ];
}
