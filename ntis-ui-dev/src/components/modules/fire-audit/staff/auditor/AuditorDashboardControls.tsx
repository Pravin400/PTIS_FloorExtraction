"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { Button } from "@/components/common";
import { cn } from "@/lib/utils/cn";
import { AuditorFiltersBar } from "./AuditorFiltersBar";
import { useAuditorFilters } from "@/hooks/fire-audit/auditor";
import type {
  AuditorApplication,
  AuditorDashboardFilters,
  AuditorDashboardStats,
} from "@/types/fire-audit/auditor.types";
import type { AuditorFilterLookupData } from "@/types/fire-audit/catalog.types";

export interface AuditorDashboardControlsProps {
  filters?: AuditorDashboardFilters;
  stats: AuditorDashboardStats;
  todayCount: number;
  applications?: AuditorApplication[];
  lookups?: AuditorFilterLookupData;
  className?: string;
}

export function AuditorDashboardControls({
  filters = {},
  stats,
  todayCount,
  applications = [],
  lookups,
  className,
}: AuditorDashboardControlsProps) {

  const t = useTranslations("fireAudit.auditorDashboard");
  const tTable = useTranslations("fireAudit.auditorDashboard.table");

  const {
    isPending,
    updateUrlFilters,
    handleResetFilters,
  } = useAuditorFilters(filters);

  const isTodayActive = filters.dateFilter === "today";

  const handleExport = useCallback(() => {
    if (!applications || applications.length === 0) return;

    const headers = [
      "Application No",
      "Application Date",
      "Application Type",
      "Building Name",
      "Applicant",
      "Mobile",
      "Email",
      "Node",
      "Sector",
      "Ward No",
      "Building Type",
      "Risk Category",
      "Status",
      "Deficiencies Count",
    ];

    const escapeCsv = (val?: string | number | null) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = applications.map((app) => [
      escapeCsv(app.id),
      escapeCsv(app.appDate),
      escapeCsv(app.appType),
      escapeCsv(app.buildingName),
      escapeCsv(app.applicant),
      escapeCsv(app.mobile),
      escapeCsv(app.email),
      escapeCsv(app.node),
      escapeCsv(app.sector),
      escapeCsv(app.wardNo),
      escapeCsv(app.buildingType),
      escapeCsv(app.riskCategory),
      escapeCsv(app.status),
      app.deficienciesCount ?? 0,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `auditor_applications_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [applications]);

  return (
    <div className={cn("flex flex-col gap-2.5 sm:gap-3", className)}>
      {/* Top Toolbar Row: Quick Filter Tabs (Left) + Export Button (Right) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Quick Filter Tabs: All Applications vs Today's Applications */}
        <div role="tablist" aria-label={t("title")} className="flex items-center gap-2">
          {(
            [
              {
                id: "all" as const,
                label: t("allApplicationsTab", { count: stats.total }),
                isActive: !isTodayActive,
                onClick: () =>
                  updateUrlFilters({ ...filters, dateFilter: undefined, page: 1 }),
              },
              {
                id: "today" as const,
                label: t("todaysApplicationsTab", { count: todayCount }),
                isActive: isTodayActive,
                onClick: () =>
                  updateUrlFilters({ ...filters, dateFilter: "today", page: 1 }),
              },
            ] as const
          ).map((tab) => (
            <Button
              key={tab.id}
              role="tab"
              aria-selected={tab.isActive}
              variant={tab.isActive ? "primary" : "outline"}
              size="xs"
              onClick={tab.onClick}
              className={cn(
                "rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs h-auto",
                tab.isActive
                  ? "!bg-[#153746] hover:!bg-[#0f2834] !text-white !border-transparent shadow-2xs"
                  : "!bg-white !text-slate-600 hover:!bg-slate-50 !border !border-slate-200 shadow-2xs"
              )}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Right Action Tools: Export Button */}
        <div className="flex items-center gap-2">
          {/* Export Button */}
          <Button
            variant="outline"
            size="xs"
            icon={Download}
            onClick={handleExport}
            disabled={isPending || applications.length === 0}
            className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs h-8 px-3 cursor-pointer"
          >
            {tTable("btnExport")}
          </Button>
        </div>
      </div>

      {/* Search & Advanced Filters Bar */}
      <AuditorFiltersBar
        key={`${filters.searchTerm ?? ""}|${filters.status ?? ""}|${filters.appType ?? ""}|${filters.buildingType ?? ""}|${filters.node ?? ""}|${filters.sector ?? ""}|${filters.wardNo ?? ""}|${filters.dateFilter ?? ""}|${filters.riskCategory ?? ""}|${filters.pageSize ?? 10}`}
        filters={filters}
        onApplyFilters={updateUrlFilters}
        onResetFilters={handleResetFilters}
        lookups={lookups}
      />
    </div>
  );
}

