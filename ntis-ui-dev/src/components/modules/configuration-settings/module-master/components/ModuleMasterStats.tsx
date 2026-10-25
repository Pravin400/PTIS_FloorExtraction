'use client';

import { useMemo } from 'react';
import { Briefcase, Activity, PowerOff } from 'lucide-react';

interface ModuleMasterStatsProps {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  t: (key: string, values?: Record<string, string | number>) => string;
  moduleLabel?: string;
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
  inactive: {
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-100',
    iconBg: 'bg-slate-100',
  },
} as const;

export function ModuleMasterStats({
  totalCount,
  activeCount,
  inactiveCount,
  t,
  moduleLabel,
}: ModuleMasterStatsProps) {
  const values = useMemo(() => ({ module: moduleLabel ?? '' }), [moduleLabel]);

  const stats = useMemo(
    () => [
      {
        id: 'total-modules',
        label: t('stats.totalModules', values),
        value: totalCount,
        icon: Briefcase,
        ...STAT_STYLES.total,
      },
      {
        id: 'active-modules',
        label: t('stats.active', values),
        value: activeCount,
        icon: Activity,
        ...STAT_STYLES.active,
      },
      {
        id: 'inactive-modules',
        label: t('stats.inactive', values),
        value: inactiveCount,
        icon: PowerOff,
        ...STAT_STYLES.inactive,
      },
    ],
    [totalCount, activeCount, inactiveCount, t, values]
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
