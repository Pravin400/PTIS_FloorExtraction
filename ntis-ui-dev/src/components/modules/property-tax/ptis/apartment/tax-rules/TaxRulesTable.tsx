/* eslint-disable i18next/no-literal-string */
'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface RuleDisplayRow {
  id: string;
  ruleCode: string;
  name: string;
  level: string;
  description: string;
  useGroup: string;
  beforeRate: string;
  change: string;
  revisedRate: string;
  beforeTax: number;
  taxImpact: number;
  revisedTax: number;
  isApplied: boolean;
}

interface TaxRulesTableProps {
  rules: RuleDisplayRow[];
}

export const TaxRulesTable: React.FC<TaxRulesTableProps> = ({ rules }) => {
  if (rules.length === 0) {
    return (
      <div className="py-14 flex flex-col items-center justify-center gap-3 text-slate-500 bg-slate-50/70 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="text-center">
          <h4 className="text-sm font-bold text-slate-800">No Taxation Rules Applied</h4>
          <p className="text-xs text-slate-500 mt-0.5">There are no special surcharge or reduction rules mapped to this unit.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider sticky top-0 bg-white z-10">
            <th className="py-2.5 px-3 w-48">RULE</th>
            <th className="py-2.5 px-2 text-center w-20">LEVEL</th>
            <th className="py-2.5 px-3 w-72">DESCRIPTION</th>
            <th className="py-2.5 px-2 text-center w-20">USE GROUP</th>
            <th className="py-2.5 px-2 text-right w-20">BEFORE RATE</th>
            <th className="py-2.5 px-2 text-center w-20">CHANGE</th>
            <th className="py-2.5 px-2 text-right w-24">REVISED RATE</th>
            <th className="py-2.5 px-2 text-right w-24">BEFORE TAX</th>
            <th className="py-2.5 px-2 text-right w-24">TAX IMPACT</th>
            <th className="py-2.5 px-3 text-right w-24">REVISED TAX</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-800 bg-white">
          {rules.map((rule) => (
            <tr
              key={rule.id}
              className={cn(
                'hover:bg-blue-50/40 transition-colors',
                rule.isApplied && 'bg-rose-50/20'
              )}
            >
              <td className="py-2.5 px-3 font-bold text-slate-900">{rule.ruleCode}</td>
              <td className="py-2.5 px-2 text-center">
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs',
                    rule.level.toLowerCase().includes('wing') && 'bg-purple-50 text-purple-700 border-purple-200',
                    rule.level.toLowerCase().includes('apartment') && 'bg-blue-50 text-blue-700 border-blue-200',
                    rule.level.toLowerCase().includes('unit') && 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  )}
                >
                  {rule.level}
                </span>
              </td>
              <td className="py-2.5 px-3 text-slate-600 text-[11px] leading-tight">
                {rule.description}
              </td>
              <td className="py-2.5 px-2 text-center">
                <span
                  className={cn(
                    'font-bold text-xs',
                    rule.useGroup === 'All' ? 'text-blue-600' : 'text-slate-600'
                  )}
                >
                  {rule.useGroup}
                </span>
              </td>
              <td className="py-2.5 px-2 text-right font-mono text-slate-600">{rule.beforeRate}</td>
              <td className="py-2.5 px-2 text-center font-mono">
                {rule.change !== '—' ? (
                  <span className={cn("font-extrabold", rule.change.startsWith('+') ? "text-rose-600" : "text-emerald-600")}>
                    {rule.change}
                  </span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
              <td className="py-2.5 px-2 text-right font-mono">
                {rule.revisedRate !== '—' ? (
                  <span className="font-bold text-slate-900">{rule.revisedRate}</span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
              <td className="py-2.5 px-2 text-right font-mono font-medium">
                ₹{rule.beforeTax.toLocaleString()}
              </td>
              <td className="py-2.5 px-2 text-right font-mono">
                {rule.taxImpact > 0 ? (
                  <span className="font-extrabold text-rose-600">
                    +₹{rule.taxImpact.toLocaleString()}
                  </span>
                ) : rule.taxImpact < 0 ? (
                  <span className="font-extrabold text-emerald-600">
                    -₹{Math.abs(rule.taxImpact).toLocaleString()}
                  </span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                ₹{rule.revisedTax.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
