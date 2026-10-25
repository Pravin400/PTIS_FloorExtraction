import type { Column } from "@/components/common/MasterTable";
import type { SubFloor } from "@/types/floor.types";

export const subFloorColumns = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, values?: Record<string, any>) => string,
  floorLabel?: string
): Column<SubFloor>[] => [
  {
    key: "subFloorCode",
    label: t("table.columns.subFloorCode", { floor: floorLabel ?? "" }),
    width: "15%",
    headerClassName: "text-center",
    cellClassName: "text-center",
  },
  {
    key: "descriptionEnglish",
    label: t("table.columns.descriptionEnglish"),
    width: "25%",
    headerClassName: "text-center",
    cellClassName: "text-center",
    render: (_, row) => row.descriptionEnglish || "-",
  },
  {
    key: "description",
    label: t("table.columns.descriptionRegional"),
    width: "25%",
    headerClassName: "text-center",
    cellClassName: "text-center",
  },
  {
    key: "sequenceNo",
    label: t("table.columns.sequenceNo"),
    width: "15%",
    headerClassName: "text-center",
    cellClassName: "text-center",
  },
  {
    key: "isActive",
    label: t("table.columns.status"),
    width: "15%",
    isStatus: true,
    headerClassName: "text-center",
    cellClassName: "text-center",
  },
];
