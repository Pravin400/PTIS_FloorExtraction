"use client";

import type { Column } from "@/components/common/MasterTable";
import type { WaterPenaltyRuleDto } from "@/types/water-bill/penalty-rule-master.types";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  STATIC_FINANCIAL_YEARS,
  STATIC_CONNECTION_CATEGORIES,
  STATIC_CHARGE_HEADS,
  STATIC_GEOGRAPHY_UNITS,
} from "@/lib/constants/water-masters.constants";

const getFinancialYearLabel = (id?: number | null, name?: string | null) => {
  if (name) return name;
  if (!id) return "—";
  const match = STATIC_FINANCIAL_YEARS.find((x) => x.value === String(id));
  return match ? match.label.split(" (")[0] : `FY #${id}`;
};

const getConnectionCategoryLabel = (id?: number | null, name?: string | null) => {
  if (name) return name;
  if (!id || id === 0) return "All Categories";
  const match = STATIC_CONNECTION_CATEGORIES.find((x) => x.value === String(id));
  return match ? match.label.split(" (")[0] : `Cat #${id}`;
};

const getGeographyLabel = (id?: number | null, name?: string | null) => {
  if (name) return name;
  if (!id) return "—";
  const match = STATIC_GEOGRAPHY_UNITS.find((x) => x.value === String(id));
  return match ? match.label.split(" (")[0] : `Geo #${id}`;
};

const getChargeHeadLabel = (id?: number | null, name?: string | null) => {
  if (name) return name;
  if (!id) return "—";
  const match = STATIC_CHARGE_HEADS.find((x) => x.value === String(id));
  return match ? match.label.split(" (")[0] : `Head #${id}`;
};

export function getPenaltyRuleColumns(
  t: (key: string) => string
): Column<WaterPenaltyRuleDto>[] {
  return [
    {
      key: "financialYearName",
      label: t("columns.financialYear") || "Financial Year",
      headerClassName: "text-xs px-2 py-2.5 whitespace-nowrap font-semibold",
      cellClassName: "text-xs px-2 py-1.5 whitespace-nowrap",
      render: (_val, row) => {
        const label = getFinancialYearLabel(row.financialYearId, row.financialYearName);
        return (
          <span className="font-semibold text-slate-800" title={label}>
            {label}
          </span>
        );
      },
    },
    {
      key: "connectionCategoryName",
      label: t("columns.connectionCategory") || "Connection Category",
      headerClassName: "text-xs px-2 py-2.5 whitespace-nowrap font-semibold",
      cellClassName: "text-xs px-2 py-1.5 whitespace-nowrap",
      render: (_val, row) => (
        <span className="font-medium text-slate-700">
          {getConnectionCategoryLabel(row.connectionCategoryId, row.connectionCategoryName)}
        </span>
      ),
    },
    {
      key: "geographyName",
      label: t("columns.geography") || "Geography Unit",
      headerClassName: "text-xs px-2 py-2.5 whitespace-nowrap font-semibold",
      cellClassName: "text-xs px-2 py-1.5 whitespace-nowrap",
      render: (_val, row) => (
        <span className="text-slate-600">{getGeographyLabel(row.geographyUnitId, row.geographyName)}</span>
      ),
    },
    {
      key: "chargeHeadName",
      label: t("columns.chargeHead") || "Charge Head",
      headerClassName: "text-xs px-2 py-2.5 whitespace-nowrap font-semibold",
      cellClassName: "text-xs px-2 py-1.5 whitespace-nowrap",
      render: (_val, row) => (
        <span className="text-slate-700">{getChargeHeadLabel(row.chargeHeadId, row.chargeHeadName)}</span>
      ),
    },
    {
      key: "penaltyType",
      label: t("columns.penaltyType") || "Penalty Type",
      headerClassName: "text-xs px-2 py-2.5 whitespace-nowrap font-semibold",
      cellClassName: "text-xs px-2 py-1.5 whitespace-nowrap",
      render: (_val, row) => (
        <span className="text-slate-800 font-medium">{row.penaltyType || "—"}</span>
      ),
    },
    {
      key: "fromDay",
      label: t("columns.fromDay") || "From Day",
      align: "center",
      headerClassName: "text-xs px-1.5 py-2.5 whitespace-nowrap text-center font-semibold",
      cellClassName: "text-xs px-1.5 py-1.5 text-center font-mono text-slate-700",
      render: (_val, row) => row.fromDay,
    },
    {
      key: "toDay",
      label: t("columns.toDay") || "To Day",
      align: "center",
      headerClassName: "text-xs px-1.5 py-2.5 whitespace-nowrap text-center font-semibold",
      cellClassName: "text-xs px-1.5 py-1.5 text-center font-mono text-slate-700",
      render: (_val, row) => (row.toDay !== null && row.toDay !== undefined ? row.toDay : "∞"),
    },
    {
      key: "percentageRate",
      label: t("columns.percentageRate") || "Rate (%)",
      align: "center",
      headerClassName: "text-xs px-1.5 py-2.5 whitespace-nowrap text-center font-semibold",
      cellClassName: "text-xs px-1.5 py-1.5 text-center",
      render: (_val, row) => (
        <span className="text-slate-700 font-medium">
          {row.percentageRate !== null && row.percentageRate !== undefined ? `${row.percentageRate}%` : "—"}
        </span>
      ),
    },
    {
      key: "flatAmount",
      label: t("columns.flatAmount") || "Flat (₹)",
      align: "center",
      headerClassName: "text-xs px-1.5 py-2.5 whitespace-nowrap text-center font-semibold",
      cellClassName: "text-xs px-1.5 py-1.5 text-center text-slate-700 font-medium",
      render: (_val, row) => (row.flatAmount !== null && row.flatAmount !== undefined ? `₹${row.flatAmount}` : "—"),
    },
    {
      key: "maximumAmount",
      label: t("columns.maximumAmount") || "Max Cap (₹)",
      align: "center",
      headerClassName: "text-xs px-1.5 py-2.5 whitespace-nowrap text-center font-semibold",
      cellClassName: "text-xs px-1.5 py-1.5 text-center text-slate-700",
      render: (_val, row) =>
        row.penaltyType === "Flat"
          ? "—"
          : row.maximumAmount !== null && row.maximumAmount !== undefined
            ? `₹${row.maximumAmount}`
            : "—",
    },
    {
      key: "effectiveFrom",
      label: t("columns.effectiveFrom") || "Effective From",
      headerClassName: "text-xs px-2 py-2.5 whitespace-nowrap font-semibold",
      cellClassName: "text-xs px-2 py-1.5 whitespace-nowrap font-mono text-slate-700",
      render: (_val, row) => (row.effectiveFrom ? String(row.effectiveFrom).split("T")[0] : "—"),
    },
    {
      key: "effectiveTo",
      label: t("columns.effectiveTo") || "Effective To",
      headerClassName: "text-xs px-2 py-2.5 whitespace-nowrap font-semibold",
      cellClassName: "text-xs px-2 py-1.5 whitespace-nowrap font-mono text-slate-700",
      render: (_val, row) => (row.effectiveTo ? String(row.effectiveTo).split("T")[0] : "—"),
    },
    {
      key: "isCurrentBill",
      label: "Bill Types",
      align: "center",
      headerClassName: "text-xs px-2 py-2.5 whitespace-nowrap text-center font-semibold",
      cellClassName: "text-xs px-2 py-1.5 text-center",
      render: (_val, row) => (
        <div className="inline-flex gap-1 justify-center">
          {row.isCurrentBill && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              {t("columns.isCurrentBill") || "Current"}
            </span>
          )}
          {row.isPendingBill && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
              {t("columns.isPendingBill") || "Pending"}
            </span>
          )}
          {!row.isCurrentBill && !row.isPendingBill && (
            <span className="text-slate-400">—</span>
          )}
        </div>
      ),
    },
    {
      key: "isActive",
      label: t("columns.status") || "Status",
      align: "center",
      headerClassName: "text-xs px-2 py-2.5 whitespace-nowrap text-center font-semibold",
      cellClassName: "text-xs px-2 py-1.5 text-center",
      render: (_val, row) => <StatusBadge value={row.isActive} />,
    },
  ];
}
