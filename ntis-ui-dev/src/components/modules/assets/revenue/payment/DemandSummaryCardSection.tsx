import { useTranslations } from 'next-intl';
import type { LeaseRentPaymentDetail } from '@/types/asset/revenue/payment/leaseRentPayment.types';
import { fmt } from '@/lib/utils/asset-utils/payment-utils/payment-format';
import { Card } from '@/components/common';

interface DemandSummaryCardSectionProps {
  hasSearched: boolean;
  totalOutstanding: number;
  overdueAmount: number;
  currentDueAmount: number;
  record: LeaseRentPaymentDetail;
  totalSettleAmount: number;
}

function OutstandingCol({
  label, value, className,
}: {
  label: string; value: string; className?: string;
}) {
  return (
    <div className="relative px-1.5 py-2.5 sm:py-4 text-center flex flex-col items-center justify-center">
      <p className="text-[11.5px] sm:text-[12px] text-[#1e3a8a] mb-1 font-bold leading-tight">{label}</p>
      <p className={`text-[15px] sm:text-[18px] font-bold leading-none tracking-tight ${className ?? 'text-[#1e3a8a]'}`}>{value}</p>
    </div>
  );
}

export function DemandSummaryCardSection({
  hasSearched,
  totalOutstanding,
  overdueAmount,
  currentDueAmount,
  record,
  totalSettleAmount,
}: DemandSummaryCardSectionProps) {
  const t = useTranslations('AssetPayment');

  return (
    <Card className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col p-0">
      {/* Header */}
      <div className="bg-[#0E1773] px-3 sm:px-4 py-2 sm:py-2.5">
        <h2 className="text-[16px] sm:text-[16px] font-bold text-white">{t('v2.demandSummary')}</h2>
      </div>

      {/* 4 columns (2x2 on mobile, 4x1 on tablet/desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-white px-2 pt-2">
        <OutstandingCol
          label={`${t('v2.totalOpeningDemand')} (₹)`}
          value={hasSearched ? fmt(totalOutstanding) : '0.00'}
          className="text-[#1e3a8a]"
        />
        <OutstandingCol
          label={`${t('v2.arrears')} (₹)`}
          value={hasSearched ? fmt(overdueAmount) : '0.00'}
          className="text-[#dc2626]"
        />
        <OutstandingCol
          label={`${t('v2.current')} (₹)`}
          value={hasSearched ? fmt(currentDueAmount) : '0.00'}
          className="text-[#1e3a8a]"
        />
        <OutstandingCol
          label={`${t('v2.availAdvance')} (₹)`}
          value={hasSearched ? fmt(record.advanceBalance || 0) : '0.00'}
          className="text-emerald-600"
        />
      </div>

      {/* Payable Now row */}
      <div className="p-3 sm:p-4 pt-1 bg-white">
        <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-[#f0f7ff] border border-blue-100 rounded-lg">
          <span className="text-[15px] sm:text-[18px] lg:text-[20px] font-bold text-blue-700">{`${t('v2.payableNow')} (₹)`}</span>
          <span className="text-[15px] sm:text-[18px] lg:text-[20px] font-bold text-blue-700 leading-none tracking-tight">
            {hasSearched ? fmt(totalSettleAmount) : '0.00'}
          </span>
        </div>
      </div>
    </Card>
  );
}
