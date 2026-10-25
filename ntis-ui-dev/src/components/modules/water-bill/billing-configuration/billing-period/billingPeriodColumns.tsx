import type { Column } from "@/components/common/MasterTable";
import type { BillingPeriodMaster } from "@/types/water-bill/billing-configuration/billingPeriodMaster.types";
import {
  SortableHeader,
  renderDateCell,
  renderBillingFrequency,
  renderDateRange,
} from "./billingPeriodColumnRenderers";

export function getBillingPeriodColumns(
  t: (key: string) => string,
  tCommon: (key: string) => string,
  sortBy?: string,
  sortOrder?: string,
  onSort?: (key: string) => void
): Column<BillingPeriodMaster>[] {
  const toText = t("table.to") || "to";

  const sortableColumns = [
    "financialYear",
    "billingFrequency",
    "periodFromDate",
    "periodToDate",
    "billGenerationDate",
    "dueDate",
    "graceDays",
    "currentPenaltyStartDate",
    "pendingPenaltyStartDate",
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
          tCommon={tCommon}
        />
      );
    }
    return label;
  };

  return [
    {
      key: "financialYear",
      align: "center",
      label: createSortableLabel(t("table.financialYear"), "financialYear"),
      width: "8%",
      headerClassName: "whitespace-nowrap min-w-[85px]",
      cellClassName: "whitespace-nowrap min-w-[85px]",
      render: (value) => (
        <span className="font-semibold text-slate-800 text-xs">
          {typeof value === "string" && value.trim() ? value : "—"}
        </span>
      ),
    },
    {
      key: "billingFrequency",
      align: "center",
      label: createSortableLabel(t("table.billingFrequency"), "billingFrequency"),
      width: "12%",
      headerClassName: "whitespace-nowrap min-w-[115px]",
      cellClassName: "whitespace-nowrap min-w-[115px]",
      render: (value) => renderBillingFrequency(value),
    },
    {
      key: "periodFromDate",
      align: "center",
      label: createSortableLabel(t("table.periodFrom"), "periodFromDate"),
      width: "10%",
      headerClassName: "whitespace-nowrap min-w-[95px]",
      cellClassName: "whitespace-nowrap min-w-[95px]",
      render: (value) => renderDateCell(typeof value === "string" ? value : undefined),
    },
    {
      key: "periodToDate",
      align: "center",
      label: createSortableLabel(t("table.periodTo"), "periodToDate"),
      width: "10%",
      headerClassName: "whitespace-nowrap min-w-[95px]",
      cellClassName: "whitespace-nowrap min-w-[95px]",
      render: (value) => renderDateCell(typeof value === "string" ? value : undefined),
    },
    {
      key: "billGenerationDate",
      align: "center",
      label: createSortableLabel(t("table.billGenerationDate"), "billGenerationDate"),
      width: "11%",
      headerClassName: "whitespace-nowrap min-w-[110px]",
      cellClassName: "whitespace-nowrap min-w-[110px]",
      render: (value) => renderDateCell(typeof value === "string" ? value : undefined),
    },
    {
      key: "dueDate",
      align: "center",
      label: createSortableLabel(t("table.dueDate"), "dueDate"),
      width: "10%",
      headerClassName: "whitespace-nowrap min-w-[95px]",
      cellClassName: "whitespace-nowrap min-w-[95px]",
      render: (value) => renderDateCell(typeof value === "string" ? value : undefined),
    },
    {
      key: "graceDays",
      align: "center",
      label: createSortableLabel(t("table.graceDays"), "graceDays"),
      width: "8%",
      headerClassName: "whitespace-nowrap min-w-[80px]",
      cellClassName: "whitespace-nowrap min-w-[80px]",
      render: (value) => (
        <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 tabular-nums border border-slate-200/70">
          {value !== undefined && value !== null ? String(value) : "0"}
        </span>
      ),
    },
    {
      key: "currentPenaltyStartDate",
      align: "center",
      label: createSortableLabel(t("table.currentPenalty"), "currentPenaltyStartDate"),
      width: "13%",
      headerClassName: "whitespace-nowrap min-w-[125px]",
      cellClassName: "whitespace-nowrap min-w-[125px]",
      render: (_value, row) =>
        renderDateRange(row.currentPenaltyStartDate, row.currentPenaltyEndDate, toText, "current"),
    },
    {
      key: "pendingPenaltyStartDate",
      align: "center",
      label: createSortableLabel(t("table.pendingPenalty"), "pendingPenaltyStartDate"),
      width: "13%",
      headerClassName: "whitespace-nowrap min-w-[125px]",
      cellClassName: "whitespace-nowrap min-w-[125px]",
      render: (_value, row) =>
        renderDateRange(row.pendingPenaltyStartDate, row.pendingPenaltyEndDate, toText, "pending"),
    },
    {
      key: "isActive",
      align: "center",
      label: t("table.status"),
      width: "8%",
      headerClassName: "whitespace-nowrap min-w-[80px]",
      cellClassName: "whitespace-nowrap min-w-[80px]",
      isStatus: true,
    },
  ];
}
