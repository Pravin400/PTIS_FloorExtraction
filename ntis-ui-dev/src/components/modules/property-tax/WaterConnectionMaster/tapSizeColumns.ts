import type { Column } from "@/components/common/MasterTable";
import type { TapSize } from "@/types/water-connection.types";

export function getTapSizeColumns(
  t: (key: string) => string
): Column<TapSize>[] {
  return [
    {
      key: "displayLabel",
      label: t("table.displayLabel"),
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
