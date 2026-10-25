'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ChevronRight, Loader2 } from 'lucide-react';
import {
  ApartmentDemandDetailsItem,
  DemandTaxHeadItem,
} from '@/types/property-tax/apartment';

export interface ApartmentDemandSubTableProps {
  rowPolicyCode: string;
  uniqueTaxNames: string[];
  demandItem?: ApartmentDemandDetailsItem | null;
  isLoading?: boolean;
}

const formatVal = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return new Intl.NumberFormat('en-IN').format(val);
};

export const ApartmentDemandSubTable: React.FC<ApartmentDemandSubTableProps> = ({
  rowPolicyCode,
  uniqueTaxNames,
  demandItem,
  isLoading = false,
}) => {
  const t = useTranslations('appartmentQC');

  if (isLoading) {
    return (
      <tr key={`${rowPolicyCode}-loading`} className="bg-slate-100/90 border-b border-zinc-200">
        <td colSpan={uniqueTaxNames.length + 1} className="p-3 text-center text-blue-700 font-semibold text-xs border border-zinc-200 bg-slate-100/90">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-700" />
            <span>{t('taxDetails.loadingDetails')}</span>
          </div>
        </td>
      </tr>
    );
  }

  const subTaxes = demandItem?.yearWiseTaxes || demandItem?.demandTaxes || [];

  if (subTaxes.length > 0) {
    const allSubRows: { pCode: string; subMap: Map<string, number>; gIdx: number; pIdx: number }[] = [];

    subTaxes.forEach((demandGroup, gIdx) => {
      const demandHeads: DemandTaxHeadItem[] = demandGroup.taxHeads || [];
      const policyMap = new Map<string, Map<string, number>>();
      const policyOrder: string[] = [];

      demandHeads.forEach((head) => {
        const c = head.policyCode?.trim() || 'AS_PER_OLD';
        const taxName = head.taxName?.trim();
        if (!policyMap.has(c)) {
          policyMap.set(c, new Map());
          policyOrder.push(c);
        }
        if (taxName) {
          policyMap.get(c)!.set(taxName.toLowerCase(), head.taxAmount);
        }
      });

      policyOrder.forEach((pCode, pIdx) => {
        allSubRows.push({
          pCode,
          subMap: policyMap.get(pCode) || new Map<string, number>(),
          gIdx,
          pIdx,
        });
      });
    });

    return (
      <>
        {allSubRows.map(({ pCode, subMap, gIdx, pIdx }, rowIdx) => {
          const isLast = rowIdx === allSubRows.length - 1;

          return (
            <tr
              key={`exp-grp-${rowPolicyCode}-${gIdx}-${pIdx}`}
              className={`transition-colors border-b border-zinc-200 bg-slate-100 hover:bg-slate-200/80 ${isLast ? 'border-b-2 border-b-zinc-300' : ''
                }`}
            >
              <td className="p-0 border border-zinc-200 font-semibold text-[10px] text-slate-800 uppercase relative bg-slate-200/60">
                {/* Continuous vertical tree connector line */}
                <div
                  className={`absolute left-3.5 top-0 w-0 border-l-2 border-slate-500 ${isLast ? 'h-1/2' : 'h-full'
                    }`}
                />
                {/* Horizontal branch line */}
                <div
                  className={`absolute left-3.5 top-1/2 w-2.5 border-b-2 border-slate-500 -translate-y-1/2 ${isLast ? 'rounded-bl-[2px]' : ''
                    }`}
                />
                {/* Arrow sign at the end of the line */}
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 absolute left-[21px] top-1/2 -translate-y-1/2 stroke-[2.5]" />
                <div className="flex items-center pl-8 pr-2 py-2">
                  <span>{pCode}</span>
                </div>
              </td>
              {uniqueTaxNames.map((taxName, idx) => {
                const val = subMap.get(taxName.toLowerCase());
                return (
                  <td
                    key={`exp-val-${gIdx}-${pIdx}-${taxName}-${idx}`}
                    className="p-2 border border-zinc-200 text-center font-semibold text-zinc-800 text-[10px] bg-slate-100"
                  >
                    {formatVal(val ?? 0)}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </>
    );
  }

  return (
    <tr key={`exp-empty-${rowPolicyCode}`} className="bg-slate-100 hover:bg-slate-200/80 transition-colors border-b border-zinc-200">
      <td colSpan={uniqueTaxNames.length + 1} className="p-3 text-center text-zinc-500 italic text-[11px] border border-zinc-200 bg-slate-100">
        {t('taxDetails.noBreakdown')}
      </td>
    </tr>
  );
};
