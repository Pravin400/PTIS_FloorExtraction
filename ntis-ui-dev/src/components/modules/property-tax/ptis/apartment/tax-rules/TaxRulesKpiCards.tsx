/* eslint-disable i18next/no-literal-string */
'use client';

import React from 'react';

interface TaxRulesKpiCardsProps {
  activeTab: 'rules' | 'discounts' | 'retro';
  baseValue: number;
  totalSurcharge: number;
  totalReduction: number;
  cumulativeFinalTax: number;
  netImpact: number;
  // Discounts tab
  discountPercentageBenefit?: number;
  discountFixedBenefit?: number;
  discountTotalBenefit?: number;
  discountFinalTax?: number;
  // Retro tab
  retroYearsCount?: number;
  retroTotalInterest?: number;
  retroGrandTotal?: number;
}

export const TaxRulesKpiCards: React.FC<TaxRulesKpiCardsProps> = ({
  activeTab,
  baseValue,
  totalSurcharge,
  totalReduction,
  cumulativeFinalTax,
  netImpact,
  discountPercentageBenefit = 0,
  discountFixedBenefit = 0,
  discountTotalBenefit = 0,
  discountFinalTax = 0,
  retroYearsCount = 0,
  retroTotalInterest = 0,
  retroGrandTotal = 0,
}) => {
  if (activeTab === 'discounts') {
    return (
      <div className="px-6 py-3.5 grid grid-cols-5 gap-3 bg-white border-b border-slate-100">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            TAX BEFORE DISCOUNTS
          </span>
          <span className="text-lg font-black text-slate-900 font-mono mt-0.5 block">
            ₹{baseValue.toLocaleString()}
          </span>
        </div>

        <div className="p-3 bg-emerald-50/20 rounded-xl border border-emerald-300 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
            % BENEFIT
          </span>
          <span className="text-lg font-black text-emerald-600 font-mono mt-0.5 block">
            ₹{discountPercentageBenefit.toLocaleString()}
          </span>
        </div>

        <div className="p-3 bg-blue-50/20 rounded-xl border border-blue-300 shadow-2xs">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
            FIXED BENEFIT
          </span>
          <span className="text-lg font-black text-blue-600 font-mono mt-0.5 block">
            ₹{discountFixedBenefit.toLocaleString()}
          </span>
        </div>

        <div className="p-3 bg-emerald-50/30 rounded-xl border border-emerald-300 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
            TOTAL BENEFIT
          </span>
          <span className="text-lg font-black text-emerald-600 font-mono mt-0.5 block">
            ₹{discountTotalBenefit.toLocaleString()}
          </span>
        </div>

        <div className="p-3 bg-indigo-50/30 rounded-xl border border-indigo-200 shadow-2xs flex items-center justify-between">
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
            FINAL PAYABLE TAX
          </span>
          <span className="px-2.5 py-1 rounded-md text-xs font-black bg-indigo-100 text-indigo-700 border border-indigo-200 font-mono">
            ₹{discountFinalTax.toLocaleString()}
          </span>
        </div>
      </div>
    );
  }

  if (activeTab === 'retro') {
    return (
      <div className="px-6 py-3.5 grid grid-cols-4 gap-3 bg-white border-b border-slate-100">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            ANNUAL BASE TAX
          </span>
          <span className="text-lg font-black text-slate-900 font-mono mt-0.5 block">
            ₹{baseValue.toLocaleString()}
          </span>
        </div>

        <div className="p-3 bg-amber-50/20 rounded-xl border border-amber-300 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
            RETROSPECTIVE YEARS
          </span>
          <span className="text-lg font-black text-amber-800 mt-0.5 block">
            {retroYearsCount} Financial Years
          </span>
        </div>

        <div className="p-3 bg-rose-50/20 rounded-xl border border-rose-200 shadow-2xs">
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
            TOTAL INTEREST (24% P.A.)
          </span>
          <span className="text-lg font-black text-rose-600 font-mono mt-0.5 block">
            ₹{retroTotalInterest.toLocaleString()}
          </span>
        </div>

        <div className="p-3 bg-blue-50/20 rounded-xl border border-blue-200 shadow-2xs">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
            GRAND TOTAL RETRO TAX
          </span>
          <span className="text-lg font-black text-blue-700 font-mono mt-0.5 block">
            ₹{retroGrandTotal.toLocaleString()}
          </span>
        </div>
      </div>
    );
  }

  // Default: activeTab === 'rules' (Image 3)
  return (
    <div className="px-6 py-3.5 grid grid-cols-5 gap-3 bg-white border-b border-slate-100">
      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          TAX BEFORE RULES
        </span>
        <span className="text-lg font-black text-slate-900 font-mono mt-0.5 block">
          ₹{baseValue.toLocaleString()}
        </span>
      </div>

      <div className="p-3 bg-amber-50/20 rounded-xl border border-amber-200 shadow-2xs">
        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
          TOTAL SURCHARGE
        </span>
        <span className="text-lg font-black text-amber-600 font-mono mt-0.5 block">
          +₹{totalSurcharge.toLocaleString()}
        </span>
      </div>

      <div className="p-3 bg-emerald-50/20 rounded-xl border border-emerald-200 shadow-2xs">
        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
          TOTAL REDUCTION
        </span>
        <span className="text-lg font-black text-emerald-600 font-mono mt-0.5 block">
          -₹{totalReduction.toLocaleString()}
        </span>
      </div>

      <div className="p-3 bg-blue-50/20 rounded-xl border border-blue-200 shadow-2xs">
        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
          FINAL TAX
        </span>
        <span className="text-lg font-black text-blue-600 font-mono mt-0.5 block">
          ₹{cumulativeFinalTax.toLocaleString()}
        </span>
      </div>

      <div className="p-3 bg-amber-50/20 rounded-xl border border-amber-200 shadow-2xs flex items-center justify-between">
        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
          NET IMPACT
        </span>
        <span className="px-2.5 py-1 rounded-md text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 font-mono">
          {netImpact >= 0 ? `+₹${netImpact.toLocaleString()}` : `-₹${Math.abs(netImpact).toLocaleString()}`}
        </span>
      </div>
    </div>
  );
};
