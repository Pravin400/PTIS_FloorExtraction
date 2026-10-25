import type { Column } from "@/components/common/MasterTable";
import type { UseSubType } from "@/types/typeOfUse.types";
import { StatusBadge } from "@/components/common/StatusBadge";

/**
 * Type for SubType table rows with serial number
 */
export type SubTypeTableRow = UseSubType & { srNo: number } & Record<string, unknown>;

/**
 * Returns the table column configuration for Type of Use Master - SubType section
 * @param t - Translation function from useTranslations("typeofusemaster")
 * @returns Array of column definitions for SubType table
 */
export function getSubTypeColumns(
  t: (key: string, values?: Record<string, string | number>) => string,
  subTypeOfUseLabel: string = "Sub-Type"
): Column<SubTypeTableRow>[] {
  return [
    {
      key: "srNo" as const,
      label: t("table.columns.serial"),
      width: "60px",
    },
    {
      key: "description" as const,
      label: t("table.columns.subTypeName", { subTypeOfUse: subTypeOfUseLabel }),
      width: "25%",
      render: (v) => (v as string) || "—",
    },
    {
      key: "searchSequence" as const,
      label: t("table.columns.searchSequence"),
      width: "25%",
      render: (v) => String(v ?? "—"),
    },
    {
      key: "status" as const,
      label: t("subtype.fields.status"),
      width: "25%",
      render: (v) => <StatusBadge value={(v as string) ?? "Active"} />,
    },
  ];
}
