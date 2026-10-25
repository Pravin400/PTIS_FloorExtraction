import { getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/common";
import { AuditorMetricCards } from "./AuditorMetricCards";
import { AuditorApplicationsTable } from "./AuditorApplicationsTable";
import {
  AuditorActivityProvider,
  AuditorActivityTrigger,
  AuditorActivitySidebar,
} from "./AuditorActivityDrawer";
import { AuditorDashboardControls } from "./AuditorDashboardControls";
import {
  formatDateIst,
  formatDateTimeIst,
  parseDateToIso,
} from "@/lib/utils/fire-audit/date-utils";
import {
  STATUS_META,
  type AuditorDashboardFilters,
  type AuditorDashboardResponse,
  type AuditorRecentActivityItem,
} from "@/types/fire-audit/auditor.types";
import type { AuditorFilterLookupData } from "@/types/fire-audit/catalog.types";

const EMPTY_DASHBOARD_DATA: AuditorDashboardResponse = {
  stats: {
    submitted: 0,
    pending: 0,
    returned: 0,
    reinspect: 0,
    approved: 0,
    issued: 0,
    total: 0,
  },
  applications: [],
  totalRecords: 0,
  filteredCount: 0,
};

export interface AuditorDashboardProps {
  initialData?: AuditorDashboardResponse;
  filters?: AuditorDashboardFilters;
  locale?: string;
  lookups?: AuditorFilterLookupData;
  error?: string | Error | null;
}

export async function AuditorDashboard({
  initialData = EMPTY_DASHBOARD_DATA,
  filters = {},
  locale = "en",
  lookups,
  error,
}: AuditorDashboardProps) {
  const t = await getTranslations({ locale, namespace: "fireAudit.auditorDashboard" });


  // 1. Today's applications count from backend data
  const todayCount =
    initialData.todayCount ??
    initialData.stats.today ??
    0;

  // 2. Activity Feed (derived from applications with real ISO timestamps)
  const initialActivities: AuditorRecentActivityItem[] = (
    initialData.applications || []
  )
    .slice(0, 6)
    .map((app) => ({
      id: app.id,
      title: `${STATUS_META[app.status]?.activityPrefix || "Officer Verification"} • ${app.id}`,
      building: app.buildingName,
      createdAt: app.createdAt || parseDateToIso(app.appDate) || new Date().toISOString(),
      timestamp: app.createdAt
        ? formatDateTimeIst(app.createdAt, locale)
        : app.appDate
          ? formatDateIst(app.appDate, locale)
          : "Today",
      type: "verification" as const,
      appId: app.id,
    }));

  return (
    <AuditorActivityProvider initialActivities={initialActivities}>
      <div className="flex w-full min-h-screen">
        {/* Left: Main Dashboard Content (Server-Rendered Page Container) */}
        <PageContainer className="flex-1 min-w-0 flex flex-col gap-3 sm:gap-4 px-3 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-4 pb-24 md:pb-8">
          {/* Static KPI Section Heading & Layout */}
          <section
            aria-labelledby="kpi-summary-heading"
            className="flex flex-col gap-2"
          >
            {/* Header Row: Key Operations on left, Recent Activity trigger on right */}
            <div className="flex items-center justify-between gap-2.5 sm:gap-4">
              <h2
                id="kpi-summary-heading"
                className="text-xs font-bold text-slate-700 tracking-wide"
              >
                {t("keyOperations")}
              </h2>

              {/* Interactive Activity Trigger Button & Mobile Popover */}
              <AuditorActivityTrigger />
            </div>

            {/* Static KPI Display (Server Component) */}
            <AuditorMetricCards
              stats={initialData.stats}
              activeStatus={filters.status}
            />
          </section>

          {/* Filtered Application Registry below the KPI row */}
          <section
            aria-label={t("applicationsRegistry")}
            className="flex flex-col gap-2.5 sm:gap-3"
          >

            {/* Interactive Dashboard Controls: Quick Filter Tabs, Chart Period Select, Export Button, Filters Bar */}
            <AuditorDashboardControls
              filters={filters}
              stats={initialData.stats}
              todayCount={todayCount}
              applications={initialData.applications}
              lookups={lookups}
            />


            {/* Applications Data Table (Interactive Client Component) */}
            <AuditorApplicationsTable
              applications={initialData.applications}
              page={filters.page || 1}
              pageSize={filters.pageSize || 10}
              totalCount={
                initialData.totalRecords ||
                initialData.applications?.length ||
                0
              }
              error={error}
            />
          </section>
        </PageContainer>

        {/* Right: Interactive Desktop Activity Sidebar Panel (>= lg) & Mobile Drawer (< lg) */}
        <AuditorActivitySidebar />
      </div>
    </AuditorActivityProvider>
  );
}
