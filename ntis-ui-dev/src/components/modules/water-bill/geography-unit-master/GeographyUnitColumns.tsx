import type { Column } from "@/components/common/MasterTable";
import { GeographyUnit } from "@/types/water-bill/geographyUnit.types";


/**
 * Returns the table column configuration for Geography Unit Master.
 * Note: the API does not support server-side sorting, so no sort controls are rendered.
 */
export function getGeographyUnitColumns(
  t: (key: string, values?: Record<string, string | number | Date>) => string
): Column<GeographyUnit>[] {
  return [
    {
      key: "geographyUnitCode",
      label: t("list.table.unitCode"),
      width: "18%",
      render: (value) =>
        typeof value === "string" && value ? (
          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border whitespace-nowrap bg-[#f3e8ff] text-purple-700 border-purple-200">
            {value}
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "geographyUnitName",
      label: t("list.table.unitName"),
      width: "20%",
      render: (value) => (typeof value === "string" ? value : ""),
    },
    {
      key: "geographyType",
      label: t("list.table.geographyType"),
      width: "18%",
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
      key: "parentGeographyUnitName",
      label: t("list.table.parentUnit"),
      width: "18%",
      render: (value) => (typeof value === "string" ? value : "—"),
    },
    {
      key: "searchSequence", 
      label: t("list.table.searchSequence"), 
      width: "18%"},
    {
      key: "isActive",
      label: t("list.table.status"),
      width: "18%",
      isStatus: true,
    },
  ];
}
