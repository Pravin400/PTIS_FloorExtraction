/* eslint-disable i18next/no-literal-string */
'use client';

import React from 'react';
import { History, Loader2 } from 'lucide-react';

export interface RetroTaxRow {
  financialYear: string;
  retroAgeMonths: number;
  baseTax: number;
  surcharges: number;
  interestPenaltyRateStr: string;
  interestPenaltyAmt: number;
  yearlyNetTotal: number;
}

interface TaxRulesRetroTableProps {
  rows: RetroTaxRow[];
  loading?: boolean;
}

export const TaxRulesRetroTable: React.FC<TaxRulesRetroTableProps> = ({ rows, loading }) => {
  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-500 bg-slate-50/70 rounded-xl border border-slate-200">
        <Loader2 className="w-7 h-7 animate-spin text-amber-600" />
        <p className="text-xs font-semibold text-slate-700">Fetching retrospective tax details...</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="py-14 flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <History className="w-8 h-8 text-slate-300" />
        <p className="text-xs font-medium">No retrospective assessment data available for this unit.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider sticky top-0 bg-white z-10">
              <th className="py-2.5 px-3">FINANCIAL YEAR</th>
              <th className="py-2.5 px-2 text-center">RETRO AGE</th>
              <th className="py-2.5 px-2 text-right">BASE TAX (₹)</th>
              <th className="py-2.5 px-2 text-right">SURCHARGES (10%)</th>
              <th className="py-2.5 px-2 text-center">INTEREST PENALTY RATE</th>
              <th className="py-2.5 px-2 text-right">INTEREST PENALTY (₹)</th>
              <th className="py-2.5 px-3 text-right">YEARLY NET TOTAL (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {rows.map((row) => (
              <tr key={row.financialYear} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2.5 px-3 font-bold text-slate-900">{row.financialYear}</td>
                <td className="py-2.5 px-2 text-center">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    {row.retroAgeMonths} Months
                  </span>
                </td>
                <td className="py-2.5 px-2 text-right font-mono text-slate-800">
                  ₹{row.baseTax.toLocaleString()}
                </td>
                <td className="py-2.5 px-2 text-right font-mono text-slate-800">
                  +₹{row.surcharges.toLocaleString()}
                </td>
                <td className="py-2.5 px-2 text-center font-bold text-rose-600 text-[11px]">
                  {row.interestPenaltyRateStr}
                </td>
                <td className="py-2.5 px-2 text-right font-mono font-bold text-rose-600">
                  +₹{row.interestPenaltyAmt.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-950">
                  ₹{row.yearlyNetTotal.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assessment Rule Reference Yellow Box from Image 1 */}
      <div className="mt-4 p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl text-left text-slate-700 shadow-2xs">
        <h5 className="font-extrabold text-xs text-amber-950">Assessment Rule Reference:</h5>
        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
          Under Maharashtra Municipal Corporations Act Section 129A, retrospective taxes are assessed with a compound interest rate of 2% per month (24% per annum) calculated from the date on which the tax originally became due. Lift surcharges and other amenity-based taxes apply to all past periods of actual occupancy or construction completion.
        </p>
      </div>
    </div>
  );
};
