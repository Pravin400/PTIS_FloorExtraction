'use client';

import { useMemo } from 'react';
import { Landmark, Activity, MapPin } from 'lucide-react';

interface BankMasterStatsProps {
  totalCount: number;
  activeCount: number;
  statesCount: number;
  t: (key: string, values?: Record<string, string | number>) => string;
  bankLabel?: string;
  stateLabel?: string;
}

const STAT_STYLES = {
  total: {
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    iconBg: 'bg-blue-100',
  },
  active: {
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    iconBg: 'bg-emerald-100',
  },
  states: {
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    iconBg: 'bg-amber-100',
  },
} as const;

export function BankMasterStats({
  totalCount,
  activeCount,
  statesCount,
  t,
  bankLabel,
  stateLabel,
}: BankMasterStatsProps) {
  const values = useMemo(
    () => ({ bank: bankLabel ?? '', state: stateLabel ?? '' }),
    [bankLabel, stateLabel]
  );

  const stats = useMemo(
    () => [
      {
        id: 'total-banks',
        label: t('stats.totalBanks', values),
        value: totalCount,
        icon: Landmark,
        ...STAT_STYLES.total,
      },
      {
        id: 'active-banks',
        label: t('stats.active', values),
        value: activeCount,
        icon: Activity,
        ...STAT_STYLES.active,
      },
      {
        id: 'states-count',
        label: t('stats.states', values),
        value: statesCount,
        icon: MapPin,
        ...STAT_STYLES.states,
      },
    ],
    [totalCount, activeCount, statesCount, t, values]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className={`${stat.bg} border ${stat.border} rounded-xl p-4 flex items-center justify-between transition-all duration-200 hover:shadow-md`}
        >
          <div>
            <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
            <h3
              className={`text-2xl font-bold ${stat.color}`}
              data-testid={`stat-value-${stat.id}`}
            >
              {stat.value}
            </h3>
          </div>

          <div className={`p-3 rounded-lg ${stat.iconBg}`}>
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
