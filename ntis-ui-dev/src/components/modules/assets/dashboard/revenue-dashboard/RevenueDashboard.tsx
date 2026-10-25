'use client';

import {
  Building2,
  IndianRupee,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  Card,
  CardContent,
} from '@/components/common/Card';
import { DashboardLayout } from '../DashboardLayout';
import { RevenueFilters } from './RevenueFilters';
import ZoneWiseDemandCollection from './ZoneWiseDemandCollection';
import MonthlyRevenueTrendScreen from './MonthlyRevenueTrend';
import {
  RevenueCategorySection,
  RevenueSummaryCard,
} from './RevenueDashboardCards';
import { iconForCategory, createCurrencyTWrapper } from '@/lib/utils/asset-utils/revenue-dashboard-helpers';
import { useRevenueUrlFilters } from '@/hooks/assets/dashboard/revenue-dashboard/useRevenueUrlFilters';
import {
  formatIndianCurrencyAbbreviated,
} from '@/lib/utils/asset-utils/currency-format';

import type { RevenueAssetDashboardProps } from '@/types/assets/dashboard/revenue-dashboard/revenue-dashboard.types';

export function RevenueAssetDashboard({ data, copy }: RevenueAssetDashboardProps) {
  const router = useRouter();
  const { setParams } = useRevenueUrlFilters();

  const tWrapper = createCurrencyTWrapper(copy);

  if (!data) {
    return (
      <DashboardLayout>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-10 text-center text-sm font-medium text-red-700">
            {copy.errors.loadFailed}
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const { overview, zones, wards, selectedZoneId, selectedWardId } = data;
  const { summary } = overview;

  const categoryLabels = copy.cards;

  const openCategory = (categoryId: number) => {
    const params = new URLSearchParams({ category: String(categoryId) });
    if (selectedZoneId != null) params.set('zoneId', String(selectedZoneId));
    if (selectedWardId != null) params.set('wardId', String(selectedWardId));
    router.push(`revenue-dashboard/revenue-records?${params.toString()}`);
  };

  return (
    <DashboardLayout
      filters={
        <RevenueFilters
          zones={zones}
          wards={wards}
          selectedZoneId={selectedZoneId}
          selectedWardId={selectedWardId}
          onZoneChange={(zoneId) => setParams({ zoneId, wardId: null })}
          onWardChange={(wardId) => setParams({ wardId })}
          filtersLabel={copy.filters.label}
          allZonesLabel={copy.filters.allZones}
          allWardsLabel={copy.filters.allWards}
        />
      }
    >
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{copy.title}</h1>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <RevenueSummaryCard
            icon={Building2}
            value={summary.totalLeasedAssets}
            title={copy.summary.leasedAssets}
            subtitle={copy.summary.leasedAssetsSub}
            className="bg-blue-50 border-blue-200 text-blue-700"
          />
          <RevenueSummaryCard
            icon={IndianRupee}
            value={formatIndianCurrencyAbbreviated(summary.totalDemand, tWrapper)}
            title={copy.summary.totalDemand}
            subtitle={copy.summary.totalDemandSub}
            className="bg-emerald-50 border-emerald-200 text-emerald-700"
          />
          <RevenueSummaryCard
            icon={TrendingUp}
            value={formatIndianCurrencyAbbreviated(summary.totalCollection, tWrapper)}
            title={copy.summary.totalCollection}
            subtitle={copy.summary.collectionRate}
            className="bg-purple-50 border-purple-200 text-purple-700"
          />
        </div>

        {/* Distribution */}
        <RevenueCategorySection
          title={copy.distribution.title}
          emptyText={copy.distribution.empty}
          items={overview.categoryDistribution}
          labels={categoryLabels}
          onOpenCategory={openCategory}
          getIcon={iconForCategory}
          tWrapper={tWrapper}
        />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="min-w-0">
            <CardContent className="p-0">
              <MonthlyRevenueTrendScreen
                data={overview.monthlyTrend}
                title={copy.trend.title}
                collectedLabel={copy.trend.collected}
                pendingLabel={copy.trend.pending}
                tWrapper={tWrapper}
              />
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardContent className="p-0">
              <ZoneWiseDemandCollection
                data={overview.zoneStats}
                title={copy.zones.title}
                totalDemandLabel={copy.zones.totalDemand}
                tWrapper={tWrapper}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
