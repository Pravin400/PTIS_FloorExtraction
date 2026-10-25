'use client';

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
  formatPercent,
  zoneColorForIndex,
} from '@/lib/utils/asset-utils/revenue-dashboard-helpers';
import { formatIndianCurrencyAbbreviated } from '@/lib/utils/asset-utils/currency-format';

import type { ZoneWiseDemandCollectionProps } from '@/types/assets/dashboard/revenue-dashboard/revenue-dashboard.types';

const ZoneWiseDemandCollection: React.FC<ZoneWiseDemandCollectionProps> = ({
  data,
  title,
  totalDemandLabel,
  tWrapper,
}) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const chartData = useMemo(
    () =>
      data.map((zone, index) => ({
        ...zone,
        color: zoneColorForIndex(index),
      })),
    [data]
  );

  const totalDemand = useMemo(() => data.reduce((sum, zone) => sum + zone.demand, 0), [data]);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-800 mb-6">{title}</h2>

      <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
        <div className="relative w-[360px] h-[250px] shrink-0">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="100%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={100}
                  outerRadius={160}
                  paddingAngle={2}
                  dataKey="demand"
                  stroke="none"
                >
                  {chartData.map((entry) => (
                    <Cell key={`cell-${entry.zoneId}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full bg-gray-50 animate-pulse rounded-full" />
          )}

          <div className="absolute top-2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-8">
            <p className="text-2xl font-bold text-gray-800">{formatIndianCurrencyAbbreviated(totalDemand, tWrapper)}</p>
            <p className="text-sm text-gray-500">{totalDemandLabel}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full xl:w-auto">
          {chartData.map((zone) => {
            const label = [zone.zoneNo, zone.zoneName].filter(Boolean).join(' - ') || String(zone.zoneId);
            return (
              <div key={zone.zoneId} className="flex items-center justify-between gap-4 min-w-[280px]">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{label}</p>
                    <p className="text-xs text-gray-600">
                      <span className="text-green-600">{formatIndianCurrencyAbbreviated(zone.collection, tWrapper)}</span>
                      <span className="mx-1">/</span>
                      <span className="text-red-600">{formatIndianCurrencyAbbreviated(zone.pending, tWrapper)}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">
                    {formatPercent(zone.demandSharePercent)}
                  </p>
                  <p className="text-xs text-gray-500">{formatIndianCurrencyAbbreviated(zone.demand, tWrapper)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ZoneWiseDemandCollection;
