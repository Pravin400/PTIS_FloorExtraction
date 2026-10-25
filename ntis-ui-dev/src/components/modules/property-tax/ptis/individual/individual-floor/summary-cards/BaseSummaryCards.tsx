'use client';

import React from 'react';
import { Home, Building2, BarChart3, TrendingUp, TrendingDown, ShieldCheck, Scaling } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Tooltip } from '@/components/common/Tooltip';
import { TruncatedValue } from './TruncatedValue';

export const AreaSummaryCard: React.FC<{
  label: string;
  oldLabel: string;
  newLabel: string;
  oldArea: number;
  newArea: number;
  hasCompArea: boolean;
  changeArea: number;
}> = ({ label, oldLabel, newLabel, oldArea, newArea, hasCompArea, changeArea }) => (
  <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 px-3 shadow-2xs hover:shadow-xs transition-all flex items-center gap-2.5 min-w-0 w-full h-full">
    <div className="w-8.5 h-8.5 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
      <Scaling className="w-4 h-4 text-blue-600" />
    </div>
    <div className="h-7 w-[1px] bg-slate-200 shrink-0" />
    <div className="flex flex-col min-w-0 flex-1 justify-center gap-0.5">
      <div className="flex items-center justify-between gap-1.5 min-w-0">
        <span className="text-xs font-black text-slate-900 tracking-wide uppercase truncate">{label}</span>
        {hasCompArea && changeArea !== 0 && (
          <div className="shrink-0 ml-auto">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100 shadow-2xs leading-none whitespace-nowrap">
              {changeArea < 0 ? <TrendingDown className="w-3 h-3 text-blue-600 shrink-0" /> : <TrendingUp className="w-3 h-3 text-blue-600 shrink-0" />}
              <span>{changeArea > 0 ? `+${changeArea.toFixed(2)}` : `${changeArea.toFixed(2)}`}</span>
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2.5 text-[11px] font-semibold text-slate-600 flex-wrap">
        <span className="whitespace-nowrap">
          <span className="text-slate-500 font-semibold">{oldLabel} </span>
          <TruncatedValue value={oldArea > 0 ? Number(oldArea).toFixed(2) : '-'} className="font-bold text-slate-700" />
        </span>
        <span className="whitespace-nowrap">
          <span className="text-slate-500 font-semibold">{newLabel} </span>
          <TruncatedValue value={newArea > 0 ? Number(newArea).toFixed(2) : '-'} className="font-black text-slate-900" />
        </span>
      </div>
    </div>
  </div>
);

export const ChangesOfUseSummaryCard: React.FC<{
  label: string;
  oldLabel: string;
  newLabel: string;
  yesLabel: string;
  noLabel: string;
  oldUse: string;
  newUse: string;
  isUseUpdated: boolean;
}> = ({ label, oldLabel, newLabel, yesLabel, noLabel, oldUse, newUse, isUseUpdated }) => (
  <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 px-3 shadow-2xs hover:shadow-xs transition-all flex items-center gap-2.5 min-w-0 w-full h-full">
    <div className="w-8.5 h-8.5 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
      <Home className="w-4 h-4 text-emerald-600" />
    </div>
    <div className="h-7 w-[1px] bg-slate-200 shrink-0" />
    <div className="flex flex-col min-w-0 flex-1 justify-center gap-0.5">
      <div className="flex items-center justify-between gap-1.5 min-w-0">
        <span className="text-xs font-black text-slate-900 tracking-wide uppercase truncate">{label}</span>
        <div className="shrink-0 ml-auto">
          <Tooltip
            content={<div className="whitespace-nowrap font-bold text-xs">{`${label}: ${isUseUpdated ? yesLabel : noLabel}`}</div>}
            placement="top"
          >
            <span
              tabIndex={0}
              aria-label={`${label}: ${isUseUpdated ? yesLabel : noLabel}`}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border shadow-2xs leading-none whitespace-nowrap cursor-default transition-colors hover:opacity-80',
                isUseUpdated ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200'
              )}
            >
              <ShieldCheck className={cn('w-3 h-3 shrink-0', isUseUpdated ? 'text-emerald-600' : 'text-slate-400')} />
              <span>{isUseUpdated ? yesLabel : noLabel}</span>
            </span>
          </Tooltip>
        </div>
      </div>
      <div className="flex items-center gap-2.5 text-[11px] font-semibold text-slate-600 flex-wrap">
        <span className="whitespace-nowrap">
          <span className="text-slate-500 font-semibold">{oldLabel} </span>
          <TruncatedValue value={oldUse} alwaysShowTooltip className="font-bold text-slate-700" />
        </span>
        <span className="whitespace-nowrap">
          <span className="text-slate-500 font-semibold">{newLabel} </span>
          <TruncatedValue value={newUse} alwaysShowTooltip className="font-black text-slate-900" />
        </span>
      </div>
    </div>
  </div>
);

export const AlvSummaryCard: React.FC<{
  label: string;
  oldLabel: string;
  newLabel: string;
  displayOldAlv: string;
  displayNewAlv: string;
  delta: string;
}> = ({ label, oldLabel, newLabel, displayOldAlv, displayNewAlv, delta }) => (
  <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 px-3 shadow-2xs hover:shadow-xs transition-all flex items-center gap-2.5 min-w-0 w-full h-full">
    <div className="w-8.5 h-8.5 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
      <Building2 className="w-4 h-4 text-emerald-600" />
    </div>
    <div className="h-7 w-[1px] bg-slate-200 shrink-0" />
    <div className="flex flex-col min-w-0 flex-1 justify-center gap-0.5">
      <div className="flex items-center justify-between gap-1.5 min-w-0">
        <span className="text-xs font-black text-slate-900 tracking-wide uppercase truncate">{label}</span>
        <div className="shrink-0 ml-auto">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-2xs leading-none whitespace-nowrap">
            <BarChart3 className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>{delta}</span>
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2.5 text-[11px] font-semibold text-slate-600 flex-wrap">
        <span className="whitespace-nowrap">
          <span className="text-slate-500 font-semibold">{oldLabel} </span>
          <TruncatedValue value={displayOldAlv} className="font-bold text-slate-700" />
        </span>
        <span className="whitespace-nowrap">
          <span className="text-slate-500 font-semibold">{newLabel} </span>
          <TruncatedValue value={displayNewAlv} className="font-black text-slate-900" />
        </span>
      </div>
    </div>
  </div>
);
