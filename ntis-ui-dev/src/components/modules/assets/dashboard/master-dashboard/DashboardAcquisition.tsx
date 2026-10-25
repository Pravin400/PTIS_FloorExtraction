'use client';

import { Button, Card } from '@/components/common';
import { Badge } from '@/components/common/Badge';
import { LAKHS_TO_CRORES } from '@/lib/utils/asset-utils/asset-dashboard-helpers';
import type { DashboardAcquisitionProps } from '@/types/assets/dashboard/master-dashboard/asset-dashboard.types';
import { Activity, CheckCircle, FileText, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useMemo, useCallback } from 'react';


export const DashboardAcquisition = React.memo(function DashboardAcquisition({ acquisitionsList, auctionsList, onAuctionClick }: DashboardAcquisitionProps) {
  const t = useTranslations('assetmasterdashboard');

  const fmtCrores = useCallback((lakhs: number) =>
    `${t('currencyPrefix', { defaultValue: 'Rs. ' })}${(lakhs / LAKHS_TO_CRORES).toFixed(1)}${t('croresSuffix', { defaultValue: ' Cr' })}`,
    [t]);

  const { acquisitionsByZone, totals } = useMemo(() => {
    const defaultZones = ['North', 'South', 'East', 'West'];
    const activeZones = Array.from(new Set([...defaultZones, ...acquisitionsList.map(i => i.zone)])).filter(Boolean);
    const zoneMap = activeZones.reduce((acc, z) => {
      acc[z] = { zone: z, count: 0, amount: 0, disputes: 0, pending: 0, complete: 0 };
      return acc;
    }, {} as Record<string, { zone: string; count: number; amount: number; disputes: number; pending: number; complete: number }>);
    let totalProposals = 0, totalAmount = 0, totalDisputes = 0, totalPending = 0, totalComplete = 0;
    acquisitionsList.forEach((acq) => {
      totalProposals += 1; totalAmount += acq.amount;
      if (acq.status === 'dispute') totalDisputes += 1;
      else if (acq.status === 'pending') totalPending += 1;
      else if (acq.status === 'complete') totalComplete += 1;
      const zData = zoneMap[acq.zone];
      if (zData) {
        zData.count += 1; zData.amount += acq.amount;
        if (acq.status === 'dispute') zData.disputes += 1;
        else if (acq.status === 'pending') zData.pending += 1;
        else if (acq.status === 'complete') zData.complete += 1;
      }
    });
    return {
      acquisitionsByZone: Object.values(zoneMap).filter((z) => z.count > 0),
      totals: { totalProposals, totalAmount, totalDisputes, totalPending, totalComplete },
    };
  }, [acquisitionsList]);

  const { totalProposals, totalAmount, totalDisputes, totalPending, totalComplete } = totals;
  const hasAcquisitions = acquisitionsByZone.length > 0;
  const hasAuctions = auctionsList.length > 0;

  return (
    <>
      <Card
        variant="bordered" padding="none" className="flex h-[720px] flex-col overflow-hidden rounded-xl p-4 shadow-sm sm:p-6 animate-slide-in-left"
      >
        <div className="mb-4 flex flex-shrink-0 flex-col items-start gap-3 sm:flex-row sm:items-center">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 sm:h-10 sm:w-10">
            <TrendingUp className="h-4 w-4 text-white sm:h-5 sm:w-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold leading-tight text-gray-900 sm:text-lg">{t('acquisitionPipelineTitle')}</h3>
            <p className="mt-0.5 text-xs font-semibold text-gray-500 sm:text-sm">{t('acquisitionPipelineDesc')}</p>
          </div>
        </div>

        <div className="mb-4 flex-shrink-0">
          <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="flex min-w-max gap-2 sm:gap-3">
              {hasAcquisitions ? (
                acquisitionsByZone.map(({ zone, count, amount, disputes, pending, complete }) => (
                  <div key={zone} className="relative h-[90px] min-w-[160px] sm:min-w-[190px]" style={{ perspective: '1000px' }}>
                    <div
                      className="group relative h-full w-full cursor-pointer border-0 bg-transparent shadow-none transition-transform duration-700 ease-in-out hover:[transform:rotateY(180deg)]"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      <div className="absolute inset-0 flex flex-col justify-center rounded-lg border border-gray-200 bg-white p-3" style={{ backfaceVisibility: 'hidden' }}>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-gray-800">{zone} {t('zoneSuffix')}</p>
                          <div className="text-right">
                            <p className="text-sm font-extrabold text-gray-900">{t('proposalsCount', { count })}</p>
                            <p className="text-[12px] font-extrabold text-purple-600 sm:text-xs">{fmtCrores(amount)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="absolute inset-0 overflow-hidden rounded-lg border border-gray-200 bg-white p-3" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <p className="mb-1 text-[11px] font-bold text-gray-800">{zone} {t('zoneSuffix')}</p>
                        <div className="space-y-0.5 text-[11px]">
                          <div className="flex items-center justify-between"><span className="font-semibold text-red-500">{t('disputes')}</span><span className="font-bold text-gray-900">{disputes}</span></div>
                          <div className="flex items-center justify-between"><span className="font-semibold text-amber-500">{t('pending')}</span><span className="font-bold text-gray-900">{pending}</span></div>
                          <div className="flex items-center justify-between"><span className="font-semibold text-green-500">{t('complete')}</span><span className="font-bold text-gray-900">{complete}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-6 text-sm text-gray-400">{t('noAcquisitions')}</div>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-shrink-0 items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-700 sm:text-sm">
            <div className="flex items-center gap-4">
              <span className="font-extrabold text-gray-900">{t('total')}:</span>
              <span>{t('proposalsPrefix')} <span className="font-extrabold text-gray-950">{totalProposals}</span></span>
              <span className="font-extrabold text-purple-600">{fmtCrores(totalAmount)}</span>
            </div>
            <div className="flex gap-3">
              <span>{t('disputes')}: <span className="font-extrabold text-red-600">{totalDisputes}</span></span>
              <span>{t('pending')}: <span className="font-extrabold text-amber-600">{totalPending}</span></span>
              <span>{t('complete')}: <span className="font-extrabold text-green-600">{totalComplete}</span></span>
            </div>
          </div>
        </div>

        <div className="my-3 flex-shrink-0 border-t border-gray-200" />

        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          <div className="mb-2 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 shadow shadow-purple-500/30">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold leading-tight text-gray-900 sm:text-base">{t('liveAuctionActivity')}</h3>
                <p className="mt-0.5 text-xs font-semibold text-gray-500">{t('liveAuctionDesc')}</p>
              </div>
            </div>
            <Badge variant="success" size="sm" dot className="h-5 px-2 text-[10px] font-bold">{t('liveBadge')}</Badge>
          </div>

          {hasAuctions ? (
            auctionsList.map((bid, idx) => (
              <div key={bid.auctionId} className="rounded-lg border border-gray-200 bg-white p-2.5 text-xs transition-all hover:border-blue-300 hover:shadow-sm sm:text-sm">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="rounded bg-gray-50 px-1.5 py-0.5 text-[11px] font-bold text-gray-700">#{idx + 1}</span>
                  <span className="flex-1 truncate text-xs font-bold leading-tight text-gray-900 sm:text-sm">{bid.property}</span>
                  <span className="whitespace-nowrap text-xs font-extrabold text-green-700 sm:text-sm">{bid.amount}</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  <Button
                    onClick={() => onAuctionClick({ type: 'published', bid, index: idx })} variant="ghost"
                    className="flex h-auto w-full min-w-0 flex-col items-center gap-0.5 rounded border border-blue-200 bg-blue-50 px-0 py-1.5 text-[10px] font-bold text-blue-700 shadow-none transition-colors hover:bg-blue-100 hover:text-blue-700 sm:text-[11px]"
                  >
                    <Activity className="h-3.5 w-3.5" /> {t('published')}
                  </Button>
                  <Button
                    onClick={() => onAuctionClick({ type: 'bids', bid, index: idx })} variant="ghost"
                    className="flex h-auto w-full min-w-0 flex-col items-center gap-0.5 rounded border border-green-200 bg-green-50 px-0 py-1.5 text-[10px] font-bold text-green-700 shadow-none transition-colors hover:bg-green-100 hover:text-green-700 sm:text-[11px]"
                  >
                    <TrendingUp className="h-3.5 w-3.5" /> {t('bidsCount', { count: bid.bids })}
                  </Button>
                  <Button
                    onClick={() => onAuctionClick({ type: 'approved', bid, index: idx })} variant="ghost"
                    className="flex h-auto w-full min-w-0 flex-col items-center gap-0.5 rounded border border-emerald-200 bg-emerald-50 px-0 py-1.5 text-[10px] font-bold text-emerald-700 shadow-none transition-colors hover:bg-emerald-100 hover:text-emerald-700 sm:text-[11px]"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> {t('approved')}
                  </Button>
                  <Button
                    onClick={() => onAuctionClick({ type: 'submitted', bid, index: idx })} variant="ghost"
                    className="flex h-auto w-full min-w-0 flex-col items-center gap-0.5 rounded border border-purple-200 bg-purple-50 px-0 py-1.5 text-[10px] font-bold text-purple-700 shadow-none transition-colors hover:bg-purple-100 hover:text-purple-700 sm:text-[11px]"
                  >
                    <FileText className="h-3.5 w-3.5" /> {t('submitted')}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-6 text-sm text-gray-400">{t('noAuctions')}</div>
          )}
        </div>
      </Card>
    </>
  );
});
