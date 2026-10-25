'use client';

import React from 'react';
import { UnitDifference, PtisTaxMode } from '@/types/property-tax/apartment';
import { cn } from '@/lib/utils/cn';

import { useTranslations } from 'next-intl';

interface DifferenceEngineTableRowProps {
  diff: UnitDifference;
  idx: number;
  isHovered: boolean;
  isExpanded: boolean;
  onHoverUnit: (id: string | null) => void;
  onToggleExpandRow: (id: string) => void;
  taxMode?: PtisTaxMode;
}

export const DifferenceEngineTableRow: React.FC<DifferenceEngineTableRowProps> = ({
  diff,
  idx,
  isHovered,
  isExpanded,
  onHoverUnit,
  onToggleExpandRow,
  taxMode,
}) => {
  const t = useTranslations('ptisRedesign.differenceColumns');
  const showRv = taxMode !== 'capital';
  const showCv = taxMode !== 'rateable';
  const raw = diff.rawDiff;
  const carpetFt = raw?.carpetAreaSqFeetDiff ?? diff.carpetDiff ?? 0;
  const carpetMtr = raw?.carpetAreaSqMeterDiff ?? 0;
  const buaFt = raw?.builtupAreaSqFeetDiff ?? diff.buaDiff ?? 0;
  const buaMtr = raw?.builtupAreaSqMeterDiff ?? 0;
  const rvVal = raw?.rateableValueDiff ?? diff.rvDiff ?? 0;
  const cvVal = raw?.capitalValueDiff ?? diff.capitalValueDiff ?? null;
  const taxVal = raw?.totalTaxDiff ?? diff.taxDiff ?? 0;
  const rtTaxVal = raw?.retroTaxDiff ?? diff.rtTaxDiff ?? 0;

  const formatCurrencyDiff = (val: number | null | undefined) => {
    if (val == null) return { text: '-', className: 'font-semibold text-zinc-700' };
    if (val === 0) {
      return { text: '₹0', className: 'font-semibold text-zinc-700' };
    }
    const absFormatted = Math.abs(val).toLocaleString();
    if (val < 0) {
      return { text: `-₹${absFormatted}`, className: 'text-rose-600 font-semibold' };
    }
    return { text: `+₹${absFormatted}`, className: 'text-emerald-600 font-semibold' };
  };

  const formatAreaDiff = (val: number | null | undefined) => {
    if (val == null) return { text: '-', className: 'font-semibold text-zinc-500' };
    if (val === 0) {
      return { text: '0', className: 'font-semibold text-zinc-700' };
    }
    const absFormatted = Math.abs(val).toLocaleString();
    if (val < 0) {
      return { text: `-${absFormatted}`, className: 'text-rose-600 font-semibold' };
    }
    return { text: `+${absFormatted}`, className: 'text-emerald-600 font-semibold' };
  };

  const carpetFtData = formatAreaDiff(carpetFt);
  const carpetMtrData = formatAreaDiff(carpetMtr);
  const buaFtData = formatAreaDiff(buaFt);
  const buaMtrData = formatAreaDiff(buaMtr);
  const rvData = formatCurrencyDiff(rvVal);
  const cvData = formatCurrencyDiff(cvVal);
  const taxData = formatCurrencyDiff(taxVal);
  const rtTaxData = formatCurrencyDiff(rtTaxVal);

  return (
    <React.Fragment key={diff.unitId ? `${diff.unitId}-${idx}` : idx}>
      <tr
        onMouseEnter={() => onHoverUnit(diff.unitId)}
        onMouseLeave={() => onHoverUnit(null)}
        onClick={() => onToggleExpandRow(diff.unitId)}
        className={cn(
          'h-11 transition-colors cursor-pointer hover:bg-amber-50/60',
          isHovered && 'bg-amber-100/80',
          isExpanded && 'bg-amber-100/90'
        )}
      >
        <td className="px-2.5 py-1.5 text-right font-mono whitespace-nowrap border-r border-zinc-200">
          <span className={carpetFtData.className}>{carpetFtData.text}</span>
          <span className="text-zinc-400 font-normal"> / </span>
          <span className={carpetMtrData.className}>{carpetMtrData.text}</span>
        </td>
        <td className="px-2.5 py-1.5 text-right font-mono whitespace-nowrap border-r border-zinc-200">
          <span className={buaFtData.className}>{buaFtData.text}</span>
          <span className="text-zinc-400 font-normal"> / </span>
          <span className={buaMtrData.className}>{buaMtrData.text}</span>
        </td>
        {showRv && (
          <td className={cn('px-2 py-1.5 text-right font-mono whitespace-nowrap border-r border-zinc-200', rvData.className)}>
            {rvData.text}
          </td>
        )}
        {showCv && (
          <td className={cn('px-2 py-1.5 text-right font-mono whitespace-nowrap border-r border-zinc-200', cvData.className)}>
            {cvData.text}
          </td>
        )}
        <td className={cn('px-2.5 py-1.5 text-right font-mono whitespace-nowrap border-r border-zinc-200', taxData.className)}>
          {taxData.text}
        </td>
        <td className={cn('px-2.5 py-1.5 text-right font-mono whitespace-nowrap border-r border-zinc-200', rtTaxData.className)}>
          {rtTaxData.text}
        </td>
      </tr>

      {/* Synchronized Row Height when Expanded */}
      {isExpanded && (
        <tr className="bg-amber-50/20 border-b border-amber-200 transition-all h-12">
          <td colSpan={showRv && showCv ? 6 : (showRv || showCv ? 5 : 4)} className="p-1 text-zinc-400 font-sans h-12 align-middle text-center text-[10px]">
            <span className="italic">{t('detailsAcrossColumns') || 'Details displayed across columns'}</span>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
};
