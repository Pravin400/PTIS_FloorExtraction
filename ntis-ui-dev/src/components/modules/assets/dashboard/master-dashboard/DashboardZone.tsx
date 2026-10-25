'use client';

import { Card } from '@/components/common';
import { getCategoryKey } from '@/lib/utils/asset-utils/asset-dashboard-helpers';
import type { DashboardZoneProps } from '@/types/assets/dashboard/master-dashboard/asset-dashboard.types';
import { BarChart3, Building2, PieChart as PieIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useMemo, useState } from 'react';
import { Cell, Legend, Pie, PieChart as RechartsPie, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6'];
const BAR_COLORS = [
  { gradient: 'from-blue-400 via-blue-500 to-blue-600', shadow: 'shadow-lg shadow-blue-500/30' },
  { gradient: 'from-green-400 via-green-500 to-green-600', shadow: 'shadow-lg shadow-green-500/30' },
  { gradient: 'from-purple-400 via-purple-500 to-purple-600', shadow: 'shadow-lg shadow-purple-500/30' },
  { gradient: 'from-orange-400 via-orange-500 to-orange-600', shadow: 'shadow-lg shadow-orange-500/30' },
  { gradient: 'from-pink-400 via-pink-500 to-pink-600', shadow: 'shadow-lg shadow-pink-500/30' },
  { gradient: 'from-teal-400 via-teal-500 to-teal-600', shadow: 'shadow-lg shadow-teal-500/30' },
];

export const DashboardZone = React.memo(function DashboardZone({ zoneDistribution, filteredAssets, selectedDistrict }: DashboardZoneProps) {
  const t = useTranslations('assetmasterdashboard');
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  const topZones = useMemo(() => [...zoneDistribution].sort((a, b) => b.value - a.value).slice(0, 6), [zoneDistribution]);
  const maxCount = useMemo(() => Math.max(...topZones.map((zone) => zone.value), 1), [topZones]);

  const pieData = useMemo(() => {
    const categoryCounts = filteredAssets.reduce((acc: Record<string, number>, asset) => {
      const category = asset.category || 'Unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(categoryCounts).map(([name, value], index) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      id: `category-pie-${selectedDistrict}-${index}-${name.toLowerCase()}`,
    })).sort((a, b) => b.value - a.value);
  }, [filteredAssets, selectedDistrict]);

  const totalZonesCount = zoneDistribution.length;
  const topZoneName = topZones[0]?.name || 'N/A';
  const topZoneCount = topZones[0]?.value || 0;
  const avgAssetsPerZone = totalZonesCount > 0 ? (filteredAssets.length / totalZonesCount).toFixed(0) : '0';

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes growHeight {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
      `}</style>
      <Card
        variant="bordered" padding="md" className="flex h-[720px] flex-col justify-between rounded-xl shadow-sm"
        style={{ animation: 'slideInRight 0.7s ease-out forwards' }}
      >
        <div>
          <div className="mb-4 flex items-center gap-3 flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600"><BarChart3 className="h-5 w-5 text-white" /></div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 sm:text-base">{t('zoneDistribution')}</h3>
              <p className="text-xs text-gray-500">{t('interactiveVisualization')}</p>
            </div>
          </div>

          <div className="mb-4 rounded-lg border-2 border-blue-400 bg-white p-4">
            <div className="mb-2 text-center"><p className="text-xs font-medium text-gray-500">{t('topZonesCount')}</p></div>
            <div className="flex h-52 items-end justify-around gap-2">
              {topZones.length ? (topZones.map((item, index) => {
                const heightPercent = (item.value / maxCount) * 100, color = BAR_COLORS[index % BAR_COLORS.length], isHovered = hoveredBar === item.name;
                return (
                  <div key={item.name} className="relative flex h-full flex-1 flex-col items-center justify-end pb-10">
                    <div
                      className={`relative min-h-[24px] w-full cursor-pointer overflow-hidden rounded-t-xl border-0 bg-gradient-to-b ${color.gradient} shadow-none ${color.shadow} transition-transform duration-500 hover:scale-105 ease-out`}
                      style={{ height: `${heightPercent}%`, transformOrigin: 'bottom', animation: `growHeight 0.5s ease-out ${index * 50}ms backwards` }}
                      onMouseEnter={() => setHoveredBar(item.name)} onMouseLeave={() => setHoveredBar(null)}
                    >
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent" />
                      <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-white/50 to-transparent" />
                      {isHovered && (
                        <div className="absolute left-1/2 top-2 z-20 -translate-x-1/2 border-0 bg-transparent shadow-none transition-all duration-200">
                          <div className="flex flex-col items-center rounded-md border-2 border-white bg-white/95 p-1 shadow-xl backdrop-blur-sm">
                            <Building2 className="mb-0.5 h-3 w-3 text-blue-600" /><span className="text-[10px] font-bold text-gray-950">{item.value}</span>
                            <span className="text-[7px] font-semibold uppercase text-gray-500">{t('assets')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="absolute bottom-0 mt-1 w-full truncate text-center text-[10px] font-semibold text-gray-700">{item.name}</p>
                  </div>
                );
              })) : (<div className="flex h-full items-center justify-center text-xs font-medium text-gray-400">{t('noZoneData')}</div>)}
            </div>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-2.5 text-center"><p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600">{t('totalZones')}</p><p className="text-xl font-black leading-none text-blue-900">{totalZonesCount}</p></div>
            <div className="rounded-lg border border-green-100 bg-green-50 p-2.5 text-center"><p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-green-600">{t('topZone')}</p><p className="mb-1 truncate text-xs font-black leading-none text-green-950">{topZoneName}</p><p className="text-[9px] font-semibold text-green-600">{t('assetsCount', { count: topZoneCount })}</p></div>
            <div className="rounded-lg border border-purple-100 bg-purple-50 p-2.5 text-center"><p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-600">{t('avgPerZone')}</p><p className="text-xl font-black leading-none text-purple-900">{avgAssetsPerZone}</p></div>
          </div>
        </div>

        <div className="flex-shrink-0">
          <div className="mb-2 flex flex-shrink-0 items-center gap-2"><PieIcon className="h-4 w-4 animate-spin-slow text-purple-600" /><h4 className="text-xs font-bold text-gray-900">{t('assetCategoryDistribution')}</h4></div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={155}>
              <RechartsPie>
                <Pie
                  key={`asset-category-pie-${selectedDistrict}`} data={pieData} cx="50%" cy="45%" labelLine={false} outerRadius={45} fill="#8884d8" dataKey="value" nameKey="name" className="text-[9px] font-bold"
                  label={({ name = 'Unknown', percent = 0 }) => {
                    const catKey = getCategoryKey(name), translatedName = catKey ? t(catKey as Parameters<typeof t>[0]) : name;
                    return `${translatedName.length > 8 ? `${translatedName.substring(0, 8)}...` : translatedName}: ${(percent * 100).toFixed(0)}%`;
                  }}
                >
                  {pieData.map((entry, index) => <Cell key={entry.id} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '10px' }} />
                <Legend verticalAlign="bottom" height={20} iconType="circle" wrapperStyle={{ fontSize: '9px' }} />
              </RechartsPie>
            </ResponsiveContainer>
          ) : (<div className="flex h-[155px] items-center justify-center text-[10px] font-medium text-gray-400">{t('loadingChart')}</div>)}
        </div>
      </Card>
    </>
  );
});
