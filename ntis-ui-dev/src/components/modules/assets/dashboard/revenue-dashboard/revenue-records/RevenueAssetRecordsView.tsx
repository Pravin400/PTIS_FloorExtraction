'use client';

import { useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { DashboardLayout } from '../../DashboardLayout';
import { MasterTable, Column } from '@/components/common/MasterTable';
import { useRevenueAssetRecordsView } from '@/hooks/assets/dashboard/revenue-dashboard/useRevenueAssetRecordsView';
import { formatIndianCurrencyAbbreviated } from '@/lib/utils/asset-utils/currency-format';

import {
  LeaseTypeBadge,
  RevenueRecordsSummary,
  StatusBadge,
} from './RevenueAssetRecordSections';
import { RevenueRecordsHeader } from './RevenueAssetRecordHeader';
import { RevenueCategorySidebar } from './RevenueAssetRecordSidebar';
import { createCurrencyTWrapper } from '@/lib/utils/asset-utils/revenue-dashboard-helpers';

/* -------------------------------------------------------------------------- */
/* Main view                                                                   */
/* -------------------------------------------------------------------------- */

import type {
  RevenueAssetRecordsViewProps,
  RevenueAssetTableRow,
} from '@/types/assets/dashboard/revenue-dashboard/revenue-dashboard.types';

export default function RevenueAssetRecordsView({ data, searchTerm = '', copy }: RevenueAssetRecordsViewProps) {
  const {
    router,
    setParams,
    searchInput,
    setSearchInput,
    parsedData,
    currentType,
    currentStatus,
    currentZoneId,
    currentWardId,
    submitSearch,
    startIndex,
    ALL,
  } = useRevenueAssetRecordsView(data, searchTerm, copy);
  const {
    categories, list, zones, wards, selectedCategoryId,
    totalAssets, stats, headerName
  } = parsedData || ({} as NonNullable<typeof parsedData>);

  const columns: Column<RevenueAssetTableRow>[] = useMemo(() => {
    const tWrapper = createCurrencyTWrapper(copy);

    if (!parsedData) return [];

    
    return [
      {
        key: 'srNo',
        label: copy.records.cols.srNo,
        width: '80px',
        align: 'center',
        render: (_, __, rowIndex) => startIndex + rowIndex + 1,
      },
      {
        key: 'assetNo',
        label: copy.records.cols.assetId,
        align: 'center',
        cellClassName: 'font-semibold text-blue-600',
      },
      {
        key: 'assetName',
        label: copy.records.cols.assetName,
        align: 'center',
      },
      {
        key: 'zoneName',
        label: copy.records.cols.zone,
        align: 'center',
        render: (_, row) => {
          if (row.zoneNo) return row.zoneNo;
          // Lookup using originalName from the global zones list
          const matchedZone = zones.find(z => z.originalName && z.originalName === row.zoneName);
          return matchedZone ? matchedZone.label : '-';
        }
      },
      {
        key: 'wardName',
        label: copy.records.cols.ward,
        align: 'center',
      },
      {
        key: 'leaseType',
        label: copy.records.cols.leaseType,
        align: 'center',
        render: (val) => <LeaseTypeBadge type={String(val)} label={String(val).toLowerCase() === 'lease' ? copy.cards.lease : copy.cards.rent} />,
      },
      {
        key: 'tenantName',
        label: copy.records.cols.tenant,
        align: 'center',
      },
      {
        key: 'paymentStatus',
        label: copy.records.cols.status,
        align: 'center',
        render: (val) => (
          <StatusBadge
            status={String(val)}
            paidLabel={copy.records.statusPaid}
            unpaidLabel={copy.records.statusUnpaid}
          />
        ),
      },
      {
        key: 'monthlyRent',
        label: copy.records.cols.rent,
        align: 'center',
        cellClassName: 'font-medium',
        render: (_, row) => formatIndianCurrencyAbbreviated(Number(row.monthlyRent), tWrapper),
      },
    ];
  }, [copy, startIndex, zones, parsedData]);

  if (!parsedData) {
    return (
      <DashboardLayout>
        <Card className="border-red-200 bg-red-50">
          <p className="py-10 text-center text-sm font-medium text-red-700">{copy.errors.loadFailed}</p>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-gray-50 flex flex-col lg:flex-row rounded-xl overflow-hidden">
        <RevenueCategorySidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          totalAssets={totalAssets}
          onCategoryChange={(categoryId) => setParams({ category: categoryId }, { resetPage: true })}
          onBack={() => router.push('/assets/dashboard/revenue-dashboard')}
          copy={copy}
        />

        {/* Main */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="bg-white px-6 pt-6 pb-2">
            <RevenueRecordsSummary
              total={list.totalCount}
              demand={stats.demand}
              collected={stats.collected}
              pending={stats.pending}
              copy={copy}
            />
          </div>

          <RevenueRecordsHeader
            headerName={headerName}
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            submitSearch={submitSearch}
            currentZoneId={currentZoneId}
            currentWardId={currentWardId}
            currentType={currentType}
            currentStatus={currentStatus}
            zones={zones}
            wards={wards}
            allValue={ALL}
            onSetParams={setParams}
            copy={copy}
          />

          <div className="flex-1 p-6 pt-4 overflow-auto bg-gray-50">
            {/* Table */}
            <MasterTable<RevenueAssetTableRow>
              columns={columns}
              data={list.items as RevenueAssetTableRow[]}
              pageNumber={list.pageNumber}
              pageSize={list.pageSize}
              totalCount={list.totalCount}
              totalPages={list.totalPages}
              onPageChange={(page) => setParams({ pageNumber: page })}
              paginationConfig={{ enabled: true, showPageSizeSelector: false }}
              emptyText={copy.records.empty}
            />
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}
