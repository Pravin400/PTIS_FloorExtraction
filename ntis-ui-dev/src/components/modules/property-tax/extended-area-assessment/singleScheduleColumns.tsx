import { Badge } from "@/components/common";
import type { Column } from "@/components/common";
import type { ScheduleRow, ScheduleRowStatus } from "@/types/extended-area-assessment.types";

export type ScheduleTableRow = ScheduleRow & Record<string, unknown>;

type Translator = (key: string) => string;

const money = (n: number): string =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_BADGE: Record<ScheduleRowStatus, { variant: "success" | "secondary" | "outline" }> = {
  Current: { variant: "success" },
  Completed: { variant: "secondary" },
  Future: { variant: "outline" },
};

export function getSingleScheduleColumns(t: Translator, baseTaxCode?: string): Column<ScheduleTableRow>[] {
  const isTaxTotal = baseTaxCode === "Tax Total";

  return [
    { key: "srNo", label: t("scheduleTable.columns.srNo"), width: "60px", align: "center" },
    { key: "financialYear", label: t("scheduleTable.columns.financialYear"), width: "100px" },
    { key: "stage", label: t("scheduleTable.columns.stage"), width: "150px" },
    {
      key: "municipalPctLabel",
      label: isTaxTotal ? t("scheduleTable.columns.municipalTotalTaxPct") : t("scheduleTable.columns.municipalPct"),
      width: "90px",
      align: "center",
      cellClassName: "font-bold text-cyan-700",
    },
    {
      key: "stageTax",
      label: t("scheduleTable.columns.stageTax"),
      width: "120px",
      align: "right",
      render: (val) => money(Number(val ?? 0)),
    },
    {
      key: "oldGpTax",
      label: isTaxTotal ? t("scheduleTable.columns.oldGpTotalTax") : t("scheduleTable.columns.oldGpTax"),
      width: "120px",
      align: "right",
      render: (val) => money(Number(val ?? 0)),
    },
    {
      key: "applicableTax",
      label: isTaxTotal ? t("scheduleTable.columns.applicableTotalTax") : t("scheduleTable.columns.applicableTax"),
      width: "130px",
      align: "right",
      cellClassName: "font-bold",
      render: (val) => money(Number(val ?? 0)),
    },
    {
      key: "totalDemand",
      label: t("scheduleTable.columns.totalDemand"),
      width: "130px",
      align: "right",
      cellClassName: "font-bold",
      render: (val) => money(Number(val ?? 0)),
    },
    {
      key: "difference",
      label: t("scheduleTable.columns.difference"),
      width: "130px",
      align: "right",
      render: (val) => money(Number(val ?? 0)),
    },
    { key: "ruleApplied", label: t("scheduleTable.columns.ruleApplied"), width: "220px" },
    {
      key: "status",
      label: t("scheduleTable.columns.status"),
      width: "100px",
      align: "center",
      render: (val) => {
        const status = val as ScheduleRowStatus;
        return (
          <Badge variant={STATUS_BADGE[status].variant}>{t(`scheduleTable.status.${status.toLowerCase()}`)}</Badge>
        );
      },
    },
  ];
}
