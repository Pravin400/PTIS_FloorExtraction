/**
 * Grievance KPI Summary Cards
 * Path: src/components/modules/grievance/citizen/dashboard/GrievanceKpiCards.tsx
 *
 * Wraps the shared `@/components/common/DashboardCard` design primitive,
 * elevated with rounded-2xl glassmorphic framing, semantic status-colored accent bars,
 * squircle icons, and subtitle context matching the Civic Dashboard aesthetic.
 * Supports desktop rich cards and mobile ultra-compact floating ticker chips.
 */

import { useTranslations } from 'next-intl';
import { FileText, Clock, Activity, CheckCircle2 } from 'lucide-react';
import { DashboardCard } from '@/components/common/DashboardCard';
import type { GrievanceKpiMetrics } from '@/types/grievance/tracking.types';
import { cn } from '@/lib/utils/cn';

export interface GrievanceKpiCardsProps {
  stats?: GrievanceKpiMetrics;
  isLoading?: boolean;
  className?: string;
  variant?: 'cards' | 'ticker';
}

const DEFAULT_METRICS: GrievanceKpiMetrics = {
  total: 0,
  pending: 0,
  inProgress: 0,
  resolved: 0,
};

const BASE_WRAPPER_CLASSES = cn(
  '!rounded-2xl !py-3 !px-4 sm:!py-3.5 sm:!px-4.5 bg-white/95 backdrop-blur-md',
  '!border-slate-200/90 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
  '[&>div:first-child]:!w-1.5 [&>div:first-child]:!rounded-l-2xl',
  '[&>div:last-child]:!rounded-xl [&>div:last-child]:!h-10 [&>div:last-child]:!w-10 sm:[&>div:last-child]:!h-11 sm:[&>div:last-child]:!w-11',
  '[&_p.text-xs:first-child]:!text-[11px] [&_p.text-xs:first-child]:!font-bold [&_p.text-xs:first-child]:!tracking-wider [&_p.text-xs:first-child]:!uppercase [&_p.text-xs:first-child]:!text-slate-500',
  '[&_p.text-xl]:!text-2xl sm:[&_p.text-xl]:!text-3xl [&_p.text-xl]:!font-black [&_p.text-xl]:!tracking-tight',
  '[&_p.text-slate-500:last-child]:!text-[11px] [&_p.text-slate-500:last-child]:!text-slate-400 [&_p.text-slate-500:last-child]:!font-medium'
);

export function GrievanceKpiCards({
  stats: propStats,
  isLoading = false,
  className = '',
  variant = 'cards',
}: GrievanceKpiCardsProps) {
  const t = useTranslations('grievance');
  const stats = propStats ?? DEFAULT_METRICS;

  if (variant === 'ticker') {
    const compactItems = [
      {
        id: 'total',
        label: t('kpiTotalComplaints'),
        count: stats.total,
        color: 'text-slate-900',
        bar: 'bg-blue-600',
        border: 'hover:border-blue-300',
        icon: <FileText className="w-4 h-4 text-blue-600 shrink-0" />,
        iconBg: 'bg-blue-50 text-blue-600',
      },
      {
        id: 'pending',
        label: t('kpiPending'),
        count: stats.pending,
        color: 'text-amber-600',
        bar: 'bg-amber-500',
        border: 'hover:border-amber-300',
        icon: <Clock className="w-4 h-4 text-amber-600 shrink-0" />,
        iconBg: 'bg-amber-50 text-amber-600',
      },
      {
        id: 'inProgress',
        label: t('kpiInProgress'),
        count: stats.inProgress,
        color: 'text-sky-600',
        bar: 'bg-sky-500',
        border: 'hover:border-sky-300',
        icon: <Activity className="w-4 h-4 text-sky-600 shrink-0" />,
        iconBg: 'bg-sky-50 text-sky-600',
      },
      {
        id: 'resolved',
        label: t('kpiResolved'),
        count: stats.resolved,
        color: 'text-emerald-600',
        bar: 'bg-emerald-500',
        border: 'hover:border-emerald-300',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
        iconBg: 'bg-emerald-50 text-emerald-600',
      },
    ];

    return (
      <div
        className={cn('w-full grid grid-cols-2 gap-2', className)}
        role="region"
        aria-label={t('title')}
      >
        {compactItems.map((item) => (
          <div
            key={item.id}
            className={cn(
              'relative flex items-center justify-between px-3 py-2 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xs transition-all overflow-hidden',
              item.border
            )}
          >
            {/* Left Accent Bar */}
            <div className={cn('absolute left-0 top-0 bottom-0 w-1', item.bar)} />

            <div className="min-w-0 pl-1.5 flex-1">
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                {item.label}
              </p>
              <p className={cn('text-base sm:text-lg font-black leading-tight mt-0.5', item.color)}>
                {isLoading ? '...' : item.count.toLocaleString()}
              </p>
            </div>

            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ml-1.5', item.iconBg)}>
              {item.icon}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cardItems = [
    {
      id: 'total',
      label: t('kpiTotalComplaints'),
      value: isLoading ? '...' : stats.total.toLocaleString(),
      subLabel: t('kpiTotalSub'),
      valueColor: 'text-slate-900',
      icon: <FileText className="w-5 h-5 text-blue-600" aria-hidden="true" />,
      iconBg: 'bg-blue-50/90 text-blue-600 border border-blue-100/90',
      wrapperClass: cn(
        BASE_WRAPPER_CLASSES,
        'hover:!border-blue-300/80 [&>div:first-child]:!bg-blue-600'
      ),
    },
    {
      id: 'pending',
      label: t('kpiPending'),
      value: isLoading ? '...' : stats.pending.toLocaleString(),
      subLabel: t('kpiPendingSub'),
      valueColor: 'text-amber-600',
      icon: <Clock className="w-5 h-5 text-amber-600" aria-hidden="true" />,
      iconBg: 'bg-amber-50/90 text-amber-600 border border-amber-100/90',
      wrapperClass: cn(
        BASE_WRAPPER_CLASSES,
        'hover:!border-amber-300/80 [&>div:first-child]:!bg-amber-500'
      ),
    },
    {
      id: 'inProgress',
      label: t('kpiInProgress'),
      value: isLoading ? '...' : stats.inProgress.toLocaleString(),
      subLabel: t('kpiInProgressSub'),
      valueColor: 'text-sky-600',
      icon: <Activity className="w-5 h-5 text-sky-600" aria-hidden="true" />,
      iconBg: 'bg-sky-50/90 text-sky-600 border border-sky-100/90',
      wrapperClass: cn(
        BASE_WRAPPER_CLASSES,
        'hover:!border-sky-300/80 [&>div:first-child]:!bg-sky-500'
      ),
    },
    {
      id: 'resolved',
      label: t('kpiResolved'),
      value: isLoading ? '...' : stats.resolved.toLocaleString(),
      subLabel: t('kpiResolvedSub'),
      valueColor: 'text-emerald-600',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" aria-hidden="true" />,
      iconBg: 'bg-emerald-50/90 text-emerald-600 border border-emerald-100/90',
      wrapperClass: cn(
        BASE_WRAPPER_CLASSES,
        'hover:!border-emerald-300/80 [&>div:first-child]:!bg-emerald-500'
      ),
    },
  ];

  return (
    <div
      className={cn('w-full grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5', className)}
      role="region"
      aria-label={t('title')}
    >
      {cardItems.map((item) => (
        <DashboardCard
          key={item.id}
          label={item.label}
          value={item.value}
          subLabel={item.subLabel}
          valueColor={item.valueColor}
          icon={item.icon}
          iconBg={item.iconBg}
          className={item.wrapperClass}
        />
      ))}
    </div>
  );
}

GrievanceKpiCards.displayName = 'GrievanceKpiCards';
