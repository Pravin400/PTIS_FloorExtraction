import React from "react";
import type { Column } from "@/components/common/MasterTable";
import type { GstMaster } from "@/types/asset-masters/gst-master.types";
import { SortAscButton, SortDescButton, SortDefaultButton } from "@/components/common/ActionButtons";
import { formatNumericDate } from "@/lib/utils/format";

interface GetGstMasterColumnsProps {
  t: (key: string) => string;
  tCommon: (key: string) => string;
  sortBy?: string;
  sortOrder?: string;
  onSort: (key: string) => void;
}

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
    <div className="flex items-center gap-1 justify-start w-full">
      <span>{label}</span>
      {renderSortButton()}
    </div>
  );
}

export function getGstMasterColumns({
  t,
  tCommon,
  sortBy,
  sortOrder,
  onSort,
}: GetGstMasterColumnsProps): Column<GstMaster>[] {
  const createSortableLabel = (label: string, dataKey: string) => {
    return (
      <SortableHeader
        label={label}
        columnKey={dataKey}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={onSort}
        tCommon={tCommon}
      />
    );
  };

  return [
    { key: "taxCode", label: createSortableLabel(t("taxCode"), "taxCode"), width: "12%", render: (v) => (typeof v === "string" ? v : "") },
    { key: "taxName", label: createSortableLabel(t("taxName"), "taxName"), width: "28%", render: (v) => (typeof v === "string" ? v : "") },
    { key: "taxPercentage", label: createSortableLabel(t("taxPercent"), "taxPercentage"), width: "10%", render: (v) => (typeof v === "number" ? String(v) : "") },
    { 
      key: "effectiveFromDate", 
      label: createSortableLabel(t("form.fields.effectiveFrom.label"), "effectiveFromDate"), 
      width: "15%", 
      render: (_, row) => formatNumericDate(row.effectiveFromDate) 
    },
    { 
      key: "effectiveToDate", 
      label: createSortableLabel(t("form.fields.effectiveTo.label"), "effectiveToDate"), 
      width: "15%", 
      render: (_, row) => formatNumericDate(row.effectiveToDate) 
    },
    { key: "isActive", label: t("status"), width: "10%", isStatus: true },
  ];
}

