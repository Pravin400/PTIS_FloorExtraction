import type { Column } from "@/components/common/MasterTable";
import type { TaxZone } from "@/types/taxzone.types";

/**
 * Returns the table column configuration for Tax Zone Master
 * @param t - Translation function from useTranslations("taxZone")
 * @param zoneLabel - Alias-resolved label for "Zone" (e.g. from Alias Master), used to interpolate {zone} in column headers
 * @returns Array of column definitions
 */
export function getTaxZoneColumns(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, values?: Record<string, any>) => string,
  zoneLabel?: string
): Column<TaxZone>[] {
  return [
    {
      key: "taxZoneNo",
      label: t("list.table.zoneNo", { zone: zoneLabel ?? "" }),
      width: "20%",
      render: (value) => (
        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 font-mono border border-blue-300 rounded-md">
          {String(value)}
        </span>
      ),
    },
    {
      key: "taxZoneType",
      label: t("list.table.zoneType", { zone: zoneLabel ?? "" }),
      width: "20%",
      render: (value) => (
          <span className="font-medium text-gray-800">{String(value)}</span>
      ),
    },
    {
      key: "remark",
      label: t("list.table.remark", { zone: zoneLabel ?? "" }),
      width: "20%",
      render: (value) => <span className="text-gray-700">{value ? String(value) : "-"}</span>,
    },
    {
      key: "status",
      label: t("list.table.status"),
      width: "20%",
      isStatus: true,
    },
  ];
}
