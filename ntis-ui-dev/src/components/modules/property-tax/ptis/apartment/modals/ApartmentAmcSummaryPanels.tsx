'use client';
import React from 'react';
import { Card } from '@/components/common/Card';
import { formatFullCurrency } from '@/lib/utils/format';
import { ChevronDown, Building2 } from 'lucide-react';

export interface DiscountRule {
  id: string | number;
  name: string;
  description: string;
  amount: number;
}

export const AmcHeader: React.FC<{ wingName: string; blockName: string; propertiesCount: number; floors: string; t: (key: string) => string }> = ({ wingName, blockName, propertiesCount, floors, t }) => (
  <div className="flex items-center gap-4">
    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
      <Building2 size={20} strokeWidth={2} />
    </div>
    <div className="flex flex-col">
      <h2 className="text-xl font-bold text-slate-900 leading-tight tracking-tight">
        {wingName} - {t('amcDetails')}
      </h2>
      <div className="text-xs font-bold text-slate-500 mt-0.5">
        {blockName} &bull; {propertiesCount} {t('properties')} &bull; {floors}
      </div>
    </div>
  </div>
);

export const AmcAssessmentYear: React.FC<{ year: string; t: (key: string) => string }> = ({ year, t }) => (
  <div className="flex items-center justify-between border border-slate-200 rounded-xl p-3 bg-white shadow-sm mb-4">
    <span className="text-xs font-bold text-slate-500 tracking-wide uppercase">{t('assessmentYear')}</span>
    <button className="flex items-center gap-1 bg-blue-50 text-blue-700 font-extrabold text-sm px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
      {year}
      <ChevronDown size={16} strokeWidth={3} className="text-blue-600" />
    </button>
  </div>
);

export const AmcSummaryGrid: React.FC<{
  totalDemand: number;
  collection: number;
  collectionPct: number;
  balance: number;
  discountsApplied: number;
  discountRulesCount: number;
  t: (key: string) => string;
}> = ({ totalDemand, collection, collectionPct, balance, discountsApplied, discountRulesCount, t }) => (
  <div className="grid grid-cols-2 gap-3 mb-4">
    <div className="border border-slate-200 rounded-xl p-3 flex flex-col bg-white shadow-sm">
      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">{t('totalDemand')}</span>
      <span className="text-xl font-black text-slate-900 mt-0.5">{formatFullCurrency(totalDemand)}</span>
      <span className="text-[10px] font-bold text-slate-500 mt-1">{t('currentRetroDemand')}</span>
    </div>
    <div className="border border-emerald-200 rounded-xl p-3 flex flex-col bg-white shadow-sm">
      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wide">{t('collection')}</span>
      <span className="text-xl font-black text-emerald-600 mt-0.5">{formatFullCurrency(collection)}</span>
      <span className="text-[10px] font-bold text-emerald-600 mt-1">{collectionPct}% {t('realized')}</span>
    </div>
    <div className="border border-slate-200 rounded-xl p-3 flex flex-col bg-white shadow-sm">
      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">{t('balance')}</span>
      <span className="text-xl font-black text-slate-900 mt-0.5">{formatFullCurrency(balance)}</span>
      <span className="text-[10px] font-bold text-slate-500 mt-1">{t('outstandingAmount')}</span>
    </div>
    <div className="border border-amber-200 rounded-xl p-3 flex flex-col bg-white shadow-sm">
      <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wide">{t('discountsApplied')}</span>
      <span className="text-xl font-black text-amber-600 mt-0.5">{formatFullCurrency(discountsApplied)}</span>
      <span className="text-[10px] font-bold text-amber-600 mt-1">{discountRulesCount} {t('discountRules')}</span>
    </div>
  </div>
);

export const AmcCollectionPosition: React.FC<{
  recoveryPct: number;
  collection: number;
  totalDemand: number;
  currentDemand: number;
  retroDemand: number;
  t: (key: string) => string;
}> = ({ recoveryPct, collection, totalDemand, currentDemand, retroDemand, t }) => (
  <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm mb-4 flex flex-col">
    <div className="flex items-center justify-between mb-4">
      <span className="text-[11px] font-black text-slate-900 tracking-wide uppercase">{t('collectionPosition')}</span>
      <div className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
        {recoveryPct}% {t('recovery')}
      </div>
    </div>
    <div className="flex justify-between items-end mb-2">
      <span className="text-[10px] font-bold text-slate-500">{t('demandRecovery')}</span>
      <span className="text-[10px] font-bold text-emerald-600">
        {formatFullCurrency(collection)} / <span className="text-slate-500">{formatFullCurrency(totalDemand)}</span>
      </span>
    </div>
    <div className="w-full bg-slate-100 h-2 rounded-full mb-4 overflow-hidden">
      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(recoveryPct, 100)}%` }} />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="border border-slate-700 rounded-lg p-2.5 flex flex-col">
        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide">{t('currentDemand')}</span>
        <span className="text-sm font-black text-slate-800 mt-0.5">{formatFullCurrency(currentDemand)}</span>
      </div>
      <div className="border border-slate-700 rounded-lg p-2.5 flex flex-col">
        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide">{t('retroDemand')}</span>
        <span className="text-sm font-black text-blue-700 mt-0.5">{formatFullCurrency(retroDemand)}</span>
      </div>
    </div>
  </div>
);

export const AmcAppliedDiscounts: React.FC<{ totalAmount: number; rules: DiscountRule[]; t: (key: string) => string }> = ({ totalAmount, rules, t }) => (
  <Card padding="sm" className="mb-4 shadow-sm border-slate-200 p-4">
    <div className="flex items-center justify-between mb-4">
      <span className="text-[11px] font-black text-slate-900 tracking-wide uppercase">{t('appliedDiscountDetails')}</span>
      <div className="bg-amber-50 text-amber-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200">
        {formatFullCurrency(totalAmount)} {t('total')}
      </div>
    </div>
    <div className="space-y-3">
      {rules.map((rule) => (
        <div key={rule.id} className="border border-slate-200 rounded-xl p-3 flex flex-col bg-white">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black text-slate-800">{rule.name}</span>
            <span className="text-xs font-black text-amber-600">{formatFullCurrency(rule.amount)}</span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 mt-1">{rule.description}</span>
        </div>
      ))}
    </div>
  </Card>
);
