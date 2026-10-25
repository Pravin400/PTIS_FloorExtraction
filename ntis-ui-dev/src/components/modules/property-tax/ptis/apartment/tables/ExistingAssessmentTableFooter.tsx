/* eslint-disable i18next/no-literal-string */
'use client';

import React from 'react';
import { PtisTaxMode } from '@/types/property-tax/apartment';

interface ExistingAssessmentTableFooterProps {
  unitsCount: number;
  totals: {
    cpt: number;
    bua: number;
    rv: number;
    cv: number;
    tax: number;
    rttx: number;
    pen: number;
  };
  taxMode?: PtisTaxMode;
}

export const ExistingAssessmentTableFooter: React.FC<ExistingAssessmentTableFooterProps> = ({ unitsCount, totals, taxMode }) => {
  const showRv = taxMode !== 'capital';
  const showCv = taxMode !== 'rateable';

  return (
    <tfoot className="sticky bottom-0 z-20 shadow-md bg-gradient-to-r from-[#065f46] via-[#047857] to-[#065f46]">
      <tr className="border-t-2 border-emerald-400/80 font-extrabold text-white h-10 border-b border-emerald-900/40">
        <td colSpan={8} className="px-3 py-1 uppercase tracking-wide bg-[#065f46] text-emerald-100 sticky left-0 z-30 border-r border-emerald-700/60 whitespace-nowrap">
          TOTAL ({unitsCount} UNITS)
        </td>
        <td className="px-3 py-1.5 text-right font-mono text-white whitespace-nowrap">{totals.cpt.toLocaleString()}</td>
        <td className="px-3 py-1.5 text-right font-mono text-white whitespace-nowrap">{totals.bua.toLocaleString()}</td>
        <td colSpan={5}></td>
        {showRv && (
          <td className="px-3 py-1.5 text-right font-mono text-white whitespace-nowrap">{totals.rv.toLocaleString()}</td>
        )}
        {showCv && (
          <td className="px-3 py-1.5 text-right font-mono text-white whitespace-nowrap">{totals.cv ? totals.cv.toLocaleString() : '-'}</td>
        )}
        <td className="px-3 py-1.5 text-right font-mono text-white whitespace-nowrap">{totals.tax.toLocaleString()}</td>
        <td colSpan={3}></td>
      </tr>
    </tfoot>
  );
};
