import React from "react";
import type { Column } from "@/components/common/MasterTable";
import type { PenaltyRule } from "@/types/asset-masters/penalty-rule-master.types";
import { SortAscButton, SortDescButton, SortDefaultButton } from "@/components/common/ActionButtons";
import { formatIndianNumber } from "@/lib/utils/format";

interface GetPenaltyRuleMasterColumnsProps {
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

export function getPenaltyRuleMasterColumns({
  t,
  tCommon,
  sortBy,
  sortOrder,
  onSort,
}: GetPenaltyRuleMasterColumnsProps): Column<PenaltyRule>[] {
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

  const getCalculationTypeLabel = (val: string) => {
    if (val === "Percentage") return t("form.fields.calculationType.options.percentage");
    if (val === "FlatAmount") return t("form.fields.calculationType.options.flatAmount");
    if (val === "PerDay") return t("form.fields.calculationType.options.perDay");
    return val;
  };

  return [
    { key: "penaltyCode", label: createSortableLabel(t("penaltyCode"), "penaltyCode"), width: "15%", render: (v) => (typeof v === "string" ? v : "") },
    { key: "penaltyName", label: createSortableLabel(t("penaltyName"), "penaltyName"), width: "30%", render: (v) => (typeof v === "string" ? v : "") },
    { key: "calculationType", label: createSortableLabel(t("calculationType"), "calculationType"), width: "18%", render: (v) => (typeof v === "string" ? getCalculationTypeLabel(v) : "") },
    {
      key: "penaltyValue",
      label: createSortableLabel(t("penaltyValue"), "penaltyValue"),
      width: "12%",
      render: (v, row) => {
        if (typeof v !== "number") return "";
        const decimals = Number.isInteger(v) ? 0 : 2;
        const formatted = formatIndianNumber(v, decimals, decimals);
        if (row.calculationType === "Percentage") {
          return `${formatted}%`;
        }
        if (row.calculationType === "PerDay") {
          return `₹${formatted} / ${t("form.fields.calculationType.options.perDay")}`;
        }
        return `₹${formatted}`;
      },
    },
    { key: "gracePeriodDays", label: createSortableLabel(t("gracePeriodDays"), "gracePeriodDays"), width: "15%", render: (v) => (typeof v === "number" ? String(v) : "") },
    { key: "isActive", label: t("status"), width: "10%", isStatus: true },
  ];
}
