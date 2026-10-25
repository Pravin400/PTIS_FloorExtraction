'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Clock } from 'lucide-react';
import type { TaxDetailsData } from '@/types/ptisMain-taxdetails.types';
import { Tabs, TabList, Tab, Badge, Tooltip } from '@/components/common';
import TaxDetails from '../TaxDetails/TaxDetails';

interface TaxDetailsContainerProps {
  title?: string;
  initialTaxDetails?: TaxDetailsData;
  metricsCards: React.ReactNode;
}

export function TaxDetailsContainer({
  initialTaxDetails,
  metricsCards,
}: TaxDetailsContainerProps) {
  const t = useTranslations('ptisMainTaxDetails');
  const [activeTab, setActiveTab] = useState<'current' | 'pending'>('current');

  // Count total pending tax entries across all policies
  const pendingCount = useMemo(() => {
    const policies = initialTaxDetails?.policies || [];
    let count = 0;
    policies.forEach((p) => {
      if (p.pendingYears) {
        count += p.pendingYears.length;
      }
    });
    return count;
  }, [initialTaxDetails]);

  return (
    <div className="overflow-hidden rounded-xl border border-blue-200 bg-white shadow-md">
      <Tabs
        value={activeTab}
        onChange={(val) => setActiveTab(val as 'current' | 'pending')}
        variant="pills"
      >
        {/* 1. Header Bar: Tabs on Left, Metric Cards on Right (Single Unified Line) */}
        <div className="bg-gradient-to-r from-slate-50 via-blue-50/30 to-slate-50 px-2.5 sm:px-3 py-1.5 flex flex-nowrap items-center justify-between gap-2.5 border-b border-blue-200/80 w-full min-w-0 relative">
          <div className="shrink-0 relative z-10">
            <TabList className="bg-slate-100 p-1 rounded-xl border border-slate-200 inline-flex items-center gap-1 shrink-0" scrollable={false}>
              <Tooltip content="Current Taxes" placement="top">
                <Tab
                  value="current"
                  icon={CheckCircle2}
                  className={`inline-flex flex-row items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer ${activeTab === 'current'
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                      : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                    }`}
                >
                  {t('taxDetails')}
                </Tab>
              </Tooltip>

              <Tooltip content="Previous Taxes" placement="top">
                <Tab
                  value="pending"
                  icon={Clock}
                  className={`inline-flex flex-row items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer ${activeTab === 'pending'
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                      : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                    }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span>{t('arrearsTaxes')}</span>
                    {pendingCount > 0 && (
                      <Badge
                        size="sm"
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold border-transparent transition-colors shrink-0 ${activeTab === 'pending'
                            ? 'bg-blue-100 text-blue-700 font-bold'
                            : 'bg-slate-200 text-slate-700 font-medium'
                          }`}
                      >
                        {pendingCount}
                      </Badge>
                    )}
                  </span>
                </Tab>
              </Tooltip>
            </TabList>
          </div>

          {/* Summary Metrics Cards Container (Scrollable independently on overflow) */}
          <div className="flex-1 min-w-0 overflow-x-auto scrollbar-thin [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-blue-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-100 py-0.5 flex items-center">
            {metricsCards}
          </div>
        </div>

        {/* 2. Tax Details Table */}
        <TaxDetails initialTaxDetails={initialTaxDetails} activeTab={activeTab} />
      </Tabs>
    </div>
  );
}
