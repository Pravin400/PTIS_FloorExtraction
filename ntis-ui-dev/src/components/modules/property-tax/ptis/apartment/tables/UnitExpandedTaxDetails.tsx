/* eslint-disable i18next/no-literal-string */
'use client';

import React, { useEffect, useState } from 'react';
import { fetchUnitTaxDetailsAction } from '@/app/[locale]/property-tax/ptis/apartment/action';
import type { TaxDetailsData } from '@/types/ptisMain-taxdetails.types';
import { PtisTaxMode } from '@/types/property-tax/apartment';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface UnitExpandedTaxDetailsProps {
  propertyId: number | string | undefined;
  taxMode?: PtisTaxMode;
}

function getTaxHeadStyle(name: string) {
  const n = name.toLowerCase();
  if (n.includes('general') || n.includes('property')) {
    return { chip: 'bg-indigo-50/90 border-indigo-200 text-indigo-950', amount: 'text-indigo-950 font-black' };
  }
  if (n.includes('water')) {
    return { chip: 'bg-sky-50/90 border-sky-200 text-sky-950', amount: 'text-sky-950 font-black' };
  }
  if (n.includes('fire')) {
    return { chip: 'bg-rose-50/90 border-rose-200 text-rose-950', amount: 'text-rose-950 font-black' };
  }
  if (n.includes('tree') || n.includes('drain') || n.includes('conservancy')) {
    return { chip: 'bg-emerald-50/90 border-emerald-200 text-emerald-950', amount: 'text-emerald-950 font-black' };
  }
  if (n.includes('edu') || n.includes('cess') || n.includes('road')) {
    return { chip: 'bg-purple-50/90 border-purple-200 text-purple-950', amount: 'text-purple-950 font-black' };
  }
  if (n.includes('surch') || n.includes('pen') || n.includes('light')) {
    return { chip: 'bg-amber-50/90 border-amber-200 text-amber-950', amount: 'text-amber-950 font-black' };
  }
  return { chip: 'bg-white border-zinc-200 text-zinc-900', amount: 'text-zinc-950 font-black' };
}

export const UnitExpandedTaxDetails: React.FC<UnitExpandedTaxDetailsProps> = ({
  propertyId,
  taxMode = 'rateable',
}) => {
  const [loading, setLoading] = useState(() => Boolean(propertyId));
  const [taxData, setTaxData] = useState<{
    rateable?: TaxDetailsData;
    capital?: TaxDetailsData;
  }>({});

  useEffect(() => {
    if (!propertyId) return;
    let isMounted = true;

    fetchUnitTaxDetailsAction(propertyId)
      .then((res) => {
        if (isMounted && res.success) {
          setTaxData({ rateable: res.rateable, capital: res.capital });
        }
      })
      .catch((err) => console.error('Failed to load unit tax breakdown', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [propertyId]);

  const activePolicy = taxMode === 'rateable' ? taxData.rateable?.policies?.[0] : taxData.capital?.policies?.[0];
  const taxHeads = activePolicy?.taxAmounts || [];
  const taxTotal = activePolicy?.taxTotal || 0;

  return (
    <div className="px-2.5 py-1 rounded-lg border border-zinc-200/90 bg-slate-50/90 text-xs font-sans shadow-2xs overflow-hidden h-full flex items-center">
      {/* Optimized Single-Row Color-Coded Bold Taxes Strip */}
      {loading ? (
        <div className="py-1 flex items-center gap-2 text-zinc-600 text-xs font-medium">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
          <span>Fetching {taxMode === 'rateable' ? 'Rateable' : 'Capital'} tax breakdown...</span>
        </div>
      ) : taxHeads.length === 0 ? (
        <div className="py-1 text-[11px] text-zinc-400 italic">
          No {taxMode === 'rateable' ? 'Rateable (RV)' : 'Capital (CV)'} tax heads configured for this unit.
        </div>
      ) : (
        <div className="w-full flex items-center justify-between gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
          <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
            {taxHeads.map((head, idx) => {
              const style = getTaxHeadStyle(head.taxName);
              return (
                <div
                  key={idx}
                  className={cn(
                    'px-2 py-0.5 rounded-md border shadow-2xs text-[10px] flex items-center gap-1.5 shrink-0',
                    style.chip
                  )}
                >
                  <span className="font-medium opacity-90">{head.taxName}:</span>
                  <span className={cn('font-mono text-[11px]', style.amount)}>
                    ₹{head.taxAmount.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Prominent High-Contrast Bold Total Badge */}
          <div className="shrink-0 px-3 py-1 rounded-md bg-[#16143c] text-white shadow-xs border border-indigo-950 flex items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-wider text-indigo-200 font-bold">
              {taxMode === 'rateable' ? 'RV TOTAL' : 'CV TOTAL'}:
            </span>
            <span className="font-mono text-xs font-black text-amber-300">
              ₹{taxTotal.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
