'use client';

import React from 'react';
import { UserCheck, Percent, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { TruncatedValue } from './TruncatedValue';

export const ValuationMethodSummaryCard: React.FC<{
  title: string;
  isDualMode: boolean;
  label1: string;
  value1: string;
  label2: string;
  value2: string;
  value2Class: string;
  deltaLabel: string;
  isNegativeDelta: boolean;
}> = ({ title, isDualMode, label1, value1, label2, value2, value2Class, deltaLabel, isNegativeDelta }) => (
  <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 px-3 shadow-2xs hover:shadow-xs transition-all flex items-center gap-2.5 min-w-0 w-full h-full">
    <div className="w-8.5 h-8.5 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
      {isDualMode ? <Scale className="w-4 h-4 text-purple-600" /> : <UserCheck className="w-4 h-4 text-purple-600" />}
    </div>
    <div className="h-7 w-[1px] bg-slate-200 shrink-0" />
    <div className="flex flex-col min-w-0 flex-1 justify-center gap-0.5">
      <div className="flex items-center justify-between gap-1.5 min-w-0">
        <span className="text-xs font-black text-slate-900 tracking-wide uppercase truncate">{title}</span>
        <div className="shrink-0 ml-auto">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-100 shadow-2xs leading-none whitespace-nowrap">
            {isNegativeDelta ? <TrendingDown className="w-3 h-3 text-purple-600 shrink-0" /> : <TrendingUp className="w-3 h-3 text-purple-600 shrink-0" />}
            <span>{deltaLabel}</span>
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2.5 text-[11px] font-semibold text-slate-600 flex-wrap">
        <span className="whitespace-nowrap">
          <span className="text-slate-500 font-semibold">{label1} </span>
          <TruncatedValue value={value1} className="font-bold text-slate-700" />
        </span>
        <span className="whitespace-nowrap">
          <span className="text-slate-500 font-semibold">{label2} </span>
          <TruncatedValue value={value2} className={value2Class} />
        </span>
      </div>
    </div>
  </div>
);

export const TaxSummaryCard: React.FC<{
  title: string;
  label1: string;
  value1: string;
  label2: string;
  value2: string;
  value2Class: string;
  deltaLabel: string;
}> = ({ title, label1, value1, label2, value2, value2Class, deltaLabel }) => (
  <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 px-3 shadow-2xs hover:shadow-xs transition-all flex items-center gap-2.5 min-w-0 w-full h-full">
    <div className="w-8.5 h-8.5 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
      <Percent className="w-4 h-4 text-rose-600" />
    </div>
    <div className="h-7 w-[1px] bg-slate-200 shrink-0" />
    <div className="flex flex-col min-w-0 flex-1 justify-center gap-0.5">
      <div className="flex items-center justify-between gap-1.5 min-w-0">
        <span className="text-xs font-black text-slate-900 tracking-wide uppercase truncate">{title}</span>
        <div className="shrink-0 ml-auto">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-100 shadow-2xs leading-none whitespace-nowrap">
            <TrendingUp className="w-3 h-3 text-rose-600 shrink-0" />
            <span>{deltaLabel}</span>
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2.5 text-[11px] font-semibold text-slate-600 flex-wrap">
        <span className="whitespace-nowrap">
          <span className="text-slate-500 font-semibold">{label1} </span>
          <TruncatedValue value={value1} className="font-bold text-slate-700" />
        </span>
        <span className="whitespace-nowrap">
          <span className="text-slate-500 font-semibold">{label2} </span>
          <TruncatedValue value={value2} className={value2Class} />
        </span>
      </div>
    </div>
  </div>
);
