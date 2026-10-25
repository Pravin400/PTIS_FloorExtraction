"use client";

import { Column } from "@/components/common/MasterTable";
import { EditButton } from "@/components/common/ActionButtons";
import { TaxZoningRange } from "@/types/taxZoningRange.types";

export const getColumns = (
  onEdit: (id: number) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, values?: Record<string, any>) => string,
  dateLocale: string,
  wardLabel?: string,
  taxZoneLabel?: string
): Column<TaxZoningRange & Record<string, unknown>>[] => {
  return [
    {
      label: t("columns.srNo"),
      key: "srNo",
      width: "54px",
      align: "center",
      render: (_val, _row, idx) => idx + 1,
    },
    {
      label: t("wardNo", { ward: wardLabel ?? "" }),
      key: "wardNo",
      width: "95px",
      render: (val) => <span className="font-black text-[#123d70]">{String(val)}</span>,
    },
    {
      label: t("columns.propertyRange"),
      key: "fromPropertyNo",
      width: "145px",
      render: (_, row) => {
        let label: string;
        if (row.assignEntireWard) {
          const min = row.minPropertyNo ?? "-";
          const max = row.maxPropertyNo ?? "-";
          label = `${min} – ${max}`;
        } else {
          label = `${row.fromPropertyNo ?? "-"} – ${row.toPropertyNo ?? "-"}`;
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#f1f8ff] text-[#123d70] font-extrabold text-[11px]">
            {label}
          </span>
        );
      },
    },
    {
      label: t("columns.totalProperties"),
      key: "totalProperties",
      width: "110px",
      align: "center",
      render: (val) => (
        <span className="inline-flex items-center justify-center min-w-[34px] px-2 py-1 rounded-lg bg-[#eef2f8] text-[#123d70] font-black">
          {Number(val ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      label: t("zoneDescription", { taxZone: taxZoneLabel ?? "" }),
      key: "zoneDescription",
      render: (val) => (
        <div className="text-[#42526b] max-w-[640px] leading-tight break-words">{String(val ?? "")}</div>
      ),
    },
    {
      label: t("taxZone", { taxZone: taxZoneLabel ?? "" }),
      key: "taxZoneNo",
      width: "100px",
      align: "center",
      render: (val) => (
        <span className="inline-flex items-center justify-center min-w-[34px] px-2 py-1 rounded-lg bg-[#e7eefc] text-[#263d79] font-black">
          {String(val)}
        </span>
      ),
    },
    {
      label: t("columns.lastUpdated"),
      key: "updatedDate",
      width: "145px",
      render: (val) =>
        val
          ? new Date(String(val)).toLocaleString(dateLocale, {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-",
    },
    {
      label: t("columns.actions"),
      key: "actions",
      width: "100px",
      align: "center",
      render: (_, row) => (
        <div className="flex justify-center gap-1">
          <EditButton onClick={() => onEdit(row.id)} />
        </div>
      ),
    },
  ];
};
