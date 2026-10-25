import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { AuditorDashboard } from "@/components/modules/fire-audit/staff/auditor";
import { getAuditorDashboardData } from "@/services/fire-audit/auditor.service";
import { getAuditorFilterLookups } from "@/services/fire-audit/catalog.service";
import { parseFiltersFromSearchParams } from "@/lib/utils/fire-audit/auditor-params";
import type { AuditorDashboardFilters } from "@/types/fire-audit/auditor.types";
import AuditorLoading from "./loading";

export const dynamic = "force-dynamic";

interface AuditorPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface AuditorDashboardServerProps {
  filters: AuditorDashboardFilters;
  locale: string;
}

async function AuditorDashboardServer({
  filters,
  locale,
}: AuditorDashboardServerProps) {
  const [initialData, lookups] = await Promise.all([
    getAuditorDashboardData(filters),
    getAuditorFilterLookups(),
  ]);

  return (
    <AuditorDashboard
      initialData={initialData}
      filters={filters}
      locale={locale}
      lookups={lookups}
    />
  );
}


export default async function AuditorQueuePage({
  params,
  searchParams,
}: AuditorPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const filters = parseFiltersFromSearchParams(sp);

  return (
    <Suspense fallback={<AuditorLoading />}>
      <AuditorDashboardServer filters={filters} locale={locale} />
    </Suspense>
  );
}

