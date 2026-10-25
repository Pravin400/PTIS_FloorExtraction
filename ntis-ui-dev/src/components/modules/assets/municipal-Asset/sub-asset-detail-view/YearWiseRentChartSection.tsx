import { useTranslations } from 'next-intl';
import React from 'react';
import { TrendingUp } from 'lucide-react';
import { SectionCard } from '../asset-detail-view/SectionCard';
import type { YearWiseRentChartSectionProps } from '@/types/asset/municipal-Asset/sub-asset-detail-ui.types';

export function YearWiseRentChartSection({ data }: YearWiseRentChartSectionProps): React.ReactElement {
  const t = useTranslations('subAssetDetail');

  if (!data.yearlyRent || data.yearlyRent.length === 0) {
    return (
      <SectionCard
        title={t('yearWiseRentTitle')}
        titleIcon={<TrendingUp className="w-3.5 h-3.5 text-white" />}
        iconBgClass="bg-indigo-500"
      >
        <div className="w-full flex items-center justify-center min-h-[140px] text-slate-400 text-sm font-medium">
          {t('noDataAvailableStr')}
        </div>
      </SectionCard>
    );
  }

  let minAmount = Math.min(...data.yearlyRent.map((r) => r.amount));
  let maxAmount = Math.max(...data.yearlyRent.map((r) => r.amount));
  const isFlat = maxAmount === minAmount;
  if (isFlat) {
    maxAmount = maxAmount * 1.2 || 100;
    minAmount = minAmount * 0.8 || 0;
  }
  const range = maxAmount - minAmount;
  const topBound = maxAmount + (range * 0.25);
  const botBound = Math.max(0, minAmount - (range * 0.15));
  const actualRange = topBound - botBound;

  const fmt = (n: number) => n >= 100000 ? `${(n / 100000).toFixed(2)}L` : n.toLocaleString('en-IN');

  const svgW = 300;
  const svgH = 140;
  const paddingX = 25;
  const paddingYTop = 30;
  const paddingYBot = 20;

  const usableW = svgW - paddingX * 2;
  const usableH = svgH - paddingYTop - paddingYBot;

  const points = data.yearlyRent.map((item, idx) => {
    const x = paddingX + (idx * (usableW / Math.max(1, data.yearlyRent.length - 1)));
    const yRatio = (item.amount - botBound) / actualRange;
    const y = paddingYTop + usableH - (yRatio * usableH);
    return { x, y, label: fmt(item.amount), year: item.year, rawAmount: item.amount };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${svgH - paddingYBot} L ${points[0].x} ${svgH - paddingYBot} Z`;

  return (
    <SectionCard
      title={t('yearWiseRentTitle')}
      titleIcon={<TrendingUp className="w-3.5 h-3.5 text-white" />}
      iconBgClass="bg-indigo-500"
    >
      <div className="relative w-full overflow-hidden flex flex-col items-center justify-end min-h-[140px] pt-1">
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes drawTrend {
            to { stroke-dashoffset: 0; }
          }
          @keyframes fadeArea {
            to { opacity: 0.15; }
          }
          @keyframes popCircle {
            0% { transform: scale(0); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          .trend-line {
            stroke-dasharray: 1000;
            stroke-dashoffset: 1000;
            animation: drawTrend 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }
          .trend-area {
            opacity: 0;
            animation: fadeArea 1s ease-out 0.8s forwards;
          }
          .trend-point {
            opacity: 0;
            animation: popCircle 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
        `}} />
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full drop-shadow-sm" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="1" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Base Grid line */}
          <line x1={paddingX - 10} y1={svgH - paddingYBot} x2={svgW - paddingX + 10} y2={svgH - paddingYBot} stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />

          {/* Fill Area */}
          <path d={areaPath} fill="url(#trendGradient)" className="trend-area" />

          {/* Connecting Line */}
          <path d={linePath} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="trend-line" filter="url(#glow)" />

          {/* Points & Labels */}
          {isFlat && points.length > 1 ? (
            <>
              {/* Timeline Years */}
              <text x={points[0].x} y={svgH - 6} textAnchor="middle" className="text-[8px] font-bold fill-slate-500">{points[0].year}</text>
              <text x={points[points.length - 1].x} y={svgH - 6} textAnchor="middle" className="text-[8px] font-bold fill-slate-500">{points[points.length - 1].year}</text>

              {/* Centered Point & Label */}
              <g
                className="trend-point group cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 focus:ring-offset-white rounded-full"
                style={{ animationDelay: '0.4s', transformOrigin: `${svgW / 2}px ${svgH / 2}px` }}
                tabIndex={0}
                role="tooltip"
                aria-label={`${t('fixedRent') || 'Fixed Rent'}: ${points[0].label}`}
              >
                <circle cx={svgW / 2} cy={points[0].y} r="25" fill="transparent" />
                <line x1={svgW / 2} y1={points[0].y} x2={svgW / 2} y2={svgH - paddingYBot} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" className="opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300" />
                <circle cx={svgW / 2} cy={points[0].y} r="9" fill="#4f46e5" className="opacity-0 group-hover:opacity-20 group-focus:opacity-20 transition-opacity duration-300" />
                <circle cx={svgW / 2} cy={points[0].y} r="4.5" fill="#fff" stroke="#4f46e5" strokeWidth="2" className="transition-colors duration-300 group-hover:stroke-[#312e81] group-focus:stroke-[#312e81]" />
                <text x={svgW / 2} y={points[0].y - 12} textAnchor="middle" fill="#312e81" className="text-[11px] font-black transition-transform duration-300 ease-out group-hover:-translate-y-1 group-focus:-translate-y-1">{points[0].label}</text>
                <text x={svgW / 2} y={svgH - 6} textAnchor="middle" className="text-[8px] font-bold fill-slate-500 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300">{t('fixedRent') || 'Fixed Rent'}</text>
              </g>
            </>
          ) : (
            points.map((p, i) => {
              const prev = points[i - 1];
              const next = points[i + 1];

              // Hide this point if it's sandwiched between two identical values
              const isRedundant = prev && next && prev.rawAmount === p.rawAmount && next.rawAmount === p.rawAmount;

              if (isRedundant) return null;

              return (
                <g
                  key={i}
                  className="trend-point group cursor-pointer focus:outline-none"
                  style={{ animationDelay: `${0.3 + (i * 0.15)}s`, transformOrigin: `${p.x}px ${p.y}px` }}
                  tabIndex={0}
                  role="tooltip"
                  aria-label={`Year ${p.year}, Rent: ${p.label}`}
                >
                  {/* Invisible Hit Area */}
                  <circle cx={p.x} cy={p.y} r="25" fill="transparent" />

                  {/* Drop line */}
                  <line x1={p.x} y1={p.y} x2={p.x} y2={svgH - paddingYBot} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" className="opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300" />

                  {/* Outer Glow on hover */}
                  <circle cx={p.x} cy={p.y} r="9" fill="#4f46e5" className="opacity-0 group-hover:opacity-20 group-focus:opacity-20 transition-opacity duration-300" />

                  {/* Main Point */}
                  <circle cx={p.x} cy={p.y} r="4.5" fill="#fff" stroke="#4f46e5" strokeWidth="2" className="transition-colors duration-300 group-hover:stroke-[#312e81] group-focus:stroke-[#312e81]" />

                  {/* Label text floating up */}
                  <text x={p.x} y={p.y - 12} textAnchor="middle" fill="#312e81" className="text-[10px] font-black transition-transform duration-300 ease-out group-hover:-translate-y-1 group-focus:-translate-y-1" style={{ transformOrigin: `${p.x}px ${p.y}px` }}>{p.label}</text>

                  {/* Year text highlighting */}
                  <text x={p.x} y={svgH - 6} textAnchor="middle" className="text-[8px] font-bold fill-slate-500 transition-colors duration-300 group-hover:fill-[#312e81] group-focus:fill-[#312e81]">{p.year}</text>
                </g>
              );
            })
          )}
        </svg>
      </div>
    </SectionCard>
  );
}

