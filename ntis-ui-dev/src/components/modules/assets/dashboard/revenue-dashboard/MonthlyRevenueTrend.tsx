'use client';

import React, { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';


import type {
  ChartPoint,
  MonthlyRevenueTrendProps,
  TrendTooltipProps,
} from '@/types/assets/dashboard/revenue-dashboard/revenue-dashboard.types';

import { formatIndianCurrencyAbbreviated } from '@/lib/utils/asset-utils/currency-format';

/**
 * Builds a "nice" Y axis (upper bound + evenly spaced ticks) that scales to the data
 * instead of a fixed ceiling, so real monthly figures are never crushed flat against
 * an oversized axis. Returns a small default range when there is no data.
 */
function buildAxis(maxValue: number): { upper: number; ticks: number[] } {
  if (maxValue <= 0) return { upper: 1, ticks: [0, 0.25, 0.5, 0.75, 1] };

  const rough = maxValue / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const normalized = rough / magnitude;
  const niceFactor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = niceFactor * magnitude;
  const upper = Math.ceil(maxValue / step) * step;

  const ticks: number[] = [];
  for (let value = 0; value <= upper + step / 2; value += step) {
    ticks.push(Math.round(value * 100) / 100);
  }
  return { upper, ticks };
}



/** Declared at module scope so it is not re-created on every render of the chart. */
const TrendTooltip = ({ active, payload, collectedLabel, pendingLabel, tWrapper }: TrendTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
      <p className="font-semibold text-gray-800 mb-2">{payload[0].payload.month}</p>
      <p className="text-blue-600 text-sm">{`${collectedLabel}: ${formatIndianCurrencyAbbreviated(payload[0].value, tWrapper)}`}</p>
      <p className="text-red-600 text-sm">{`${pendingLabel}: ${formatIndianCurrencyAbbreviated(payload[1]?.value, tWrapper)}`}</p>
    </div>
  );
};

const MonthlyRevenueTrendScreen: React.FC<MonthlyRevenueTrendProps> = ({
  data,
  title,
  collectedLabel,
  pendingLabel,
  tWrapper,
}) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const chartData: ChartPoint[] = useMemo(
    () =>
      data.map((point) => ({
        month: point.monthName,
        collected: point.collected,
        pending: point.pending,
      })),
    [data]
  );

  const maxValue = useMemo(
    () => chartData.reduce((max, p) => Math.max(max, p.collected, p.pending), 0),
    [chartData]
  );
  const { upper: upperBound, ticks } = useMemo(() => buildAxis(maxValue), [maxValue]);

  return (
    <div className="w-full h-full bg-white p-6 rounded-xl shadow-sm">
      <h2 className="text-xl font-bold text-gray-800 mb-6">{title}</h2>

      <div className="w-full" style={{ height: '250px' }}>
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={(value: number | string) => formatIndianCurrencyAbbreviated(value, tWrapper)}
                domain={[0, upperBound]}
                ticks={ticks}
              />
              <Tooltip
                content={<TrendTooltip collectedLabel={collectedLabel} pendingLabel={pendingLabel} tWrapper={tWrapper} />}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value: string) => (
                  <span className="text-sm font-medium text-gray-600 ml-2">{value}</span>
                )}
              />

              <Bar
                dataKey="collected"
                name={collectedLabel}
                fill="url(#colorCollected)"
                radius={[8, 8, 0, 0]}
                barSize={40}
              />

              <Line
                type="monotone"
                dataKey="pending"
                name={pendingLabel}
                stroke="#dc2626"
                strokeWidth={3}
                dot={{ fill: '#dc2626', r: 5, strokeWidth: 0 }}
                activeDot={{ r: 7, strokeWidth: 0 }}
              />

              <defs>
                <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={1} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={1} />
                </linearGradient>
              </defs>
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full bg-gray-50 animate-pulse rounded-lg" />
        )}
      </div>
    </div>
  );
};

export default MonthlyRevenueTrendScreen;

