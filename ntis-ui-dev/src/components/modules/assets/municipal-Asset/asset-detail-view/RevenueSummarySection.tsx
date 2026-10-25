import type { RevenueSummarySectionProps } from '@/types/asset/municipal-Asset/asset-detail.types';
import { getTranslations } from 'next-intl/server';
import React from 'react';
import { SectionCard } from './SectionCard';
import { TrendingUp } from 'lucide-react';
import { Badge, Tooltip } from '@/components/common';

export async function RevenueSummarySection({ data, locale }: RevenueSummarySectionProps): Promise<React.ReactElement> {
  const t = await getTranslations({ locale, namespace: 'asset-detail' });
  return (
    <SectionCard
      title={t('revenueSummary')}
      titleIcon={<TrendingUp className="w-3.5 h-3.5 text-white" />} iconBgClass="bg-emerald-500"
    >
      <div className="flex flex-col h-full justify-between">
        {/* Key figures list */}
        <div className="flex flex-col w-full">
          <div className="flex justify-between items-center py-0.5 border-b border-slate-100/60">
            <span className="text-[10px] font-medium text-blue-700">{t('totalDemand')}</span>
            <span className="text-[11px] font-black text-blue-900">{data.totalDemand}</span>
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-slate-100/60">
            <span className="text-[10px] font-medium text-blue-700">{t('collection')}</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-blue-900">{data.collection}</span>
              <Badge size="sm" variant="success" className="!h-auto !px-1.5 !py-0.5 !rounded-full !text-[9px] !font-bold !bg-green-100 !text-green-700 !border-transparent">
                {data.collectionEfficiency}
              </Badge>
            </div>
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-slate-100/60">
            <span className="text-[10px] font-medium text-blue-700">{t('balanceArrears')}</span>
            <span className="text-[11px] font-black text-red-600">{data.balanceArrears}</span>
          </div>
        </div>

        {/* Mini bar chart with axis */}
        <div className="flex flex-col relative mt-1">
          {/* Axis line */}
          <div className="absolute bottom-[14px] left-0 right-0 border-b border-slate-200">
            <div className="absolute -left-[3px] -top-[2px] w-[5px] h-[5px] rounded-full border border-slate-300 bg-white"></div>
          </div>

          <div className="flex items-end gap-[4px] h-8 px-1 pb-0.5 relative">
            {data.revenueBars.map((bar) => {
              const heightPct = Math.round((bar.value / bar.maxValue) * 100);
              return (
                <div key={bar.month} className="flex flex-col items-center flex-1 h-full justify-end">
                  <Tooltip content={`${bar.month}: ${bar.value}`} placement="top">
                    <div
                      className="w-full bg-blue-600 transition-all hover:bg-blue-500"
                      style={{ height: `${heightPct}%` }}
                    />
                  </Tooltip>
                </div>
              );
            })}
          </div>
          {/* Month labels */}
          <div className="flex gap-[5px] px-1 relative">
            {data.revenueBars.map((bar) => (
              <div key={bar.month} className="flex-1 text-center">
                <span className="text-[9px] text-blue-700 font-medium">{bar.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
