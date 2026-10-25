"use client";

import React from "react";
import { ListChecks, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { AliasMasterCounts } from "@/types/alias-master.types";

interface AliasMasterStatsCardsProps {
  counts: AliasMasterCounts;
  t: (key: string) => string;
}

export const AliasMasterStatsCards = React.memo(function AliasMasterStatsCards({ counts, t }: AliasMasterStatsCardsProps) {
  const stats = [
    {
      label: t("stats.total"),
      value: counts.totalCount,
      icon: ListChecks,
      borderColor: "border-blue-100",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: t("stats.active"),
      value: counts.activeCount,
      icon: CheckCircle2,
      borderColor: "border-emerald-100",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: t("stats.inactive"),
      value: counts.inactiveCount,
      icon: XCircle,
      borderColor: "border-rose-100",
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={cn(
              "flex items-center gap-3 rounded-xl border bg-white px-3 py-2 shadow-sm transition-shadow duration-200 hover:shadow-md",
              stat.borderColor
            )}
          >
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", stat.iconBg, stat.iconColor)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
              <p className="text-xl font-bold leading-tight text-slate-900">{stat.value.toLocaleString()}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
});
