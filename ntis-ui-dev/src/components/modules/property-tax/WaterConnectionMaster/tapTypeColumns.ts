import type { Column } from "@/components/common/MasterTable";
import type { TapType } from "@/types/water-connection.types";

export function getTapTypeColumns(
  t: (key: string) => string
): Column<TapType>[] {
  return [
    {
      key: "typeCode",
      label: t("table.typeCode"),
      width: "20%",
      align: "center",
      headerClassName: "text-center",
      cellClassName: "text-center",
    },
    {
      key: "typeName",
      label: t("table.typeName"),
      width: "35%",
      align: "center",
      headerClassName: "text-center",
      cellClassName: "text-center",
    },
    {
      key: "isActive",
      label: t("table.status"),
      width: "25%",
      align: "center",
      headerClassName: "text-center",
      cellClassName: "text-center",
      isStatus: true,
    },
  ];
}
