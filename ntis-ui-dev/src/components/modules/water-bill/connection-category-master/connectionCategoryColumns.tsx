import type { Column } from "@/components/common/MasterTable";
import { Badge } from "@/components/common/Badge";
import { TruncatedText } from "@/components/common";
import type { ConnectionCategory } from "@/types/waterBill/connectionCategoryMaster.types";

export function getConnectionCategoryColumns(
  t: (key: string) => string
): Column<ConnectionCategory>[] {
  return [
    {
      key: "connectionCategoryCode",
      label: t("table.connectionCategoryCode") || "Category Type Code",
      width: "15%",
      align: "center",
      headerClassName: "text-center",
      cellClassName: "text-center font-medium",
      render: (value) =>
        typeof value === "string" && value ? (
          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border whitespace-nowrap bg-[#e3f0fd] text-blue-700 border-blue-200">
            {value}
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "connectionCategory",
      label: t("table.connectionCategory") || "Connection Category",
      width: "18%",
      align: "center",
      headerClassName: "text-center",
      cellClassName: "text-center",
    },
    {
      key: "billingFrequency",
      label: t("table.billingFrequency") || "Billing Frequency",
      width: "14%",
      align: "center",
      headerClassName: "text-center",
      cellClassName: "text-center",
    },
    {
      key: "isMetered",
      label: t("table.isMetered") || "Metered Type",
      width: "12%",
      align: "center",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (_val, row) => (
        <Badge
          variant={row.isMetered ? "success" : "secondary"}
          size="sm"
        >
          {row.isMetered
            ? t("table.metered") || "Metered"
            : t("table.unmetered") || "Non-Metered"}
        </Badge>
      ),
    },
    {
      key: "billingMethod",
      label: t("table.billingMethod") || "Billing Method",
      width: "13%",
      align: "center",
      headerClassName: "text-center",
      cellClassName: "text-center",
    },
    {
      key: "description",
      label: t("table.description") || "Description",
      width: "18%",
      align: "center",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (val) => val ? <TruncatedText text={String(val)} maxLength={50} className="!cursor-default" /> : "_",
    },
    {
      key: "isActive",
      label: t("table.statusName") || "Status",
      width: "10%",
      align: "center",
      headerClassName: "text-center",
      cellClassName: "text-center",
      isStatus: true,
    },
  ];
}
