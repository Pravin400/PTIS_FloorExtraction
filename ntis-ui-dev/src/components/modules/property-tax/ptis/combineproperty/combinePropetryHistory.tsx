'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Drawer } from '@/components/common/Drawer';
import { MasterTable } from '@/components/common/MasterTable';
import { PropertyCombineDetails } from '@/types/combine-property.types';
import { useMemo, useCallback } from 'react';
import { Merge } from 'lucide-react';
import { getCombinePropertyHistoryColumns } from './combinePropertyColumns';

import { PagedResponse } from '@/types/common.types';
import { usePathname, useSearchParams } from 'next/navigation';

export interface CombinePropertyHistoryProps {
  historyDetails: PagedResponse<PropertyCombineDetails>;
}

export type HistoryRow = PropertyCombineDetails & Record<string, unknown>;

export function CombinePropertyHistory({ historyDetails }: CombinePropertyHistoryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('combineProperty');

  const handlePreviewClick = useCallback((row: HistoryRow) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('detailsPropertyId', String(row.propertyId));
    params.set('detailsPage', '1');
    params.set('detailsSize', '10');
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  const historyColumns = useMemo(
    () => getCombinePropertyHistoryColumns(t as unknown as (key: string) => string, handlePreviewClick),
    [t, handlePreviewClick]
  );

  const handleTableChange = (page: number, pageSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('historyPage', String(page));
    params.set('historySize', String(pageSize));
    router.push(`${pathname}?${params.toString()}`);
  };

  const DrawerTitle = (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shrink-0 shadow-sm">
        <Merge className="w-4 h-4 text-white" />
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <h2 id="drawer-title" className="text-sm font-bold text-gray-900 leading-tight">
            {t('combinePropertyHistory') || 'Combine Property History Details'}
          </h2>
        </div>
      </div>
    </div>
  );

  return (
    <Drawer
      open={true}
      onClose={() => router.back()}
      title={DrawerTitle}
      width="xl"
      className="combine-property-history-drawer text-dark"
    >
      <div className="p-4 flex flex-col h-full bg-[#f4f7fb]">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <MasterTable<HistoryRow>
            columns={historyColumns}
            data={(historyDetails.items || []) as HistoryRow[]}
            paginationConfig={{
              enabled: true,
              showPageSizeSelector: true,
            }}
            pageNumber={historyDetails.pageNumber || 1}
            pageSize={historyDetails.pageSize || 10}
            totalCount={historyDetails.totalCount || 0}
            totalPages={historyDetails.totalPages || 0}
            onPageChange={(page) => handleTableChange(page, historyDetails.pageSize || 10)}
            onPageSizeChange={(size) => handleTableChange(historyDetails.pageNumber || 1, size)}
            height="md"
            getRowKey={(row, i) => `history-detail-${row.propertyId || 0}-${i}`}
            emptyText={t('emptyTableText') || 'No details found'}
          />
        </div>
      </div>
    </Drawer>
  );
}
