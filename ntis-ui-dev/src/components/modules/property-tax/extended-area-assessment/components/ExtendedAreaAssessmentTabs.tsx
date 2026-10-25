"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Calculator, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

interface ExtendedAreaAssessmentTabsProps {
  activeTab: "single" | "bulk";
}

export function ExtendedAreaAssessmentTabs({ activeTab }: ExtendedAreaAssessmentTabsProps) {
  const locale = useLocale();
  const tLanding = useTranslations("extendedAreaAssessment.landing");

  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/80 shadow-inner">
      <Link
        href={`/${locale}/property-tax/extended-area-assesment/single-assessment`}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-200 select-none",
          activeTab === "single"
            ? "bg-white text-blue-700 shadow-sm border border-slate-200/80"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
        )}
      >
        <Calculator className={cn("h-4 w-4", activeTab === "single" ? "text-blue-600" : "text-slate-500")} />
        <span>{tLanding("singleTitle")}</span>
      </Link>
      <Link
        href={`/${locale}/property-tax/extended-area-assesment/bulk-update`}
        onClick={() =>
          toast.warning(
            tLanding("bulkUnderDevelopment") ?? "This screen is not completed yet — it is under development."
          )
        }
        className={cn(
          "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-200 select-none",
          activeTab === "bulk"
            ? "bg-white text-blue-700 shadow-sm border border-slate-200/80"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
        )}
      >
        <ListChecks className={cn("h-4 w-4", activeTab === "bulk" ? "text-blue-600" : "text-slate-500")} />
        <span>{tLanding("bulkTitle")}</span>
      </Link>
    </div>
  );
}
