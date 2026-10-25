import { useTranslations } from 'next-intl';
import { Tooltip, Card, MasterTable, Checkbox, type Column } from '@/components/common';
import { CardPagination } from '@/components/common/CardList';
import type { LeaseRentDemandItem } from '@/types/asset/revenue/payment/leaseRentPayment.types';
import { fmt, fmtDisplayDate, parseMonthRange } from '@/lib/utils/asset-utils/payment-utils/payment-format';

interface PendingDuesSectionProps {
  hasSearched: boolean;
  totalOutstanding: number;
  demandsLoading: boolean;
  demands: LeaseRentDemandItem[];
  rawDemands: LeaseRentDemandItem[];
  selectedIds: Set<string>;
  allSelected: boolean;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (size: number) => void;
  toggleRow: (id: string, pendingAmt: number) => void;
  toggleAll: () => void;
  paymentFrequency?: string | null;
}

export function PendingDuesSection({
  hasSearched,
  totalOutstanding,
  demandsLoading,
  demands,
  rawDemands,
  selectedIds,
  allSelected,
  currentPage,
  itemsPerPage,
  totalPages,
  setCurrentPage,
  setItemsPerPage,
  toggleRow,
  toggleAll,
  paymentFrequency,
}: PendingDuesSectionProps) {
  const t = useTranslations('AssetPayment');

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'checkbox' as keyof LeaseRentDemandItem,
      label: (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleAll}
            className="w-4 h-4 cursor-pointer"
            title="Select All"
          />
        </div>
      ),
      width: '40px',
      align: 'center',
      render: (_, row) => {
        const id = String(row.id ?? row.month);
        const isChecked = selectedIds.has(id);
        const pending = Number(row.pendingAmount ?? row.total ?? 0);
        return (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={isChecked}
              onCheckedChange={() => toggleRow(id, pending)}
              className="w-4 h-4 cursor-pointer"
            />
          </div>
        );
      },
    },
    {
      key: 'srNo' as keyof LeaseRentDemandItem,
      label: t('v2.srNo'),
      width: '50px',
      align: 'center',
      render: (_, __, idx) => (
        <span className="font-bold text-[#1e3a8a]">{(currentPage - 1) * itemsPerPage + idx + 1}</span>
      ),
    },
    {
      key: 'fromDate' as keyof LeaseRentDemandItem,
      label: t('v2.fromDate'),
      align: 'center',
      render: (_, row) => {
        const { from } = parseMonthRange(String(row.month));
        return <span className="font-bold text-[#1e3a8a] whitespace-nowrap">{from}</span>;
      },
    },
    {
      key: 'toDate' as keyof LeaseRentDemandItem,
      label: t('v2.toDate'),
      align: 'center',
      render: (_, row) => {
        const { to } = parseMonthRange(String(row.month));
        return <span className="font-bold text-[#1e3a8a] whitespace-nowrap">{to}</span>;
      },
    },
    {
      key: 'month' as keyof LeaseRentDemandItem,
      label: t('v2.month'),
      align: 'center',
      render: (_, row) => {
        const { period } = parseMonthRange(String(row.month));
        return <span className="font-bold text-[#1e3a8a] whitespace-nowrap">{period}</span>;
      },
    },
    {
      key: 'description' as keyof LeaseRentDemandItem,
      label: t('v2.description'),
      align: 'center',
      render: (_, row) => {
        const rentDescription = (row.description as string) || (row.rentDescription as string) || (paymentFrequency ? `${paymentFrequency} Rent` : 'Rent');
        return <span className="font-bold text-[#1e3a8a] whitespace-nowrap">{rentDescription}</span>;
      },
    },
    {
      key: 'dueDate' as keyof LeaseRentDemandItem,
      label: t('v2.dueDate'),
      align: 'center',
      render: (_, record) => {
        const row = record as unknown as LeaseRentDemandItem;
        return (
          <span className={`font-bold whitespace-nowrap ${row.isOverdue ? 'text-red-500' : 'text-[#1e3a8a]'}`}>
            {row.dueDate ? fmtDisplayDate(String(row.dueDate)) : '-'}
          </span>
        );
      },
    },
    {
      key: 'rent' as keyof LeaseRentDemandItem,
      label: `${t('v2.rent')} (₹)`,
      align: 'center',
      render: (_, record) => {
        const row = record as unknown as LeaseRentDemandItem;
        return <span className="font-bold text-[#1e3a8a] whitespace-nowrap">{fmt(Number(row.rent ?? 0))}</span>;
      },
    },
    {
      key: 'penalty' as keyof LeaseRentDemandItem,
      label: `${t('v2.penalty')} (₹)`,
      align: 'center',
      render: (_, record) => {
        const row = record as unknown as LeaseRentDemandItem;
        return <span className="font-bold text-[#1e3a8a] whitespace-nowrap">{fmt(Number(row.penalty ?? 0))}</span>;
      },
    },
    {
      key: 'gst' as keyof LeaseRentDemandItem,
      label: `${t('v2.gst')} (₹)`,
      align: 'center',
      render: (_, record) => {
        const row = record as unknown as LeaseRentDemandItem;
        return (
          <span className="font-bold text-[#1e3a8a] whitespace-nowrap">
            {fmt(Number(row.gst ?? 0))}
            {row.gstRate ? <span className="text-[9px] text-slate-500 ml-1">({String(row.gstRate)}%)</span> : null}
          </span>
        );
      },
    },
    {
      key: 'total' as keyof LeaseRentDemandItem,
      label: (
        <Tooltip content="Example: Rent(100) + Penalty(10) + GST(18) = 128" placement="top">
          <span>{t('v2.totalDemand')}</span>
        </Tooltip>
      ),
      align: 'center',
      render: (_, record) => {
        const row = record as unknown as LeaseRentDemandItem;
        return <span className="font-bold text-[#1e3a8a] whitespace-nowrap">{fmt(Number(row.total ?? 0))}</span>;
      },
    },
    {
      key: 'paidAmount' as keyof LeaseRentDemandItem,
      label: t('v2.paidAmount'),
      align: 'center',
      render: (_, record) => {
        const row = record as unknown as LeaseRentDemandItem;
        return <span className="font-bold text-emerald-600 whitespace-nowrap">{fmt(Number(row.paidAmount ?? 0))}</span>;
      },
    },
    {
      key: 'pendingAmount' as keyof LeaseRentDemandItem,
      label: t('v2.balancePending'),
      align: 'center',
      render: (_, record) => {
        const row = record as unknown as LeaseRentDemandItem;
        return <span className="font-bold text-red-600 whitespace-nowrap">{fmt(Number(row.pendingAmount ?? row.total ?? 0))}</span>;
      },
    },
  ];

  return (
    <Card className="bg-white border border-slate-200 rounded-lg shadow-sm p-2.5 sm:p-3">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-[16px] sm:text-[16px] font-bold text-[#1E3A8A] ml-1">{t('v2.pendingDues')}</h2>
        <div className="flex items-center gap-2 sm:gap-3 text-[10.5px] sm:text-[11px]">
          <div className="flex items-center border border-slate-200 rounded-md overflow-hidden h-7">
            <span className="bg-slate-50 px-2 sm:px-3 h-full flex items-center text-[#1e3a8a] font-medium border-r border-slate-200 text-[10px] sm:text-[11px]">
              {`${t('v2.totalOpeningDemand')} (₹)`}
            </span>
            <span className="px-2 sm:px-3 h-full flex items-center text-red-600 text-[11px] sm:text-[12px] font-bold bg-white">
              {hasSearched ? fmt(totalOutstanding) : '0.00'}
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-300 rounded-lg custom-scrollbar">
        <MasterTable
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          data={(hasSearched ? demands : []) as unknown as Record<string, unknown>[]}
          loading={demandsLoading}
          loadingText="Loading dues..."
          emptyText={t('v2.noDuesFound')}
          isPagination={false}
          tableClassName="border-collapse text-[11px]"
          theadClassName="[&_th]:text-[11px] [&_th]:py-1.5 [&_th]:px-2 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100"
          rowClassName={(row) => {
            const item = row as unknown as LeaseRentDemandItem;
            const id = String(item.id ?? item.month);
            return `[&_td]:text-[11px] [&_td]:py-1.5 [&_td]:px-2 [&_td]:border [&_td]:border-slate-300 ${selectedIds.has(id) ? 'bg-blue-50/50' : ''}`;
          }}
          getRowKey={(row) => String((row as unknown as LeaseRentDemandItem).id ?? (row as unknown as LeaseRentDemandItem).month)}
        />

      </div>

      {/* Footer Pagination */}
      <div>
        <CardPagination
          pageNumber={currentPage}
          pageSize={itemsPerPage}
          totalCount={rawDemands.length}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setItemsPerPage(size);
            setCurrentPage(1);
          }}
          pageSizeOptions={[4, 10, 20]}
          className="border-none shadow-none bg-white rounded-none py-1 px-1 [&_.text-sm]:text-[11px] [&_select]:text-[11px] [&_select]:py-0 [&_select]:px-1.5 [&_select]:h-6 [&_button]:h-6 [&_button]:min-w-[24px] [&_button]:w-auto [&_button]:px-1.5 [&_button]:text-[11px] [&_svg]:w-3.5 [&_svg]:h-3.5"
        />
      </div>
    </Card>
  );
}
