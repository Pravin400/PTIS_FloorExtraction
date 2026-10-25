/* eslint-disable i18next/no-literal-string */
'use client';

import React from 'react';
import { Percent, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { DiscountAttributeDto } from '@/types/discount.types';

interface TaxDiscountsTableProps {
  discounts: DiscountAttributeDto[];
  loading?: boolean;
  baseTax?: number;
  useGroup?: string;
  onViewDocument?: (guid: string, title?: string) => void;
}

export const TaxDiscountsTable: React.FC<TaxDiscountsTableProps> = ({
  discounts,
  loading,
  baseTax = 0,
  useGroup = 'All',
  onViewDocument,
}) => {
  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-500 bg-slate-50/70 rounded-xl border border-slate-200">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-slate-700">Fetching applied property discounts...</p>
      </div>
    );
  }

  if (!discounts || discounts.length === 0) {
    return (
      <div className="py-14 flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <Percent className="w-8 h-8 text-slate-300" />
        <p className="text-xs font-medium">No discount schemes registered for this unit.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider sticky top-0 bg-white z-10">
            <th className="py-2.5 px-3 w-44">DISCOUNT</th>
            <th className="py-2.5 px-2 text-center w-20">LEVEL</th>
            <th className="py-2.5 px-3 w-48">APPROVAL BASIS</th>
            <th className="py-2.5 px-2 text-center w-24">TYPE</th>
            <th className="py-2.5 px-2 text-center w-20">USE GROUP</th>
            <th className="py-2.5 px-2 text-center w-20">BENEFIT</th>
            <th className="py-2.5 px-2 text-center w-28">VALIDITY</th>
            <th className="py-2.5 px-3 w-40">DOCUMENT</th>
            <th className="py-2.5 px-2 text-right w-24">BEFORE TAX</th>
            <th className="py-2.5 px-2 text-right w-24">BENEFIT AMT</th>
            <th className="py-2.5 px-3 text-right w-24">FINAL TAX</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-800">
          {discounts.map((item, idx) => {
            const isApplied = item.bitValue === true || item.propertySocialDetailId != null || item.intValue != null || item.decimalValue != null || !!item.textValue || !!item.dateValue;
            const level = item.socialAttributeCode?.includes('WG') ? 'Wing' : item.socialAttributeCode?.includes('APT') ? 'Apartment' : 'Unit';
            const benefitPercent = !isApplied ? '—' : item.decimalValue != null ? `${item.decimalValue}%` : item.intValue != null ? `₹${item.intValue}` : '5%';
            const typeStr = !isApplied ? '—' : item.decimalValue != null ? `${item.decimalValue}% off` : item.intValue != null ? `₹${item.intValue} off` : '5% off';
            const benefitAmt = isApplied ? Math.round(baseTax * ((item.decimalValue || 5) / 100)) : 0;
            const finalTax = isApplied ? Math.max(0, baseTax - benefitAmt) : baseTax;

            return (
              <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2.5 px-3 font-bold text-slate-900 leading-tight">
                  {item.socialAttributeCode ? `${item.socialAttributeCode} ` : ''}
                  {item.socialAttributeName}
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                    level === 'Unit' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    level === 'Wing' && 'bg-purple-50 text-purple-700 border-purple-200',
                    level === 'Apartment' && 'bg-blue-50 text-blue-700 border-blue-200'
                  )}>
                    {level}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-600 text-[11px] leading-tight">
                  {item.remark || (item.isDocumentRequired ? 'Prior approval + certificate' : 'Auto-verified from payment gateway')}
                </td>
                <td className="py-2.5 px-2 text-center text-slate-700 font-medium">
                  {typeStr}
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className={cn('font-bold text-xs', useGroup === 'All' ? 'text-blue-600' : 'text-slate-700')}>
                    {useGroup}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-center font-bold text-emerald-600">
                  {benefitPercent}
                </td>
                <td className="py-2.5 px-2 text-center text-slate-500 text-[11px]">
                  {item.dateValue ? `Valid till ${item.dateValue}` : 'Ongoing'}
                </td>
                <td className="py-2.5 px-3">
                  {item.documentGuid ? (
                    <button
                      type="button"
                      onClick={() => onViewDocument?.(item.documentGuid!, `${item.socialAttributeName} Document`)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer"
                    >
                      <FileText className="w-3 h-3 text-blue-600" />
                      <span>View</span>
                    </button>
                  ) : item.documentUrl ? (
                    <span className="text-slate-600 text-[11px] truncate max-w-[120px] inline-block">Uploaded</span>
                  ) : item.isDocumentRequired ? (
                    <span className="text-slate-500 text-[11px]">Certificate required</span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">—</span>
                  )}
                </td>
                <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                  ₹{baseTax.toLocaleString()}
                </td>
                <td className="py-2.5 px-2 text-right font-mono">
                  {isApplied ? (
                    <span className="font-extrabold text-emerald-600">-₹{benefitAmt.toLocaleString()}</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right font-mono">
                  {isApplied ? (
                    <span className="font-extrabold text-blue-600">₹{finalTax.toLocaleString()}</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
