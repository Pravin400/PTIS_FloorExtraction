import { setRequestLocale } from "next-intl/server";
import { getClerkDashboardData } from "@/lib/api/fire-audit/staff";
import { ClerkDashboard } from "@/components/modules/fire-audit/staff";

export const dynamic = "force-dynamic";

interface ClerkPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    tab?: "all" | "today";
    q?: string;
    occupancy?: string;
    status?: string;
    appType?: string;
    node?: string;
    sector?: string;
    wardNo?: string;
    appDate?: string;
    riskCategory?: string;
    page?: string;
  }>;
}

export default async function ClerkQueuePage({
  params,
  searchParams,
}: ClerkPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const resolvedSearchParams = await searchParams;

  // Server-side dynamic query through API service
  const dashboardData = await getClerkDashboardData({
    tab: resolvedSearchParams.tab,
    search: resolvedSearchParams.q,
    occupancy: resolvedSearchParams.occupancy,
    statusFilter: resolvedSearchParams.status,
    appType: resolvedSearchParams.appType,
    node: resolvedSearchParams.node,
    sector: resolvedSearchParams.sector,
    wardNo: resolvedSearchParams.wardNo,
    appDate: resolvedSearchParams.appDate,
    riskCategory: resolvedSearchParams.riskCategory,
    page: resolvedSearchParams.page ? parseInt(resolvedSearchParams.page, 10) : 1,
    pageSize: 10,
  });

  return <ClerkDashboard data={dashboardData} />;
}

