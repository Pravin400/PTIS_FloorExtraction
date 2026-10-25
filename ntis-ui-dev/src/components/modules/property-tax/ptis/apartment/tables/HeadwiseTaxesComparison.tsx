/* eslint-disable i18next/no-literal-string */
'use client';

import React from 'react';

export interface TaxHeadAmountItem {
  taxName: string;
  taxAmount: number;
  displayOrder?: number;
}

export interface HeadwiseTaxesComparisonProps {
  rvTaxAmounts?: TaxHeadAmountItem[];
  cvTaxAmounts?: TaxHeadAmountItem[];
  oldTaxAmounts?: TaxHeadAmountItem[];
}

const formatVal = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return new Intl.NumberFormat('en-IN').format(val);
};

const getTaxAmount = (list: TaxHeadAmountItem[], taxName: string): number => {
  const item = list.find((t) => t && t.taxName === taxName);
  return item ? (item.taxAmount ?? 0) : 0;
};

export const HeadwiseTaxesComparison: React.FC<HeadwiseTaxesComparisonProps> = ({
  rvTaxAmounts = [],
  cvTaxAmounts = [],
  oldTaxAmounts = [],
}) => {
  const allHeads = React.useMemo(() => {
    const headSet = new Set<string>();
    [...rvTaxAmounts, ...cvTaxAmounts, ...oldTaxAmounts].forEach((t) => {
      if (t?.taxName) headSet.add(t.taxName);
    });
    return Array.from(headSet);
  }, [rvTaxAmounts, cvTaxAmounts, oldTaxAmounts]);

  if (allHeads.length === 0) return null;

  return (
    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 mt-3">
      <h4 className="text-xs font-bold text-slate-800 uppercase mb-2">Tax Breakdown Comparison</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-semibold">
              <th className="pb-1.5 font-medium">Tax Head</th>
              <th className="pb-1.5 text-right font-medium">Existing (Old)</th>
              <th className="pb-1.5 text-right font-medium">Rateable (RV)</th>
              <th className="pb-1.5 text-right font-medium">Capital (CV)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {allHeads.map((head) => {
              const oldAmt = getTaxAmount(oldTaxAmounts, head);
              const rvAmt = getTaxAmount(rvTaxAmounts, head);
              const cvAmt = getTaxAmount(cvTaxAmounts, head);
              return (
                <tr key={head} className="hover:bg-slate-100/50">
                  <td className="py-1 text-slate-700">{head}</td>
                  <td className="py-1 text-right font-mono text-slate-600">₹{formatVal(oldAmt)}</td>
                  <td className="py-1 text-right font-mono text-slate-800">₹{formatVal(rvAmt)}</td>
                  <td className="py-1 text-right font-mono text-indigo-700">₹{formatVal(cvAmt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
