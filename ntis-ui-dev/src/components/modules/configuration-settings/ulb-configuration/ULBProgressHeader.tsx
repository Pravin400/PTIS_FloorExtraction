'use client';

import { Bell, Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/common';
import type { ULBProgressHeaderProps } from '@/types/ulbconfig-master.types';

export function ULBProgressHeader({
  completedCount,
  totalSteps,
  urgentAlertCount,
}: ULBProgressHeaderProps) {
  const t = useTranslations('ulb_configuration');
  const percent = Math.round((completedCount / totalSteps) * 100);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-indigo-100/50 bg-gradient-to-r from-indigo-50/80 via-white/90 to-blue-50/80 px-5 py-3 ring-1 ring-indigo-200/30 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/10 bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-900">{t('title')}</h2>
          <p className="mt-0.5 text-sm font-medium text-slate-500">{t('subtitle')}</p>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-slate-50/50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600">
              {t('progress.completed', { completed: completedCount, total: totalSteps })}
            </Badge>
            <span className="text-sm font-black text-primary">{percent}%</span>
          </div>
          <div className="flex gap-1.5 px-0.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-500 ${
                  completedCount >= i + 1
                    ? 'w-10 bg-gradient-to-r from-emerald-400 to-emerald-500'
                    : 'w-5 bg-slate-200/80'
                }`}
              />
            ))}
          </div>
        </div>

        {urgentAlertCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-1.5">
            <Bell className="h-3.5 w-3.5 text-rose-600" />
            <span className="text-xs font-bold text-rose-700">
              {t('progress.urgentAlerts', { count: urgentAlertCount })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
