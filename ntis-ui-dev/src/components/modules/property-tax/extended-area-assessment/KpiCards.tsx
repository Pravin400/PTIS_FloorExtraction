import { CalendarClock, IndianRupee, Wallet2 } from "lucide-react";
import type { useTranslations } from "next-intl";
import type { SingleAssessmentResult } from "@/types/extended-area-assessment.types";
import { money } from "./formatMoney";

interface KpiCardsProps {
  t: ReturnType<typeof useTranslations>;
  result: SingleAssessmentResult;
  isTaxTotal: boolean;
}

/** The 3 top-of-page stat cards: current finance year/stage, applicable tax, total demand. */
export function KpiCards({ t, result, isTaxTotal }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{t("kpis.currentFy")}</p>
            <p className="mt-0.5 truncate text-xl font-extrabold text-[#0b2545]">{result.currentFy}</p>
          </div>
        </div>
        <span className="mt-3 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
          {result.stageLabel}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 to-teal-400" />
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              {isTaxTotal ? t("kpis.applicableTotalTax") : t("kpis.applicableGeneralTax")}
            </p>
            <p className="mt-0.5 truncate text-xl font-extrabold text-[#0b2545]">{money(result.applicableGeneralTax)}</p>
          </div>
        </div>
        <span className="mt-3 inline-flex items-center rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-700">
          {t("kpis.section129a")}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-400" />
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <Wallet2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{t("kpis.totalDemand")}</p>
            <p className="mt-0.5 truncate text-xl font-extrabold text-[#0b2545]">{money(result.totalDemand)}</p>
          </div>
        </div>
        <span className="mt-3 inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
          {isTaxTotal ? t("kpis.totalTaxOnly") : t("kpis.generalTaxOnly")}
        </span>
      </div>
    </div>
  );
}
