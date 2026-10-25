'use client';

import type { AssetGisKpiHeaderProps } from '@/types/asset-gis.types';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';

export type { AssetGisKpiHeaderProps };

const KPI_THEMES = [
  {
    bg: 'bg-orange-200/90 text-orange-950',
    iconBg: 'bg-white/35 border border-orange-500/30 text-orange-700',
    accentText: 'text-orange-700',
    label: 'text-orange-950',
    subText: 'text-orange-900/70',
    valText: 'text-orange-950',
    activeShadow: 'ring-4 ring-orange-400/80 shadow-orange-500/20 shadow-lg',
  },
  {
    bg: 'bg-emerald-200/90 text-emerald-950',
    iconBg: 'bg-white/35 border border-emerald-500/30 text-emerald-800',
    accentText: 'text-emerald-800',
    label: 'text-emerald-950',
    subText: 'text-emerald-900/70',
    valText: 'text-emerald-950',
    activeShadow: 'ring-4 ring-emerald-400/80 shadow-emerald-500/20 shadow-lg',
  },
  {
    bg: 'bg-rose-200/90 text-rose-950',
    iconBg: 'bg-white/35 border border-rose-500/30 text-rose-800',
    accentText: 'text-rose-800',
    label: 'text-rose-950',
    subText: 'text-rose-900/70',
    valText: 'text-rose-950',
    activeShadow: 'ring-4 ring-rose-400/80 shadow-rose-500/20 shadow-lg',
  },
  {
    bg: 'bg-amber-200/90 text-amber-950',
    iconBg: 'bg-white/35 border border-amber-500/30 text-amber-800',
    accentText: 'text-amber-800',
    label: 'text-amber-950',
    subText: 'text-amber-900/70',
    valText: 'text-amber-950',
    activeShadow: 'ring-4 ring-amber-400/80 shadow-amber-500/20 shadow-lg',
  },
  {
    bg: 'bg-sky-200/90 text-sky-950',
    iconBg: 'bg-white/35 border border-sky-500/30 text-sky-800',
    accentText: 'text-sky-800',
    label: 'text-sky-950',
    subText: 'text-sky-900/70',
    valText: 'text-sky-950',
    activeShadow: 'ring-4 ring-sky-400/80 shadow-sky-500/20 shadow-lg',
  },
] as const;

export function AssetGisKpiHeader({ kpis, activeKpiFilter, setActiveKpiFilter, isLoading = false }: AssetGisKpiHeaderProps) {
  const t = useTranslations('assetGis');

  return (
    <div className="w-full bg-white/40 backdrop-blur-xl border-b border-slate-200/50 z-20 px-3 py-1.5 shrink-0 shadow-2xs">
      <div className="grid grid-cols-5 gap-3">
        {kpis.slice(0, 5).map((kpi, idx) => {
          const isActive = activeKpiFilter === kpi.id;
          const theme = KPI_THEMES[idx % KPI_THEMES.length];

          return (
            <div key={kpi.id} className="flex flex-col">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="cursor-pointer"
                onClick={() => setActiveKpiFilter(isActive ? null : kpi.id)}
              >
                <div
                  className={cn(
                    'rounded-2xl px-3 py-2.5 flex flex-col transition-all duration-300 relative group overflow-hidden border border-white/60 shadow-xs',
                    theme.bg,
                    isActive ? cn('scale-[1.02] z-10', theme.activeShadow) : 'hover:scale-[1.01]'
                  )}
                >
                  <div className="absolute inset-x-0 top-0 h-[40%] opacity-70 bg-gradient-to-b from-white to-transparent pointer-events-none" />

                  <div className="relative z-10 flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs', theme.iconBg)}>
                      {kpi.icon ? (typeof kpi.icon === 'function' ? (() => {
                        const KpiIcon = kpi.icon as React.ComponentType<{ className?: string }>;
                        return <KpiIcon className={cn('w-6 h-6', theme.accentText)} />;
                      })() : <span>{kpi.icon as React.ReactNode}</span>) : null}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <p className={cn('text-[11px] font-black uppercase tracking-[0.1em] leading-none truncate mb-2', theme.label)}>{kpi.label}</p>

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                          <span className={cn('text-[8px] font-black uppercase opacity-70 tracking-tighter', theme.subText)}>{t('kpis.structure')}</span>
                          {isLoading ? (
                            <div className="h-5 w-12 bg-black/10 animate-pulse rounded mt-1" />
                          ) : (
                            <span className={cn('text-[20px] font-black leading-none tracking-tight', theme.valText)}>
                              {kpi.structured?.toLocaleString('en-IN') || '0'}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col items-end">
                          <span className={cn('text-[8px] font-black uppercase opacity-70 tracking-tighter', theme.subText)}>{t('kpis.unit')}</span>
                          {isLoading ? (
                            <div className="h-5 w-12 bg-black/10 animate-pulse rounded mt-1" />
                          ) : (
                            <span className={cn('text-[20px] font-black leading-none tracking-tight', theme.valText)}>
                              {kpi.unit?.toLocaleString('en-IN') || '0'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
