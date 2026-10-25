/* eslint-disable i18next/no-literal-string */
'use client';

import React from 'react';
import { PtisTaxMode } from '@/types/property-tax/apartment';

interface NewSurveyTableFooterProps {
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

export const NewSurveyTableFooter: React.FC<NewSurveyTableFooterProps> = ({ unitsCount, totals, taxMode }) => {
  const showRv = taxMode !== 'capital';
  const showCv = taxMode !== 'rateable';

  return (
    <tfoot className="sticky bottom-0 z-20 shadow-md bg-gradient-to-r from-[#1e3a8a] via-[#1d4ed8] to-[#1e3a8a]">
      <tr className="border-t-2 border-blue-400/80 font-extrabold text-white h-10 border-b border-blue-900/40">
        <td colSpan={10} className="px-3 py-1 uppercase tracking-wide bg-[#1e3a8a] text-blue-100 sticky left-0 z-30 border-r border-blue-700/60 whitespace-nowrap">
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
