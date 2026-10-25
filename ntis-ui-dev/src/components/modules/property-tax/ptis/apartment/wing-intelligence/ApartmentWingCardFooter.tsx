'use client';
import React, { useState } from "react";
import { ArrowUpRight, ArrowDownRight, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatCompactCurrency, formatFullCurrency } from "@/lib/utils/format";
import { ExemptionSummaryProps, OverallTaxSummaryProps, RevenueImpactSummaryProps, WingCardFooterProps } from "@/types/property-tax/apartment";

const Popover: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  align?: 'center' | 'right';
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, align = 'center', children }) => {
  if (!isOpen) return null;

  const positionClass =
    align === 'right'
      ? 'right-0'
      : 'left-1/2 -translate-x-1/2';

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div
        className={`absolute z-50 bottom-[calc(100%+8px)] ${positionClass} bg-white rounded-xl shadow-2xl border border-slate-200 p-3.5 w-[305px] max-w-[calc(100vw-32px)] cursor-default pointer-events-auto animate-in fade-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start border-b border-slate-200 pb-2 mb-2.5 gap-2">
          <h3 className="text-[11px] font-black text-blue-800 uppercase tracking-wider leading-snug flex-1 pr-1">{title}</h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full hover:bg-slate-100 shrink-0 mt-0.5 cursor-pointer"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
        <div className="flex flex-col gap-2.5 relative z-50">
          {children}
        </div>
      </div>
    </>
  );
};

const RowItem = ({ label, value, valueClass = "text-slate-700", isLast = false }: { label: React.ReactNode; value: React.ReactNode; valueClass?: string; isLast?: boolean }) => (
  <div className={`flex justify-between items-center ${isLast ? '' : 'border-b border-slate-100 pb-1.5'}`}>
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    <span className={`text-[11px] font-black ${valueClass}`}>{value}</span>
  </div>
);

const OverallTaxSummary: React.FC<OverallTaxSummaryProps> = ({ from, to, amount }) => {
  const t = useTranslations('ptisRedesign.wingIntelligence');
  const targetValue = amount ?? to ?? from ?? 0;
  const hasRange = Boolean(from && to && from !== '0' && from !== 0 && from !== to && !amount);
  const displayValue = hasRange
    ? `${formatCompactCurrency(from)} - ${formatCompactCurrency(to)}`
    : formatCompactCurrency(targetValue);

  return (
    <div className="flex flex-col border border-blue-200 rounded-lg px-1.5 py-1 flex-1 bg-[#eff6ff] hover:bg-[#dbeafe] justify-between transition-all duration-150 hover:shadow-xs hover:scale-[1.015] active:scale-[0.98]">
      <span className="text-[9px] font-bold text-blue-800 uppercase tracking-wider mb-0.5">
        {t('totalDemand') || 'TOTAL DEMAND'}
      </span>
      <div>
        <div className="text-sm font-black text-blue-950 leading-none w-fit">
          {displayValue}
        </div>
        <div className="text-[9px] font-bold text-blue-600/90 mt-0.5 leading-none">
          {t('totalPropertyDemand') || 'Total Property Demand'}
        </div>
      </div>
    </div>
  );
};

const RevenueImpactSummary: React.FC<RevenueImpactSummaryProps> = ({
  wingName,
  amount,
  pct,
  isPositive,
  oldDemand,
  currentDemand,
  retroDemand,
  totalDemand,
}) => {
  const t = useTranslations('ptisRedesign.wingIntelligence');
  const [isOpen, setIsOpen] = useState(false);

  const isPos = isPositive ?? (typeof amount === 'number' ? amount >= 0 : !String(amount).startsWith('-'));
  const cleanPct = typeof pct === 'number' ? Math.abs(pct) : typeof pct === 'string' ? Math.abs(parseFloat(pct) || 0) : 0;

  const formatDemandValue = (val: string | number | undefined | null) => {
    if (val == null || val === '') return '₹0';
    if (typeof val === 'number') return formatFullCurrency(val);
    const trimmed = String(val).trim();
    if (!trimmed || trimmed === '0') return '₹0';
    return trimmed.startsWith('₹') ? trimmed : `₹${trimmed}`;
  };

  return (
    <div className={`relative flex-1 ${isOpen ? 'z-50' : ''}`}>
      <div
        onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
        className={`flex flex-col h-full border rounded-lg px-1.5 py-1 justify-between cursor-pointer transition-all duration-150 hover:shadow-xs hover:scale-[1.015] active:scale-[0.98] ${isPos
          ? 'border-emerald-200 bg-[#f0fdf4] hover:bg-[#dcfce7]'
          : 'border-rose-200 bg-[#fff1f2] hover:bg-[#ffe4e6]'
          }`}
      >
        <span className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${isPos ? 'text-teal-800' : 'text-rose-800'
          }`}>
          {t('revenueImpact') || 'REVENUE IMPACT'}
        </span>
        <div className="flex flex-col">
          <div className="flex items-center gap-0.5 mb-0.5">
            <div className={`text-sm font-black leading-none flex items-center gap-0.5 mt-[1px] ${isPos ? 'text-emerald-600' : 'text-rose-600'
              }`}>
              {isPos ? (
                <ArrowUpRight size={14} strokeWidth={3} />
              ) : (
                <ArrowDownRight size={14} strokeWidth={3} />
              )}
              {formatCompactCurrency(typeof amount === 'number' ? Math.abs(amount) : amount)}
            </div>
          </div>
          <div className={`text-[9px] font-bold leading-none ${isPos ? 'text-teal-700' : 'text-rose-700'
            }`}>
            {isPos ? (t('increase') || 'Increase') : (t('decrease') || 'Decrease')} {cleanPct}% {t('vsOldTax') || 'vs old tax'}
          </div>
        </div>
      </div>
      <Popover isOpen={isOpen} onClose={() => setIsOpen(false)} title={`${t('revImpactDetails') || 'REV IMPACT DETAILS'} – ${wingName}`} align="center">
        {/* FORMULA 1: TOTAL DEMAND */}
        <div className="flex flex-col gap-1.5 pb-2.5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block"></span>
              {t('totalDemandFormula') || 'FORMULA 1: TOTAL DEMAND'}
            </span>
          </div>

          <div className="bg-blue-50/70 border border-blue-100 rounded-md px-2 py-1 text-[9.5px] font-bold text-blue-900 flex items-center justify-center gap-1 text-center">
            <span>{t('currentDemand') || 'Current Demand'}</span>
            <span className="text-blue-600 font-black">+</span>
            <span>{t('retroDemand') || 'Retro Demand'}</span>
            <span className="text-blue-600 font-black">=</span>
            <span className="text-blue-950 font-black">{t('totalDemand') || 'Total Demand'}</span>
          </div>

          <div className="flex flex-col gap-1 px-1 pt-0.5">
            <div className="flex justify-between items-center text-[10.5px]">
              <span className="text-slate-600 font-medium">{t('currentDemand') || 'Current Demand'}</span>
              <span className="font-bold text-blue-800">{formatDemandValue(currentDemand)}</span>
            </div>
            <div className="flex justify-between items-center text-[10.5px]">
              <span className="text-slate-600 font-medium flex items-center gap-1">
                <span className="text-purple-600 font-black text-[11px] leading-none">+</span>
                <span>{t('retroDemand') || 'Retro Demand'}</span>
              </span>
              <span className="font-bold text-purple-700">{formatDemandValue(retroDemand)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 mt-0.5 border-t border-slate-200">
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                <span className="text-emerald-600 font-black text-[11px] leading-none">=</span>
                <span>{t('totalDemand') || 'Total Demand'}</span>
              </span>
              <span className="text-xs font-black text-emerald-600">{formatDemandValue(totalDemand)}</span>
            </div>
          </div>
        </div>

        {/* FORMULA 2: REVENUE IMPACT */}
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
              {t('revenueImpactFormula') || 'FORMULA 2: REVENUE IMPACT'}
            </span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-100 rounded-md px-2 py-1 text-[9.5px] font-bold text-emerald-900 flex items-center justify-center gap-1 text-center">
            <span>{t('totalDemand') || 'Total Demand'}</span>
            <span className="text-emerald-700 font-black">−</span>
            <span>{t('oldDemand') || 'Old Demand'}</span>
            <span className="text-emerald-700 font-black">=</span>
            <span className="text-emerald-950 font-black">{t('revenueImpact') || 'Revenue Impact'}</span>
          </div>

          <div className="flex flex-col gap-1 px-1 pt-0.5">
            <div className="flex justify-between items-center text-[10.5px]">
              <span className="text-slate-600 font-medium">{t('totalDemand') || 'Total Demand'}</span>
              <span className="font-bold text-slate-800">{formatDemandValue(totalDemand)}</span>
            </div>
            <div className="flex justify-between items-center text-[10.5px]">
              <span className="text-slate-600 font-medium flex items-center gap-1">
                <span className="text-rose-600 font-black text-[11px] leading-none">−</span>
                <span>{t('oldDemand') || 'Old Demand'}</span>
              </span>
              <span className="font-bold text-slate-700">{formatDemandValue(oldDemand)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 mt-0.5 border-t border-slate-200">
              <span className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${isPos ? 'text-teal-900' : 'text-rose-900'}`}>
                <span className={`${isPos ? 'text-emerald-600' : 'text-rose-600'} font-black text-[11px] leading-none`}>=</span>
                <span>{t('netRevenueImpact') || 'Net Revenue Impact'}</span>
              </span>
              <div className="flex items-center gap-0.5">
                {isPos ? (
                  <ArrowUpRight size={13} className="text-emerald-600 stroke-[3]" />
                ) : (
                  <ArrowDownRight size={13} className="text-rose-600 stroke-[3]" />
                )}
                <span className={`text-xs font-black ${isPos ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isPos ? '+' : ''}{formatDemandValue(amount)}
                </span>
              </div>
            </div>

            <div className={`flex items-center justify-between text-[9px] font-bold px-2 py-1 mt-1 rounded ${isPos ? 'bg-emerald-100/70 text-emerald-800' : 'bg-rose-100/70 text-rose-800'}`}>
              <span>{isPos ? (t('increase') || 'Increase') : (t('decrease') || 'Decrease')} {cleanPct}% {t('vsOldTax') || 'vs old tax'}</span>
              <span className="font-semibold text-[8.5px] opacity-80">{formatDemandValue(totalDemand)} − {formatDemandValue(oldDemand)}</span>
            </div>
          </div>
        </div>
      </Popover>
    </div>
  );
};

const ExemptionSummary: React.FC<ExemptionSummaryProps> = ({ wingName, amount, count }) => {
  const t = useTranslations('ptisRedesign.wingIntelligence');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative flex-1 ${isOpen ? 'z-50' : ''}`}>
      <div
        onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
        className="flex flex-col h-full border border-purple-100 rounded-lg px-1.5 py-1 bg-[#faf5ff] justify-between cursor-pointer hover:bg-purple-100 transition-all duration-150 hover:shadow-xs hover:scale-[1.015] active:scale-[0.98]"
      >
        <span className="text-[9px] font-bold text-purple-800 uppercase tracking-wider mb-0.5">{t('exemptionApplied') || 'EXEMPTION APPLIED'}</span>
        <div className="flex flex-col">
          <span className="text-sm font-black text-purple-900 leading-none w-fit mb-0.5">{formatCompactCurrency(amount)}</span>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="bg-purple-200 text-purple-900 text-[8px] font-black px-1.5 py-[3px] rounded-sm uppercase leading-none">
              {count} {count === 1 ? (t('property') || 'PROPERTY') : (t('properties') || 'PROPERTIES')}
            </span>
            <span className="text-[9px] font-bold text-purple-700 leading-none">{t('exempted') || 'Exempted'}</span>
          </div>
          <span className="text-[9px] font-bold text-purple-700 leading-none mb-0.5">
            {t('inProcess') || 'In process'}
          </span>
          <button className="text-[10px] font-extrabold text-blue-700 self-start hover:underline leading-none">
            {t('viewList') || 'View List'} &gt;
          </button>
        </div>
      </div>
      {/* <Popover isOpen={isOpen} onClose={() => setIsOpen(false)} title={`${t('exemptionDetails') || 'EXEMPTION DETAILS'} (In Process) – ${wingName}`}> */}
      <Popover isOpen={isOpen} onClose={() => setIsOpen(false)} title={`${t('exemptionDetails') || 'EXEMPTION DETAILS'} (${t('inProcess') || 'In Process'}) – ${wingName}`} align="right">
        <RowItem label={t('exemptedUnits') || 'EXEMPTED UNITS'} value={t('notAvailable') || 'N/A'} />
        <RowItem label={t('category') || 'CATEGORY'} value={<div className="text-right max-w-[120px] leading-tight">{t('notAvailable') || "N/A"}</div>} valueClass="text-purple-700" />
        <RowItem label={t('eligibleUnits') || 'ELIGIBLE UNITS'} value={t('notAvailable') || 'N/A'} />
        <RowItem label={t('exemptionAmount') || 'EXEMPTION AMOUNT'} value={t('notAvailable') || 'N/A'} valueClass="text-purple-700" isLast />
      </Popover>
    </div>
  );
};

export const ApartmentWingCardFooter: React.FC<WingCardFooterProps> = ({
  wingName,
  exemption,
  overallTax,
  revenueImpact
}) => {
  return (
    <div className="flex gap-1.5 bg-white rounded-b-xl border-t border-slate-100 p-1">
      <OverallTaxSummary from={overallTax.from} to={overallTax.to} amount={overallTax.amount} />
      <RevenueImpactSummary
        wingName={wingName}
        amount={revenueImpact.amount}
        pct={revenueImpact.pct}
        isPositive={revenueImpact.isPositive}
        previousRv={revenueImpact.previousRv ?? overallTax.from}
        revisedRv={revenueImpact.revisedRv ?? overallTax.to}
        differenceRv={revenueImpact.differenceRv ?? revenueImpact.amount}
        affectedUnits={revenueImpact.affectedUnits}
        oldDemand={revenueImpact.oldDemand}
        currentDemand={revenueImpact.currentDemand}
        retroDemand={revenueImpact.retroDemand}
        totalDemand={revenueImpact.totalDemand}
      />
      <ExemptionSummary wingName={wingName} amount={exemption.amount} count={exemption.count} />
    </div>
  );
};

export default ApartmentWingCardFooter;
