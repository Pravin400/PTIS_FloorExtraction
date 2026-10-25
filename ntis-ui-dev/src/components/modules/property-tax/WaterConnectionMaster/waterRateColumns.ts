import type { Column } from "@/components/common/MasterTable";
import type { WaterRate } from "@/types/water-connection.types";

export function getWaterRateColumns(
  t: (key: string) => string
): Column<WaterRate>[] {
  return [
    {
      key: "connectionTypeName",
      label: t("table.connectionTypeName"),
      width: "18%",
      align: "center",
      headerClassName: "text-center",
      cellClassName: "text-center",
    },
    {
      key: "connectionSizeDisplay",
      label: t("table.connectionSizeDisplay"),
      width: "14%",
      align: "center",
      headerClassName: "text-center",
      cellClassName: "text-center",
    },
    {
      key: "yearCode",
      label: t("table.yearCode"),
      width: "14%",
      align: "center",
      headerClassName: "text-center",
      cellClassName: "text-center",
    },
    {
      key: "yearlyRate",
      label: t("table.yearlyRate"),
      width: "14%",
      align: "center",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (value) => (value != null && Number(value) > 0 ? `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "-"),
    },
    {
      key: "quarterlyRate",
      label: t("table.quarterlyRate"),
      width: "14%",
      align: "center",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (value) => (value != null && Number(value) > 0 ? `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "-"),
    },
    {
      key: "monthlyRate",
      label: t("table.monthlyRate"),
      width: "14%",
      align: "center",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (value) => (value != null && Number(value) > 0 ? `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "-"),
    },
    {
      key: "isActive",
      label: t("table.status"),
      width: "12%",
      align: "center",
      headerClassName: "text-center",
      cellClassName: "text-center",
      isStatus: true,
    },
  ];
}
