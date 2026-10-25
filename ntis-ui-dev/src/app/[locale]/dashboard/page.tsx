import { getDashboardData } from './actions';
import { getTranslations } from 'next-intl/server';
import { Card, CardHeader, CardTitle, CardContent, LanguageDropdown } from '@/components/common';
import { AddRouteButton } from '@/components/modules/dashboard/AddRouteButton';
import { DashboardTable } from '@/components/modules/dashboard/DashboardTable';

/**
 * Dashboard Page - Server Component with Full SSR
 * Fetches data and translations server-side for optimal performance and SEO
 */

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;

  // Server-side data fetching
  const dashboardData = await getDashboardData();

  // Server-side translations (SSR) - must pass locale explicitly
  const tDashboard = await getTranslations({ locale, namespace: 'dashboard' });

  // Pre-calculate stats on server
  const stats = {
    totalRoutes: dashboardData.length,
    activeVehicles: dashboardData.reduce((sum, item) => sum + item.vehicles, 0),
    activeRoutes: dashboardData.filter((item) => item.status === 'Active').length,
    delayedRoutes: dashboardData.filter((item) => item.status === 'Delayed').length,
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{tDashboard('title')}</h1>
            <p className="text-gray-600 mt-2">{tDashboard('subtitle')}</p>
          </div>
          <div className="flex gap-3">
            <LanguageDropdown />
            <AddRouteButton />
          </div>
        </div>

        {/* Stats Cards - SSR with translations */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card variant="elevated" padding="md">
            <div className="text-sm text-gray-600">{tDashboard('stats.totalRoutes')}</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalRoutes}</div>
          </Card>
          <Card variant="elevated" padding="md">
            <div className="text-sm text-gray-600">{tDashboard('stats.activeVehicles')}</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.activeVehicles}</div>
          </Card>
          <Card variant="elevated" padding="md">
            <div className="text-sm text-gray-600">{tDashboard('stats.activeRoutes')}</div>
            <div className="text-3xl font-bold text-green-600 mt-2">{stats.activeRoutes}</div>
          </Card>
          <Card variant="elevated" padding="md">
            <div className="text-sm text-gray-600">{tDashboard('stats.delayed')}</div>
            <div className="text-3xl font-bold text-yellow-600 mt-2">{stats.delayedRoutes}</div>
          </Card>
        </div>

        {/* Data Table */}
        <Card variant="bordered" padding="none">
          <CardHeader className="px-6 pt-6">
            <CardTitle>{tDashboard('table.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardTable data={dashboardData} />
          </CardContent>
        </Card>
      </div>
  );
}
