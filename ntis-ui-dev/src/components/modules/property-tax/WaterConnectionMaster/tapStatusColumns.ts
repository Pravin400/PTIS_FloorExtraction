import type { Column } from "@/components/common/MasterTable";
import type { TapStatus } from "@/types/water-connection.types";

export function getTapStatusColumns(
  t: (key: string) => string
): Column<TapStatus>[] {
  return [
    {
      key: "statusName",
      label: t("table.statusName"),
      width: "40%",
      align: "center",
      headerClassName: "text-center",
      cellClassName: "text-center",
    },
    {
      key: "isActive",
      label: t("table.status"),
      width: "30%",
      align: "center",
      headerClassName: "text-center",
      cellClassName: "text-center",
      isStatus: true,
    },
  ];
}
