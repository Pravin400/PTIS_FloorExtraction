import type { ReactElement } from 'react';
import { Card, CardContent } from '@/components/common';
import type { StatCardProps } from '@/types/grievance-category-master/grievanceCategory.types';

/**
 * Simple, clean StatCard Component as per the user's preferred design.
 */
export function StatCard({ label, value, icon: Icon, color }: StatCardProps): ReactElement {
  const colorSchemes = {
    rose: {
      text: 'text-rose-600',
      iconBg: 'bg-rose-50',
      iconBorder: 'border-rose-100',
    },
    blue: {
      text: 'text-blue-600',
      iconBg: 'bg-blue-50',
      iconBorder: 'border-blue-100',
    },
    indigo: {
      text: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
      iconBorder: 'border-indigo-100',
    },
    amber: {
      text: 'text-amber-600',
      iconBg: 'bg-amber-50',
      iconBorder: 'border-amber-100',
    },
  };

  const scheme = (color && colorSchemes[color as keyof typeof colorSchemes]) || colorSchemes.blue;

  return (
    <Card
      className="h-full border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-3xl bg-white"
      padding="none"
    >
      <CardContent className="p-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              {label}
            </span>
            <span className="text-3xl font-bold text-slate-900 tabular-nums tracking-tight">
              {value}
            </span>
          </div>

          <div
            className={`w-14 h-14 flex items-center justify-center rounded-2xl border ${scheme.iconBg} ${scheme.iconBorder} ${scheme.text} shadow-sm`}
          >
            <Icon className="w-7 h-7" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
