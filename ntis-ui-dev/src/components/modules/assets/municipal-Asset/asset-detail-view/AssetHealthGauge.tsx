import React from 'react';

/** SVG Arch Gauge for Asset Health */
export function AssetHealthGauge({
  value,
  max,
  healthLabel,
}: {
  value: number;
  max: number;
  healthLabel: string;
}): React.ReactElement {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = max > 0 ? circumference - (value / max) * circumference : circumference;

  return (
    <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-lg px-3 py-1 min-w-[110px] h-full shadow-sm">
      <div className="relative w-[60px] h-[60px] flex items-center justify-center mt-0.5">
        <svg viewBox="0 0 100 100" className="absolute top-0 left-0 w-full h-full transform -rotate-90 drop-shadow-sm">
          <defs>
            <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" /> {/* light blue */}
              <stop offset="100%" stopColor="#2563eb" /> {/* deeper blue */}
            </linearGradient>
          </defs>
          {/* Background circle */}
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="7" />
          {/* Foreground progress circle */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="url(#healthGradient)"
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="flex flex-col items-center justify-center relative z-10 w-full h-full pt-[2px]">
          <div className="flex items-baseline justify-center">
            <span className="text-[14px] font-black text-slate-800 leading-none tracking-tight">{value}</span>
            <span className="text-[8px] text-slate-400 font-bold leading-none ml-[1px]">/{max}</span>
          </div>
        </div>
      </div>
      <span className="text-[10px] font-extrabold text-blue-900 mt-1 text-center tracking-tight">{healthLabel}</span>
    </div>
  );
}
