import { TruncatedText } from "@/components/common";
import type { Column } from "@/components/common/MasterTable";
import type { ConnectionType } from "@/types/waterBill/connectionTypeMaster.types";

export function getConnectionTypeColumns(
  t: (key: string) => string
): Column<ConnectionType>[] {
  return [
    {
      key: "connectionTypeCode",
      label: t("table.connectionTypeCode") || "Connection Type Code",
      width: "20%",
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
      key: "connectionType",
      label: t("table.connectionType"),
      width: "25%",
      align: "center",
      headerClassName: "text-center",
      cellClassName: "text-center",
    },
    {
      key: "description",
      label: t("table.description"),
      width: "35%",
      align: "center",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (val) => val ? <TruncatedText text={String(val)} maxLength={50} className="!cursor-default" /> : "_",
    },
    {
      key: "isActive",
      label: t("table.statusName"),
      width: "20%",
      align: "center",
      headerClassName: "text-center",
      cellClassName: "text-center",
      isStatus: true,
    },
  ];
}
