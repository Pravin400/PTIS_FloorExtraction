import type { Column } from "@/components/common/MasterTable";
import type { TapSize } from "@/types/waterBill/tapSizeMaster.types";
import { formatNominalSize } from "@/lib/utils/water-bill/tapSizeMaster.utils";

export function getTapSizeColumns(
  t: (key: string) => string
): Column<TapSize>[] {
  return [
    {
      key: "tapSizeCode",
      label: t("table.tapSizeCode") || "Tap Size Code",
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
      key: "tapSize",
      label: t("table.tapSize"),
      width: "25%",
      align: "center",
      headerClassName: "text-center",
      cellClassName: "text-center",
    },
    {
      key: "nominalSizeValue",
      label: t("table.nominalSizeValue"),
      width: "20%",
      align: "center",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (val) => <span className="font-medium">{formatNominalSize(val)}</span>,
    },
    {
      key: "sizeUnit",
      label: t("table.sizeUnit"),
      width: "20%",
      align: "center",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (val) => val ? String(val) : "_",
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
