import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Drawer, MasterTable, Column } from '@/components/common';
import { History } from 'lucide-react';
import { CollectionHistoryKpi } from './CollectionHistoryKpi';
import type { CollectionHistoryDrawerProps } from '@/types/asset/municipal-Asset/sub-asset-detail-ui.types';
import type { HistoryItem } from '@/types/asset/municipal-Asset/sub-asset-detail-api.types';

export function CollectionHistoryDrawer({ open, onClose, data, totals, loading, rentFrequency }: CollectionHistoryDrawerProps) {
  const t = useTranslations('subAssetDetail');

  // Local pagination state
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedData = useMemo(() => {
    const startIndex = (pageNumber - 1) * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  }, [data, pageNumber, pageSize]);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  const isYearly = rentFrequency?.toLowerCase() === 'yearly' || rentFrequency?.toLowerCase() === 'annual' || rentFrequency?.toLowerCase() === 'annually';
  const currentYear = data?.[0]?.month ? ` ${data[0].month}` : '';
  
  const titleText = isYearly
    ? `${t('collectionHistoryTitle') || 'Payment / Collection History - Financial Year'}${currentYear}`
    : (t('collectionHistoryTitleMonthly') || 'Payment / Collection History (Last 12 Months)');

  const title = (
    <div className="flex items-center gap-2">
      <div className="bg-blue-600 rounded p-1.5 flex items-center justify-center">
        <History className="w-4 h-4 text-white" />
      </div>
      <h2 className="text-[15px] font-bold text-blue-700">{titleText}</h2>
    </div>
  );

  const columns: Column<HistoryItem>[] = [
    { key: 'month', label: isYearly ? (t('colFinancialYear') || 'FINANCIAL YEAR') : (t('colMonth') || 'MONTH') },
    { key: 'demand', label: t('colDemand') || 'DEMAND (₹)' },
    { key: 'collection', label: t('colCollection') || 'COLLECTION (₹)' },
    { key: 'adjustment', label: t('colAdjustment') || 'ADJUSTMENT (₹)', render: (val) => (val !== undefined && val !== null) ? String(val) : '-' },
    { key: 'receiptNo', label: t('colReceiptNo') || 'RECEIPT NO.' },
    { key: 'transactionDate', label: t('colTransactionDate') || 'TRANSACTION DATE' },
    { key: 'mode', label: t('colMode') || 'MODE' },
    {
      key: 'status',
      label: t('colStatus') || 'STATUS',
      render: (val) => {
        const statusStr = String(val).toLowerCase();
        let bgClass = "bg-slate-100 text-slate-700";
        if (statusStr === 'success' || statusStr === 'completed') {
          bgClass = "bg-green-100 text-green-700";
        } else if (statusStr === 'failed' || statusStr === 'error') {
          bgClass = "bg-red-100 text-red-700";
        } else if (statusStr === 'pending') {
          bgClass = "bg-amber-100 text-amber-700";
        }
        return (
          <span className={`inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[11px] font-bold ${bgClass}`}>
            {String(val)}
          </span>
        );
      }
    },
  ];

  return (
    <Drawer open={open} onClose={onClose} title={title} width="lg">
      <div className="p-4 space-y-4 bg-slate-50 min-h-full">
        {/* KPI Cards */}
        <CollectionHistoryKpi totals={totals} rentFrequency={rentFrequency} />

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <MasterTable
            data={paginatedData}
            columns={columns}
            loading={loading}
            pageNumber={pageNumber}
            pageSize={pageSize}
            totalCount={data.length}
            totalPages={totalPages}
            onPageChange={setPageNumber}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPageNumber(1);
            }}
            paginationConfig={{ enabled: true, showPageSizeSelector: true }}
            pageSizeOptions={[5, 10, 20]}
            theadClassName="[&_th]:bg-[#002D62] [&_th]:!text-white [&_th]:!font-bold [&_th]:whitespace-nowrap [&_th]:!px-3 [&_th]:!py-2 [&_th]:!text-[10px] [&_th]:!text-center"
            rowClassName={() => "[&_td]:!px-3 [&_td]:!py-2 [&_td]:!text-[11px] [&_td]:!text-center"}
          />
        </div>
      </div>
    </Drawer>
  );
}
