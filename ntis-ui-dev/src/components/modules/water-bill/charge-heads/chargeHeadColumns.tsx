"use client";

import type { Column } from "@/components/common/MasterTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { ChargeHead } from "@/types/water-bill/chargeHeads.types";

export function getChargeHeadColumns(
  t?: (key: string) => string,
  tCommon?: (key: string) => string
): Column<ChargeHead>[] {
  const tr = (key: string, fallback: string) => {
    if (!t) return fallback;
    try {
      const val = t(key);
      return val && val !== key ? val : fallback;
    } catch {
      return fallback;
    }
  };

  return [
    {
      key: "chargeHeadCode",
      label: tr("list.table.code", "Charge Head Code"),
      cellClassName: "whitespace-nowrap",
      render: (value, row) => {
        const code =
          (typeof value === "string" && value) ||
          (typeof (row as Record<string, unknown>)?.code === "string" &&
            ((row as Record<string, unknown>).code as string)) ||
          "";
        return code ? (
          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border whitespace-nowrap bg-[#e3f0fd] text-blue-700 border-blue-200">
            {code}
          </span>
        ) : (
          "—"
        );
      },
    },
    {
      key: "chargeHeadName",
      label: tr("list.table.name", "Name"),
      cellClassName: "font-medium text-slate-800 whitespace-nowrap",
      render: (val, row) => {
        const name =
          (typeof val === "string" && val) ||
          (typeof (row as Record<string, unknown>)?.name === "string" &&
            ((row as Record<string, unknown>).name as string)) ||
          "—";
        return name;
      },
    },
    {
      key: "description",
      label: tr("list.table.description", "Description"),
      cellClassName: "text-slate-600",
      render: (val, row) => {
        const desc =
          (typeof val === "string" && val) ||
          (typeof (row as Record<string, unknown>)?.remark === "string" &&
            ((row as Record<string, unknown>).remark as string)) ||
          "—";
        return desc;
      },
    },
    {
      key: "chargeType",
      label: tr("list.table.chargeType", "Charge Type"),
      cellClassName: "text-slate-700 whitespace-nowrap",
      render: (val, row) => {
        const type =
          (typeof val === "string" && val) ||
          (typeof (row as Record<string, unknown>)?.type === "string" &&
            ((row as Record<string, unknown>).type as string)) ||
          "—";
        return type;
      },
    },
    {
      key: "isRefundable",
      label: tr("list.table.refundable", "Refundable"),
      align: "center",
      render: (val) => (
        <StatusBadge
          value={Boolean(val)}
          activeLabel={tCommon ? tCommon("yes") : "Yes"}
          inactiveLabel={tCommon ? tCommon("no") : "No"}
          variant="status"
          className={val ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-100 text-slate-600 border-slate-200"}
        />
      ),
    },
    {
      key: "isRegularPay",
      label: tr("list.table.regularPay", "Regular Pay"),
      align: "center",
      render: (val) => (
        <StatusBadge
          value={Boolean(val)}
          activeLabel={tCommon ? tCommon("yes") : "Yes"}
          inactiveLabel={tCommon ? tCommon("no") : "No"}
          variant="status"
          className={val ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-slate-100 text-slate-600 border-slate-200"}
        />
      ),
    },
    {
      key: "isActive",
      label: tr("list.table.active", "Active"),
      align: "center",
      isStatus: true,
    },
  ];
}
