import { useTranslations } from 'next-intl';
import type { DemandSimulationResult } from '@/types/asset/revenue/payment/leaseRentPayment.types';
import { fmt } from '@/lib/utils/asset-utils/payment-utils/payment-format';
import { Card, MasterTable, type Column } from '@/components/common';

interface DemandCollectionSummarySectionProps {
  hasSearched: boolean;
  demandSummary?: DemandSimulationResult | null;
}

interface SummaryRow extends Record<string, unknown> {
  id: string;
  period: string;
  demand: string;
  paid: string;
  due: string;
  isTotal?: boolean;
}

export function DemandCollectionSummarySection({
  hasSearched,
  demandSummary,
}: DemandCollectionSummarySectionProps) {
  const t = useTranslations('AssetPayment');

  const tableData: SummaryRow[] = [
    {
      id: 'pending',
      period: t('makePayment.pendingTitle'),
      demand: hasSearched ? fmt(demandSummary?.pendingDemand) : '0.00',
      paid: hasSearched ? fmt(demandSummary?.pendingPaid) : '0.00',
      due: hasSearched ? fmt(demandSummary?.pendingOutstanding) : '0.00',
    },
    {
      id: 'current',
      period: t('makePayment.currentTitle'),
      demand: hasSearched ? fmt(demandSummary?.currentDemand) : '0.00',
      paid: hasSearched ? fmt(demandSummary?.currentPaid) : '0.00',
      due: hasSearched ? fmt(demandSummary?.currentPending) : '0.00',
    },
    {
      id: 'total',
      period: t('makePayment.total'),
      demand: hasSearched ? fmt((demandSummary?.pendingDemand || 0) + (demandSummary?.currentDemand || 0)) : '0.00',
      paid: hasSearched ? fmt((demandSummary?.pendingPaid || 0) + (demandSummary?.currentPaid || 0)) : '0.00',
      due: hasSearched ? fmt((demandSummary?.pendingOutstanding || 0) + (demandSummary?.currentPending || 0)) : '0.00',
      isTotal: true,
    },
  ];

  const columns: Column<SummaryRow>[] = [
    {
      key: 'period',
      label: t('v2.period'),
      align: 'left',
      cellClassName: 'font-bold text-[#1e3a8a]',
    },
    {
      key: 'demand',
      label: `${t('makePayment.demand')} (D)`,
      align: 'right',
      cellClassName: 'font-bold text-[#1e3a8a]',
    },
    {
      key: 'paid',
      label: `${t('makePayment.paid')} (C)`,
      align: 'right',
      cellClassName: 'font-bold text-emerald-600',
    },
    {
      key: 'due',
      label: `${t('makePayment.due')} (B)`,
      align: 'right',
      cellClassName: 'font-bold text-red-600',
    },
  ];

  return (
    <Card className="min-w-0 bg-white border border-slate-200 rounded-lg shadow-sm p-2.5 sm:p-3">
      <div className="flex items-center justify-start gap-3 mb-2">
        <h2 className="text-[16px] sm:text-[16px] font-bold text-[#1E3A8A] ml-1">{t('v2.demandCollectionSummary')}</h2>
      </div>
      <div className="border border-slate-300 rounded-lg overflow-hidden">
        <MasterTable<SummaryRow>
          columns={columns}
          data={tableData}
          getRowKey={(row) => row.id}
          tableClassName="border-collapse text-[11px]"
          theadClassName="[&_th]:text-[11px] [&_th]:py-1.5 [&_th]:px-2 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100"
          rowClassName={(row) => `[&_td]:text-[11px] [&_td]:py-1.5 [&_td]:px-2 [&_td]:border [&_td]:border-slate-300 ${row.isTotal ? 'bg-slate-50/80 font-bold' : ''}`}
          isPagination={false}
        />
      </div>
    </Card>
  );
}
