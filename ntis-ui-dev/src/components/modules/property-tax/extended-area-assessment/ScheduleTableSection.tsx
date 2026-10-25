import type { useTranslations } from "next-intl";
import { MasterTable, ExportButton, ApplyButton } from "@/components/common";
import type { SingleAssessmentResult } from "@/types/extended-area-assessment.types";
import { getSingleScheduleColumns, type ScheduleTableRow } from "./singleScheduleColumns";
import { money } from "./formatMoney";

interface ScheduleTableSectionProps {
  t: ReturnType<typeof useTranslations>;
  result: SingleAssessmentResult;
  isTaxTotal: boolean;
  onExportCsv: () => void;
  onPrint: () => void;
}

/** The year-wise Section 129A assessment schedule table, with its export/print actions and footer totals. */
export function ScheduleTableSection({ t, result, isTaxTotal, onExportCsv, onPrint }: ScheduleTableSectionProps) {
  const columns = getSingleScheduleColumns(t, result.baseTaxCode);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 schedule-print-table">
      <MasterTable<ScheduleTableRow>
        columns={columns}
        data={result.rows as ScheduleTableRow[]}
        getRowKey={(row) => row.srNo}
        height="sm"
        tableClassName="text-xs"
        theadClassName="text-[10px] font-extrabold uppercase tracking-widest"
        rowClassName={(row) => (row.status === "Current" ? "bg-emerald-50" : "")}
        headerTitle={t("scheduleTable.title")}
        headerExtra={
          <div className="ml-auto flex gap-2 print:hidden">
            <ExportButton label={t("actions.exportCsv")} size="sm" onClick={onExportCsv} />
            <ApplyButton label={t("actions.print")} size="sm" onClick={onPrint} />
          </div>
        }
        footerLeftContent={
          <span className="text-sm font-bold text-slate-700">
            {t("scheduleTable.totalRow")} — {isTaxTotal ? t("kpis.applicableTotalTax") : t("kpis.applicableGeneralTax")}:{" "}
            {money(result.sumApplicable)}, {t("scheduleTable.columns.totalDemand")}:{" "}
            {money(result.sumTotalDemand)}
          </span>
        }
      />
    </div>
  );
}
