import React from "react";
import { Column } from "@/components/common/MasterTable";
import { ZoningRecord, PreviewRow } from "@/types/taxzoning.types";
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
      return <SortAscButton onClick={() => onSort(columnKey)} aria-label={`${tCommon("table.sort.verb")} ${label} ${tCommon("table.sort.ascending")}`} />;
    }
    if (isDesc) {
      return <SortDescButton onClick={() => onSort(columnKey)} aria-label={`${tCommon("table.sort.verb")} ${label} ${tCommon("table.sort.descending")}`} />;
    }
    return <SortDefaultButton onClick={() => onSort(columnKey)} aria-label={`${tCommon("table.sort.by")} ${label}`} />;
  };

  return (
    <div className="flex items-center gap-1 justify-start w-full">
      <span>{label}</span>
      {renderSortButton()}
    </div>
  );
}

/**
 * Get column definitions for the tax zoning records table
 */
export const getTaxZoningColumns = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, values?: Record<string, any>) => string,
  tCommon: (key: string) => string,
  sortBy?: string,
  sortOrder?: string,
  onSort?: (key: string) => void,
  wardLabel?: string,
  taxZoneLabel?: string
): Column<ZoningRecord>[] => {
  const sortableColumns = ["wardNo", "fromProperty", "toProperty", "taxZoneNo"];

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
    { key: "wardNo", label: createSortableLabel(t('columns.wardNo', { ward: wardLabel ?? "" }), "wardNo") },
    { key: "fromProperty", label: createSortableLabel(t('columns.fromProperty'), "fromProperty") },
    { key: "toProperty", label: createSortableLabel(t('columns.toProperty'), "toProperty") },
    { key: "taxZoneNo", label: createSortableLabel(t('columns.taxZoneNo', { taxZone: taxZoneLabel ?? "" }), "taxZoneNo") },
  ];
};

/**
 * Get column definitions for the preview table
 */
export const getPreviewColumns = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, values?: Record<string, any>) => string,
  wardLabel?: string,
  taxZoneLabel?: string
): Column<PreviewRow>[] => [
  { key: "oldTaxZoneNo", label: t('columns.oldTaxZoneNo', { taxZone: taxZoneLabel ?? "" }) || 'Old Tax Zone', headerClassName: "p-2 text-[12px]" },
  { key: "taxZoneNo", label: t('columns.newTaxZoneNo', { taxZone: taxZoneLabel ?? "" }) || 'New TaxZoneNo', headerClassName: "p-2 text-[12px]" },
  { key: "wardNo", label: t('columns.wardNo', { ward: wardLabel ?? "" }), headerClassName: "p-2 text-[12px]" },
  { key: "propertyNo", label: t('columns.propertyNo'), headerClassName: "p-2 text-[12px]" },
];
