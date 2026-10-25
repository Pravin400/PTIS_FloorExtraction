/* eslint-disable i18next/no-literal-string */
'use client';

import React, { useState } from 'react';
import { AssessmentUnit } from '@/types/property-tax/apartment';
import type { PropertyRuleLogItem } from '@/types/rule-engine';
import { cn } from '@/lib/utils/cn';
import { Drawer } from '@/components/common/Drawer';
import { FileText } from 'lucide-react';
import { TaxRulesKpiCards } from '../tax-rules/TaxRulesKpiCards';
import { TaxRulesTable } from '../tax-rules/TaxRulesTable';
import { TaxRulesRetroTable } from '../tax-rules/TaxRulesRetroTable';
import { TaxDiscountsTable } from '../tax-rules/TaxDiscountsTable';
import { useTaxRulesModalData } from '@/hooks/property-tax/apartment';

interface TaxRulesDiscountsModalProps {
  open: boolean;
  onClose: () => void;
  unit: AssessmentUnit | null;
  appliedRules?: PropertyRuleLogItem[];
  apartmentName?: string;
  wingName?: string;
  onViewDocument?: (guid: string, title?: string) => void;
}

export const TaxRulesDiscountsModal: React.FC<TaxRulesDiscountsModalProps> = ({
  open,
  onClose,
  unit,
  appliedRules = [],
  apartmentName,
  wingName,
  onViewDocument,
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'discounts' | 'retro'>('rules');

  const {
    baseValue,
    taxationRules,
    totalSurcharge,
    totalReduction,
    cumulativeFinalTax,
    netImpact,
    retroTaxRows,
    retroTotalInterest,
    retroGrandTotal,
    discounts,
    loadingDiscounts,
    loadingTaxData,
    appliedDiscountsCount,
    discountPercentageBenefit,
    discountFixedBenefit,
    discountTotalBenefit,
    discountFinalTax,
  } = useTaxRulesModalData({ open, unit, appliedRules });

  const resolvedApartment = apartmentName || unit?.owner || 'Property Details';
  const resolvedWing = wingName || unit?.rawSurvey?.wing || '-';
  const resolvedUnitNo = unit?.propFull || unit?.prop || unit?.rawSurvey?.flatOrShopNo || '-';
  const resolvedUse = unit?.use || unit?.rawSurvey?.typeOfUse || '-';
  const resolvedOwner = unit?.owner || unit?.rawSurvey?.ownerName || '-';

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="xl"
      title={
        <div className="flex flex-col gap-1 py-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0 shadow-xs">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-bold text-gray-800 tracking-tight uppercase">
              Tax Rules & Discounts
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold mt-0.5">
            <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700">
              APARTMENT: {resolvedApartment}
            </span>
            <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700">
              WING: {resolvedWing}
            </span>
            <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700">
              UNIT: {resolvedUnitNo}
            </span>
            <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700">
              USE: {resolvedUse}
            </span>
            <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700">
              OWNER: {resolvedOwner}
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700">
              BASE TAX: ₹{baseValue.toLocaleString()}
            </span>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <p className="text-[11px] text-gray-400 italic font-normal">
            * Unit-specific view: Apartment + Wing + Unit level rules and discounts. Discounts require prior approval with valid supporting documents.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="p-5 flex flex-col gap-4">
        {/* Tab Navigation */}
        <div className="pt-1 pb-2 flex items-center justify-between border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={cn(
                'px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 select-none',
                activeTab === 'rules'
                  ? 'bg-white border-2 border-red-500 text-red-600 shadow-2xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              )}
            >
              <span>TAXATION RULES APPLIED</span>
              <span className={cn('px-1.5 py-0.2 rounded text-[10px] font-mono font-bold', activeTab === 'rules' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-white text-gray-600 border border-gray-200')}>
                {taxationRules.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('discounts')}
              className={cn(
                'px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 select-none',
                activeTab === 'discounts'
                  ? 'bg-white border-2 border-emerald-500 text-emerald-600 shadow-2xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              )}
            >
              <span>DISCOUNTS APPLIED</span>
              <span className={cn('px-1.5 py-0.2 rounded text-[10px] font-mono font-bold', activeTab === 'discounts' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-white text-gray-600 border border-gray-200')}>
                {appliedDiscountsCount}/{discounts.length || 8}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('retro')}
              className={cn(
                'px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 select-none',
                activeTab === 'retro'
                  ? 'bg-white border-2 border-amber-500 text-amber-700 shadow-2xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              )}
            >
              <span>RETROSPECTIVE TAX CALC</span>
              <span className={cn('px-1.5 py-0.2 rounded text-[10px] font-mono font-bold', activeTab === 'retro' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-white text-gray-600 border border-gray-200')}>
                {loadingTaxData ? '...' : `${retroTaxRows.length} YRS`}
              </span>
            </button>
          </div>

          <span className="text-gray-400 text-xs font-semibold">Unit-level view</span>
        </div>

        {/* Tab-Specific KPI Metric Summary Cards */}
        <TaxRulesKpiCards
          activeTab={activeTab}
          baseValue={baseValue}
          totalSurcharge={totalSurcharge}
          totalReduction={totalReduction}
          cumulativeFinalTax={cumulativeFinalTax}
          netImpact={netImpact}
          discountPercentageBenefit={discountPercentageBenefit}
          discountFixedBenefit={discountFixedBenefit}
          discountTotalBenefit={discountTotalBenefit}
          discountFinalTax={discountFinalTax}
          retroYearsCount={retroTaxRows.length}
          retroTotalInterest={retroTotalInterest}
          retroGrandTotal={retroGrandTotal}
        />

        {/* Table Content Area */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden p-4">
          {activeTab === 'rules' && <TaxRulesTable rules={taxationRules} />}
          {activeTab === 'discounts' && (
            <TaxDiscountsTable
              discounts={discounts}
              loading={loadingDiscounts}
              baseTax={baseValue}
              useGroup={resolvedUse}
              onViewDocument={onViewDocument}
            />
          )}
          {activeTab === 'retro' && <TaxRulesRetroTable rows={retroTaxRows} loading={loadingTaxData} />}
        </div>
      </div>
    </Drawer>
  );
};
