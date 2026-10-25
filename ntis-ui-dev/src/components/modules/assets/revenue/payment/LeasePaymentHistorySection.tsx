import React from 'react';
import { ChevronDown, ChevronUp, Printer, Eye } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import type { LeaseRentPaymentHistoryItem, BillTransactionWithDetailsDto, LeaseRentReceiptDemandDto } from '@/types/asset/revenue/payment/leaseRentPayment.types';
import { Modal, Card, Button, MasterTable, ExpandableMasterTable, IconOnlyActionButton, type Column } from '@/components/common';
import { fmt, fmtDisplayDate } from '@/lib/utils/asset-utils/payment-utils/payment-format';
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface LeasePaymentHistorySectionProps {
  hasSearched: boolean;
  displayHistoryItems: LeaseRentPaymentHistoryItem[];
  isHistoryModalOpen: boolean;
  setIsHistoryModalOpen: (val: boolean) => void;
  expandedReceiptId: string | number | null;
  receiptDetailsCache: Record<string | number, BillTransactionWithDetailsDto>;
  isReceiptLoadingMap: Record<string | number, boolean>;
  handleToggleReceiptDetails: (transactionId: string | number) => Promise<void>;
}

interface PaymentHistoryRow extends LeaseRentPaymentHistoryItem, Record<string, unknown> { }
interface ReceiptDemandRow extends LeaseRentReceiptDemandDto, Record<string, unknown> { }

function ReceiptDetailsTable({ receiptDetails }: { receiptDetails: BillTransactionWithDetailsDto }) {
  const t = useTranslations('AssetPayment');
  const detailsList = React.useMemo(() => (receiptDetails.details || []) as ReceiptDemandRow[], [receiptDetails.details]);

  const columns: Column<ReceiptDemandRow>[] = [
    {
      key: 'period',
      label: t('v2.period'),
      align: 'center',
      render: (_, d) =>
        d.demandMonth
          ? `${MONTH_NAMES[d.demandMonth - 1]?.slice(0, 3)} ${d.demandYear || ''}`
          : d.periodName || d.period || '-',
    },
    {
      key: 'rentAmount',
      label: t('v2.rent'),
      align: 'center',
      render: (_, d) => fmt(d.monthlyRentAmount || d.rentAmount),
    },
    {
      key: 'penaltyAmount',
      label: t('v2.penalty'),
      align: 'center',
      render: (_, d) => fmt(d.penaltyAmount),
    },
    {
      key: 'gstAmount',
      label: t('v2.gst'),
      align: 'center',
      render: (_, d) => fmt(d.gstAmount),
    },
    {
      key: 'totalDemandAmount',
      label: t('v2.totalDemand'),
      align: 'center',
      render: (_, d) => <span className="font-bold">{fmt(d.totalDemandAmount || d.totalAmount)}</span>,
    },
    {
      key: 'currentPaidAmount',
      label: t('v2.paidAmount'),
      align: 'center',
      render: (_, d) => <span className="font-bold text-green-700">{fmt(d.currentPaidAmount || d.paidAmount)}</span>,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-6 px-2 text-[11px] flex-wrap">
        <div><span className="text-slate-500 font-medium mr-2">{`${t('v2.paidAmount')}:`}</span><span className="font-bold text-green-700">{`₹${fmt(receiptDetails.paidAmount)}`}</span></div>
        <div><span className="text-slate-500 font-medium mr-2">{`${t('v2.paymentMode')}:`}</span><span className="font-bold text-[#1e3a8a]">{receiptDetails.paymentMode}</span></div>
        <div><span className="text-slate-500 font-medium mr-2">{`${t('v2.receiptDate')}:`}</span><span className="font-bold text-[#1e3a8a]">{fmtDisplayDate(receiptDetails.paymentDate)}</span></div>
        {receiptDetails.paymentMode === 'Cheque' && (
          <div><span className="text-slate-500 font-medium mr-2">{`${t('v2.paymentStatus')}:`}</span><span className="font-bold text-[#1e3a8a]">{receiptDetails.paymentStatus || 'Received'}</span></div>
        )}
        {receiptDetails.paymentMode === 'DD' && receiptDetails.ddPayeeName && (
          <div><span className="text-slate-500 font-medium mr-2">{`${t('v2.ddPayeeName')}:`}</span><span className="font-bold text-[#1e3a8a]">{receiptDetails.ddPayeeName}</span></div>
        )}
      </div>
      <div className="border border-slate-300 rounded overflow-hidden">
        <MasterTable<ReceiptDemandRow>
          columns={columns}
          data={detailsList}
          getRowKey={(_, i) => i}
          isPagination={false}
          tableClassName="border-collapse text-[11px]"
          theadClassName="[&_th]:text-[11px] [&_th]:py-1.5 [&_th]:px-2 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100"
          rowClassName={() => '[&_td]:text-[11px] [&_td]:py-1.5 [&_td]:px-2 [&_td]:border [&_td]:border-slate-300'}
        />
      </div>
    </div>
  );
}

export function LeasePaymentHistorySection({
  hasSearched,
  displayHistoryItems,
  isHistoryModalOpen,
  setIsHistoryModalOpen,
  expandedReceiptId,
  receiptDetailsCache,
  isReceiptLoadingMap,
  handleToggleReceiptDetails,
}: LeasePaymentHistorySectionProps) {
  const t = useTranslations('AssetPayment');
  const params = useParams<{ locale?: string }>();
  const currentLocale = params.locale || 'en';
  const router = useRouter();


  const [modalPage, setModalPage] = React.useState<number>(1);
  const modalPageSize = 5;

  React.useEffect(() => {
    if (isHistoryModalOpen) {
      Promise.resolve().then(() => setModalPage(1));
    }
  }, [isHistoryModalOpen]);

  const modalTotalPages = Math.max(1, Math.ceil(displayHistoryItems.length / modalPageSize));
  const paginatedModalItems = displayHistoryItems.slice(
    (modalPage - 1) * modalPageSize,
    modalPage * modalPageSize
  ) as PaymentHistoryRow[];

  const previewColumns: Column<PaymentHistoryRow>[] = [
    {
      key: 'paidMonths',
      label: t('v2.paidFor'),
      align: 'center',
      render: (_, item) => (
        <span className="text-[#1E3A8A] font-semibold text-center truncate block max-w-[150px] mx-auto" title={item.paidMonths}>
          {item.paidMonths || '-'}
        </span>
      ),
    },
    {
      key: 'paymentDate',
      label: t('v2.receiptDate'),
      align: 'center',
      render: (_, item) => (
        <span className="text-[#1E3A8A] font-semibold">{fmtDisplayDate(item.paymentDate)}</span>
      ),
    },
    {
      key: 'paidAmount',
      label: `${t('v2.amount')} (₹)`,
      align: 'center',
      render: (_, item) => (
        <span className="text-emerald-600 font-bold">{fmt(item.paidAmount)}</span>
      ),
    },
    {
      key: 'paymentMode',
      label: t('v2.paymentMode'),
      align: 'center',
      render: (_, item) => (
        <span className="text-[#1E3A8A] font-semibold">{item.paymentMode}</span>
      ),
    },
    {
      key: 'transactionNo',
      label: t('v2.referenceNo'),
      align: 'center',
      render: (_, item) => (
        <span className="text-[#1E3A8A] font-semibold">{item.transactionNo || '-'}</span>
      ),
    },
    {
      key: 'id' as keyof PaymentHistoryRow,
      label: t('v2.action'),
      align: 'center',
      render: (_, item) => (
        <IconOnlyActionButton
          icon={Printer}
          variant="ghost"
          size="sm"
          onClick={() => {
            router.push(`/${currentLocale}/assets/revenue/payment/receipt?id=${item.uuid || item.id}`);
          }}
          aria-label="Print Receipt"
          title="Print Receipt"
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 rounded-md"
        />
      ),
    },
  ];



  return (
    <>
      <Card className="min-w-0 bg-white border border-slate-200 rounded-lg shadow-sm p-2.5 sm:p-3 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[16px] sm:text-[16px] font-bold text-[#1E3A8A] ml-1">
            {t('paymentHistory.title')}
          </h2>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsHistoryModalOpen(true)}
            className="text-[10.5px] sm:text-[11px] font-bold text-blue-600 hover:text-blue-800 underline underline-offset-2 mr-1 h-auto p-0 hover:bg-transparent"
          >
            {t('v2.viewAllHistory')}
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          {/* Mobile view (hidden on desktop): Clean action button to view details */}
          <div className="block sm:hidden">
            <Button
              type="button"
              variant="outline"
              icon={Eye}
              onClick={() => setIsHistoryModalOpen(true)}
              className="w-full py-2 px-3 bg-[#f0f7ff] hover:bg-blue-100 text-blue-700 text-[11px] font-bold rounded-md border border-blue-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {t('v2.viewAllHistory')}
            </Button>
          </div>

          {/* Desktop & Tablet view: Inline preview table */}
          <div className="hidden sm:block mt-1 border border-slate-300 rounded-lg overflow-hidden">
            <MasterTable<PaymentHistoryRow>
              columns={previewColumns}
              data={hasSearched ? (displayHistoryItems.slice(0, 2) as PaymentHistoryRow[]) : []}
              getRowKey={(item, i) => item.id ?? item.transactionId ?? i}
              isPagination={false}
              emptyText=""
              tableClassName="border-collapse text-[11px]"
              theadClassName="[&_th]:text-[11px] [&_th]:py-1.5 [&_th]:px-2 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100"
              rowClassName={() => '[&_td]:text-[11px] [&_td]:py-1.5 [&_td]:px-2 [&_td]:border [&_td]:border-slate-300'}
            />
          </div>
        </div>
      </Card>

      {/* Payment History Full Modal */}
      <Modal
        open={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={t('v2.paymentHistory')}
        maxWidth="xl"
      >
        <div className="p-1 max-h-[80vh] overflow-y-auto">
          <ExpandableMasterTable<PaymentHistoryRow>
            columns={[
              {
                key: 'paidMonths',
                label: t('v2.paidFor'),
                align: 'center',
                render: (_, item) => (
                  <span className="text-[#1E3A8A] font-semibold text-center truncate block max-w-[150px] mx-auto" title={item.paidMonths}>
                    {item.paidMonths || '-'}
                  </span>
                ),
              },
              {
                key: 'paymentDate',
                label: t('v2.receiptDate'),
                align: 'center',
                render: (_, item) => (
                  <span className="text-[#1E3A8A] font-semibold">{fmtDisplayDate(item.paymentDate || item.transactionDate)}</span>
                ),
              },
              {
                key: 'paidAmount',
                label: `${t('v2.amount')} (₹)`,
                align: 'center',
                render: (_, item) => (
                  <span className="text-emerald-600 font-bold">{fmt(item.paidAmount ?? item.amountPaid)}</span>
                ),
              },
              {
                key: 'paymentMode',
                label: t('v2.paymentMode'),
                align: 'center',
                render: (_, item) => (
                  <span className="text-[#1E3A8A] font-semibold">{item.paymentMode}</span>
                ),
              },
              {
                key: 'transactionNo',
                label: t('v2.referenceNo'),
                align: 'center',
                render: (_, item) => (
                  <span className="text-[#1E3A8A] font-semibold">{item.transactionNo || item.transactionRefNo || '-'}</span>
                ),
              },
              {
                key: 'id' as keyof PaymentHistoryRow,
                label: t('v2.actions'),
                align: 'center',
                render: (_, item) => {
                  const itemId = String(item.id ?? item.transactionId ?? '0');
                  const isExpanded = String(expandedReceiptId ?? '') === itemId;
                  const isLoading = isReceiptLoadingMap[itemId];

                  return (
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      <IconOnlyActionButton
                        icon={isExpanded ? ChevronUp : ChevronDown}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleReceiptDetails(itemId)}
                        disabled={isLoading}
                        isLoading={isLoading}
                        aria-label={isExpanded ? 'Hide Details' : 'View Details'}
                        title={isExpanded ? 'Hide Details' : 'View Details'}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 rounded-md"
                      />
                      <IconOnlyActionButton
                        icon={Printer}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          router.push(`/${currentLocale}/assets/revenue/payment/receipt?id=${item.uuid || item.id}`);
                        }}
                        aria-label="Print Receipt"
                        title="Print Receipt"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 rounded-md"
                      />
                    </div>
                  );
                },
              },
            ]}
            data={displayHistoryItems.length === 0 ? [] : paginatedModalItems}
            getRowKey={(item, i) => item.id ?? item.transactionId ?? i}
            isPagination={displayHistoryItems.length > modalPageSize}
            pageNumber={modalPage}
            pageSize={modalPageSize}
            totalCount={displayHistoryItems.length}
            totalPages={modalTotalPages}
            onPageChange={setModalPage}
            emptyText={t('v2.noDuesFound')}
            tableClassName="border-collapse text-[11px]"
            theadClassName="[&_th]:text-[11px] [&_th]:py-1.5 [&_th]:px-2 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100"
            rowClassName={(item) => {
              const itemId = String(item.id ?? item.transactionId ?? '0');
              const isExpanded = String(expandedReceiptId ?? '') === itemId;
              return `[&_td]:text-[11px] [&_td]:py-1.5 [&_td]:px-2 [&_td]:border [&_td]:border-slate-300 hover:bg-slate-50 transition-colors ${
                isExpanded ? 'bg-blue-50/30' : ''
              }`;
            }}
            renderExpandedRow={(item) => {
              const itemId = String(item.id ?? item.transactionId ?? '0');
              const isExpanded = String(expandedReceiptId ?? '') === itemId;
              if (!isExpanded) return null;

              const receiptDetails = receiptDetailsCache[itemId];
              return (
                <div className="p-1">
                  {receiptDetails ? (
                    <ReceiptDetailsTable receiptDetails={receiptDetails} />
                  ) : (
                    <div className="text-center py-4 text-slate-500">{t('v2.searchingDatabase')}</div>
                  )}
                </div>
              );
            }}
          />
        </div>
      </Modal>
    </>
  );
}
