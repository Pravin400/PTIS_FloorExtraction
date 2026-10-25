'use client';

import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/lib/utils/cn';
import { formatIndianCurrencyAbbreviated } from '@/lib/utils/asset-utils/currency-format';
import type { 
  RevenueSummaryCardProps,
  StatusBadgeProps,
  LeaseTypeBadgeProps,
  RevenueRecordsSummaryProps
} from '@/types/assets/dashboard/revenue-dashboard/revenue-dashboard.types';
import { createCurrencyTWrapper } from '@/lib/utils/asset-utils/revenue-dashboard-helpers';



export function RevenueSummaryCard({
  title,
  value,
  variant,
}: RevenueSummaryCardProps) {
  const variants = {
    default: 'bg-blue-50 border-blue-100 text-blue-700',
    success: 'bg-green-50 border-green-100 text-green-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-700',
    warning: 'bg-orange-50 border-orange-100 text-orange-700',
  };
  const valueColor = {
    default: 'text-blue-900',
    success: 'text-green-900',
    purple: 'text-purple-900',
    warning: 'text-orange-900',
  };

  return (
    <Card variant="default" padding="sm" className={cn('border-l-4', variants[variant])}>
      <p className="mb-1 text-sm font-medium">{title}</p>
      <p className={cn('text-xl font-bold', valueColor[variant])}>{value}</p>
    </Card>
  );
}



export function StatusBadge({
  status,
  paidLabel,
  unpaidLabel,
}: StatusBadgeProps) {
  const isPaid = status?.toLowerCase() === 'paid';
  return (
    <Badge
      variant={isPaid ? 'success' : 'destructive'}
      className={cn("font-medium", isPaid ? 'text-green-800' : 'text-red-800')}
    >
      {isPaid ? paidLabel : unpaidLabel}
    </Badge>
  );
}



export function LeaseTypeBadge({ type, label }: LeaseTypeBadgeProps) {
  const isLease = type?.toLowerCase() === 'lease';
  return (
    <Badge
      variant="default"
      className={cn(
        "font-medium",
        isLease ? 'bg-purple-100 text-purple-800' : 'text-blue-800'
      )}
    >
      {label || type}
    </Badge>
  );
}



export function RevenueRecordsSummary({
  total,
  demand,
  collected,
  pending,
  copy,
}: RevenueRecordsSummaryProps) {
  const tWrapper = createCurrencyTWrapper(copy);

  return (
    <div className="mb-2 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <RevenueSummaryCard title={copy.records.total} value={total} variant="default" />
       <RevenueSummaryCard title={copy.cards.demand} value={formatIndianCurrencyAbbreviated(demand, tWrapper)} variant="success" />
      <RevenueSummaryCard title={copy.records.collected} value={formatIndianCurrencyAbbreviated(collected, tWrapper)} variant="purple" />
      <RevenueSummaryCard title={copy.records.pending} value={formatIndianCurrencyAbbreviated(pending, tWrapper)} variant="warning" />
    </div>
  );
}
