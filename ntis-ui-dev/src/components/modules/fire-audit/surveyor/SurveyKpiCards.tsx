'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ClipboardList,
  Calendar,
  AlertTriangle,
  Hourglass,
  RotateCw,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import { Button, Card } from '@/components/common';
import { cn } from '@/lib/utils/cn';
import type { SurveyKpiCounts } from '@/types/fire-audit';

export type { SurveyKpiCounts };

interface SurveyKpiCardsProps {
  counts?: SurveyKpiCounts;
}

interface KpiCardConfig {
  key: keyof SurveyKpiCounts;
  labelKey: 'assigned' | 'dueToday' | 'overdue' | 'pending' | 'reInspection' | 'completed';
  statusParam: string;
  icon: LucideIcon;
  surfaceClass: string;
  borderClass: string;
  labelClass: string;
  iconGradient: string;
  shadowClass: string;
}

const KPI_CONFIGS: KpiCardConfig[] = [
  {
    key: 'assigned',
    labelKey: 'assigned',
    statusParam: 'assigned',
    icon: ClipboardList,
    surfaceClass: 'bg-linear-to-br! from-blue-50 to-blue-200',
    borderClass: 'border-blue-300',
    labelClass: 'text-blue-950',
    iconGradient: 'bg-linear-to-tr from-blue-600 to-blue-400 shadow-[0_3px_8px_rgba(37,99,235,0.35)]',
    shadowClass: 'shadow-[4px_4px_12px_rgba(37,99,235,0.16),-2px_-2px_8px_rgba(255,255,255,0.95),inset_0_1.5px_2px_rgba(255,255,255,1)]',
  },
  {
    key: 'pending',
    labelKey: 'pending',
    statusParam: 'pending',
    icon: Hourglass,
    surfaceClass: 'bg-linear-to-br! from-amber-50 to-amber-200',
    borderClass: 'border-amber-300',
    labelClass: 'text-amber-950',
    iconGradient: 'bg-linear-to-tr from-amber-600 to-amber-400 shadow-[0_3px_8px_rgba(217,119,6,0.35)]',
    shadowClass: 'shadow-[4px_4px_12px_rgba(217,119,6,0.16),-2px_-2px_8px_rgba(255,255,255,0.95),inset_0_1.5px_2px_rgba(255,255,255,1)]',
  },
  {
    key: 'overdue',
    labelKey: 'overdue',
    statusParam: 'overdue',
    icon: AlertTriangle,
    surfaceClass: 'bg-linear-to-br! from-rose-50 to-rose-200',
    borderClass: 'border-rose-300',
    labelClass: 'text-rose-950',
    iconGradient: 'bg-linear-to-tr from-rose-600 to-rose-400 shadow-[0_3px_8px_rgba(220,38,38,0.35)]',
    shadowClass: 'shadow-[4px_4px_12px_rgba(220,38,38,0.16),-2px_-2px_8px_rgba(255,255,255,0.95),inset_0_1.5px_2px_rgba(255,255,255,1)]',
  },
  {
    key: 'dueToday',
    labelKey: 'dueToday',
    statusParam: 'due_today',
    icon: Calendar,
    surfaceClass: 'bg-linear-to-br! from-orange-50 to-orange-200',
    borderClass: 'border-orange-300',
    labelClass: 'text-orange-950',
    iconGradient: 'bg-linear-to-tr from-orange-600 to-orange-400 shadow-[0_3px_8px_rgba(234,88,12,0.35)]',
    shadowClass: 'shadow-[4px_4px_12px_rgba(234,88,12,0.16),-2px_-2px_8px_rgba(255,255,255,0.95),inset_0_1.5px_2px_rgba(255,255,255,1)]',
  },
  {
    key: 'reInspection',
    labelKey: 'reInspection',
    statusParam: 're_inspection',
    icon: RotateCw,
    surfaceClass: 'bg-linear-to-br! from-purple-50 to-purple-200',
    borderClass: 'border-purple-300',
    labelClass: 'text-purple-950',
    iconGradient: 'bg-linear-to-tr from-purple-600 to-purple-400 shadow-[0_3px_8px_rgba(147,51,234,0.35)]',
    shadowClass: 'shadow-[4px_4px_12px_rgba(147,51,234,0.16),-2px_-2px_8px_rgba(255,255,255,0.95),inset_0_1.5px_2px_rgba(255,255,255,1)]',
  },
  {
    key: 'completed',
    labelKey: 'completed',
    statusParam: 'completed',
    icon: CheckCircle2,
    surfaceClass: 'bg-linear-to-br! from-emerald-50 to-emerald-200',
    borderClass: 'border-emerald-300',
    labelClass: 'text-emerald-950',
    iconGradient: 'bg-linear-to-tr from-emerald-600 to-emerald-400 shadow-[0_3px_8px_rgba(22,163,74,0.35)]',
    shadowClass: 'shadow-[4px_4px_12px_rgba(22,163,74,0.16),-2px_-2px_8px_rgba(255,255,255,0.95),inset_0_1.5px_2px_rgba(255,255,255,1)]',
  },
];

export function SurveyKpiCards({
  counts,
}: SurveyKpiCardsProps = {}) {
  const t = useTranslations('fireAuditSurveyor.kpi');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedStatus = searchParams.get('status');

  const handleCardClick = (statusParam: string) => {
    const nextStatus = selectedStatus === statusParam ? null : statusParam;

    const params = new URLSearchParams(searchParams.toString());
    if (nextStatus) {
      params.set('status', nextStatus);
    } else {
      params.delete('status');
    }
    params.delete('page');
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  return (
    <section aria-label="Survey Metrics" className="w-full select-none">
      <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3.5">
        {KPI_CONFIGS.map((config) => {
          const Icon = config.icon;
          const count = counts?.[config.key] ?? 0;
          const isSelected = selectedStatus === config.statusParam;

          return (
            <Button
              key={config.key}
              variant="ghost"
              onClick={() => handleCardClick(config.statusParam)}
              className="w-full! h-auto! p-0! bg-transparent! hover:bg-transparent! block! [&>span]:block [&>span]:w-full text-left focus:outline-none! focus:ring-0! focus:ring-offset-0! focus-visible:ring-0! focus-visible:ring-offset-0! active:ring-0! rounded-2xl sm:rounded-3xl cursor-pointer group"
            >
              <Card
                padding="none"
                className={cn(
                  'rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 md:p-3 lg:p-3.5 border-[1.5px] transition-all duration-150',
                  config.surfaceClass,
                  config.borderClass,
                  isSelected
                    ? 'translate-y-[1.5px] scale-[0.98] shadow-[inset_2.5px_2.5px_6px_rgba(15,23,42,0.20),inset_-1.5px_-1.5px_3px_rgba(255,255,255,0.8)]!'
                    : cn(
                      'hover:-translate-y-0.5 active:translate-y-[1.5px] active:scale-[0.98]',
                      config.shadowClass
                    )
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={cn(
                      'text-[11px] sm:text-xs md:text-xs lg:text-sm font-bold tracking-normal leading-normal truncate block',
                      config.labelClass
                    )}
                  >
                    {t(config.labelKey)}
                  </span>

                  <div
                    className={cn(
                      'w-6 h-6 sm:w-7 sm:h-7 md:w-7.5 md:h-7.5 lg:w-8 lg:h-8 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs transition-transform group-hover:scale-105',
                      config.iconGradient
                    )}
                  >
                    <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 drop-shadow-xs" />
                  </div>
                </div>

                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-950 mt-1 sm:mt-1.5 md:mt-1.5 lg:mt-2 tracking-normal leading-none tabular-nums">
                  {count}
                </div>
              </Card>
            </Button>
          );
        })}
      </div>
    </section>
  );
}

