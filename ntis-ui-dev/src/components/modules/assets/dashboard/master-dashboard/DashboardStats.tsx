'use client';

import { Card } from '@/components/common';
import { DashboardStatsProps, FlipStatsCardProps } from '@/types/assets/dashboard/master-dashboard/asset-dashboard.types';
import { useTranslations } from 'next-intl';
import React, { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils/cn';

const getLabelKey = (label: string): string => {
  const norm = String(label || '').trim().toLowerCase();
  const mapping: Record<string, string> = {
    'total assets': 'totalAssets', 'total value': 'totalValue', 'encroachments': 'encroachments', 'maintenance due': 'maintenanceDue',
    'active auctions': 'activeAuctions', 'asset acquisition': 'assetAcquisition', 'active cases': 'activeCases', 'resolved': 'resolved',
    'legal action': 'legalAction', 'under review': 'underReview', 'critical': 'critical', 'needs repair': 'needsRepair',
    'scheduled': 'scheduled', 'budget allocated': 'budgetAllocated', 'total bids': 'totalBids', 'avg. bid increase': 'avgBidIncrease',
    'success rate': 'successRate', 'completed transfers': 'completedTransfers', 'pending possession': 'pendingPossession',
    'legal disputes': 'legalDisputes', 'in progress': 'inProgress',
    'total capital value': 'totalValue', 'monetized assets': 'monetizedAssets'
  };
  return mapping[norm] || mapping[norm.replace(/\s+value$/, '')] || '';
};

const GRADIENT_MAP: Record<string, string> = {
  blue: 'from-blue-500 to-indigo-600', emerald: 'from-emerald-500 to-teal-600', teal: 'from-emerald-500 to-teal-600',
  purple: 'from-purple-600 to-violet-700', violet: 'from-purple-600 to-violet-700', red: 'from-red-600 to-rose-800',
  rose: 'from-red-600 to-rose-800', amber: 'from-amber-500 to-orange-600', orange: 'from-amber-500 to-orange-600',
};

/** Stable key used to decide if the back-panel items are clickable (avoids English string comparison) */
const NON_CLICKABLE_TITLE_KEYS = new Set<string>();

export interface FlipStatsCardComponentProps extends FlipStatsCardProps {
  titleKey: string;
}

export const FlipStatsCard = React.memo(function FlipStatsCard({ titleKey, title, value, change, icon: Icon, gradient, backInfo, onCategoryClick }: FlipStatsCardComponentProps) {
  const t = useTranslations('assetmasterdashboard');
  const [isFlipped, setIsFlipped] = useState(false);
  const match = Object.keys(GRADIENT_MAP).find((key) => gradient.includes(key));
  const gradientColor = match ? GRADIENT_MAP[match] : 'from-gray-400 to-gray-600';
  const flipTimeoutRef = useRef<NodeJS.Timeout>(null);

  const handleToggle = useCallback(() => setIsFlipped((prev) => !prev), []);
  const handleMouseEnter = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches) {
      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
      flipTimeoutRef.current = setTimeout(() => setIsFlipped(true), 200);
    }
  }, []);
  const handleMouseLeave = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches) {
      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
      setIsFlipped(false);
    }
  }, []);
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault(); handleToggle();
    }
  }, [handleToggle]);

  const titleLabelKey = getLabelKey(title), displayTitle = titleLabelKey ? t(titleLabelKey as Parameters<typeof t>[0]) : title;

  return (
    <div
      tabIndex={0} role="button" aria-expanded={isFlipped} aria-label={`${displayTitle} ${t('pressEnterDetails')}`}
      className="perspective-1000 h-40 cursor-pointer rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
      onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={handleToggle} onKeyDown={handleKeyDown}
    >
      <div
        className={cn("preserve-3d relative h-full w-full border-0 bg-transparent shadow-none transition-transform duration-700 ease-in-out")}
        style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)' }}
      >
        <div className="backface-hidden absolute inset-0 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg" style={{ backfaceVisibility: 'hidden' }}>
          <div className={cn("h-1 bg-gradient-to-r", gradientColor)} />
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-600">{displayTitle}</p>
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br shadow-md", gradientColor)}><Icon className="h-5 w-5 text-white" /></div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-end justify-between gap-2"><h3 title={String(value)} className="truncate text-2xl font-bold leading-tight text-gray-900">{value}</h3></div>
              {change && change.trim() !== '' && change.trim() !== '0' && <p className="text-xs font-semibold text-gray-500">{change}</p>}
            </div>
          </div>
        </div>

        <div className="backface-hidden absolute inset-0 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <div className={cn("h-1 bg-gradient-to-r", gradientColor)} />
          <div className="p-2.5">
            <div className="mb-2 flex items-center gap-2">
              <div className={cn("flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br", gradientColor)}><Icon className="h-3.5 w-3.5 text-white" /></div>
              <p className="text-[10px] font-bold uppercase leading-none tracking-wide text-gray-900">{displayTitle}</p>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-[105px] overflow-y-auto pr-1 scrollbar-thin">
              {backInfo && backInfo.length > 0 ? backInfo.map((info, idx) => {
                const backLabelKey = getLabelKey(info.label), displayBackLabel = backLabelKey ? t(backLabelKey as Parameters<typeof t>[0]) : info.label;
                const isClickable = !NON_CLICKABLE_TITLE_KEYS.has(titleKey) && !!info.category;
                const Component = isClickable ? 'button' : 'div';
                return (
                  <Component
                    key={idx}
                    type={isClickable ? "button" : undefined}
                    className={cn("flex min-h-[48px] w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-md border border-gray-100 bg-gray-50 p-2 text-center", isClickable ? "cursor-pointer transition-all hover:border-blue-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500" : "cursor-default")}
                    onClick={(event) => {
                      if (isClickable && info.category) {
                        event.stopPropagation(); onCategoryClick?.(info.category);
                      }
                    }}
                  >
                    <p className="max-w-full truncate whitespace-nowrap px-1 text-[9px] leading-tight text-gray-500" title={displayBackLabel}>{displayBackLabel}</p>
                    <p className="max-w-full px-0.5 text-[11px] font-extrabold leading-tight text-gray-900 text-center" title={info.value}>{info.value}</p>
                  </Component>
                );
              }) : (
                <div className="col-span-2 text-center text-xs text-gray-500 py-4">{t('noDetailsAvailable', { defaultValue: 'No details available' })}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const DashboardStats = React.memo(function DashboardStats({ stats, icons, onCategoryClick }: DashboardStatsProps) {

  const cards = [
    { titleKey: 'totalAssets', title: 'Total Assets', value: stats.totalAssets.value, change: stats.totalAssets.change, icon: icons.BarChart3, gradient: 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700', backInfo: stats.totalAssets.backInfo },
    { titleKey: 'totalValue', title: 'Total Capital Value', value: stats.totalValue.value, change: stats.totalValue.change, icon: icons.IndianRupee, gradient: 'bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700', backInfo: stats.totalValue.backInfo },
    { titleKey: 'monetizedAssets', title: 'Monetized Assets', value: stats.monetized.value, change: stats.monetized.change, icon: icons.Coins, gradient: 'bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600', backInfo: stats.monetized.backInfo },
    { titleKey: 'encroachments', title: 'Encroachments', value: stats.encroachments.value, change: stats.encroachments.change, icon: icons.ShieldAlert, gradient: 'bg-gradient-to-br from-red-500 via-rose-600 to-red-700', backInfo: stats.encroachments.backInfo },
    { titleKey: 'maintenanceDue', title: 'Maintenance Due', value: stats.maintenance.value, change: stats.maintenance.change, icon: icons.Wrench, gradient: 'bg-gradient-to-br from-purple-500 via-violet-600 to-purple-700', backInfo: stats.maintenance.backInfo },
    { titleKey: 'activeAuctions', title: 'Active Auctions', value: stats.auctions.value, change: stats.auctions.change, icon: icons.Activity, gradient: 'bg-gradient-to-br from-amber-500 via-orange-600 to-yellow-700', backInfo: stats.auctions.backInfo },
    { titleKey: 'assetAcquisition', title: 'Asset Acquisition', value: stats.acquisitions.value, change: stats.acquisitions.change, icon: icons.MapPin, gradient: 'bg-gradient-to-br from-teal-500 via-emerald-600 to-green-600', backInfo: stats.acquisitions.backInfo },
  ];

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 sm:mb-6 sm:grid-cols-2 sm:gap-4 md:gap-6 lg:grid-cols-4 xl:grid-cols-7">
      <style>{`
        @keyframes fadeInUpStats {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {cards.map((card, index) => (
        <Card
          key={card.titleKey} variant="default" padding="none"
          className="border-0 bg-transparent shadow-none"
          style={{ animation: `fadeInUpStats 0.5s ease-out ${0.05 * (index + 1)}s forwards`, opacity: 0 }}
        >
          <FlipStatsCard {...card} onCategoryClick={onCategoryClick} />
        </Card>
      ))}
    </div>
  );
});
