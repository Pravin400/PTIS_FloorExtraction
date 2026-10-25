import { useTranslations } from 'next-intl';
import React from 'react';
import type { ValuationMetricsStripProps } from '@/types/asset/municipal-Asset/sub-asset-detail-ui.types';
import { cn } from '@/lib/utils/cn';

import { Maximize2, LayoutDashboard, Calculator, Coins, AlertTriangle, Scale, Banknote } from 'lucide-react';

const MetricIcons = {
  CarpetArea: Maximize2,
  BuiltUpArea: LayoutDashboard,
  ReckonerRate: Calculator,
  BaseValue: Coins,
  RiskFactor: AlertTriangle,
  WeightedValue: Scale,
  FinalCapital: Banknote
};

export function ValuationMetricsStrip({ data }: ValuationMetricsStripProps): React.ReactElement {
  const t = useTranslations('subAssetDetail');

  const metrics = [
    { label: t('totalCarpetArea'), value: data.totalCarpetArea, Icon: MetricIcons.CarpetArea, bgClass: 'bg-blue-50', borderClass: 'border-blue-100', iconColor: 'text-blue-600' },
    { label: t('totalBuiltupArea'), value: data.totalBuiltupArea, Icon: MetricIcons.BuiltUpArea, bgClass: 'bg-orange-50', borderClass: 'border-orange-100', iconColor: 'text-orange-600' },
    { label: t('readyReckonerRate'), value: data.readyReckonerRate, Icon: MetricIcons.ReckonerRate, bgClass: 'bg-emerald-50', borderClass: 'border-emerald-100', iconColor: 'text-emerald-600' },
    { label: t('baseValueAbv'), value: data.baseValueAbv, Icon: MetricIcons.BaseValue, bgClass: 'bg-emerald-50', borderClass: 'border-emerald-100', iconColor: 'text-emerald-600' },
    { label: t('weightedValueAbv'), value: data.weightedValueAbv, Icon: MetricIcons.WeightedValue, bgClass: 'bg-blue-50', borderClass: 'border-blue-100', iconColor: 'text-blue-600' },
    { label: t('finalCapitalValue'), value: data.finalCapitalValue, Icon: MetricIcons.FinalCapital, bgClass: 'bg-purple-50', borderClass: 'border-purple-100', iconColor: 'text-purple-600' },
  ];

  return (
    <div className="grid grid-cols-6 gap-2 w-full">
      {metrics.map((m, _) => (
        <div key={m.label} className={cn('flex items-center gap-2 rounded-xl border px-2 py-2 shadow-sm', m.bgClass, m.borderClass)}>
          <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-white shadow-sm">
            <m.Icon className={cn('w-5 h-5', m.iconColor)} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-bold text-slate-600 mb-0.5 truncate leading-normal pt-0.5 uppercase tracking-wider">{m.label}</span>
            <span className={cn('text-[12.5px] font-black truncate leading-normal', m.iconColor)}>{m.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

