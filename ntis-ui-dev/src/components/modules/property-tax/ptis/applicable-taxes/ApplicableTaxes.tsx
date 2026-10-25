'use client';

import { SearchSelect, Checkbox } from '@/components/common';
import { Search, FileText, X } from 'lucide-react';
import { TaxesTableTemplate } from './TaxesTableTemplate';
import FixedFooter from './FixedFooter';
import type { ApplicableTaxesProps } from '@/types/applicable-taxes.types';
import { useApplicableTaxes } from '@/hooks/ptis/applicableTaxes/useApplicableTaxes';
import { useTranslations } from 'next-intl';

export const ApplicableTaxes = ({
  asseYearsResponse,
  useGroupsResponse,
  valuationTab,
  taxApplicabilityPagedResponse,
  taxApplicabilityPropertyData,
  initialAsseYear,
  initialTypeOfUse,
}: ApplicableTaxesProps) => {
  const t = useTranslations('applicableTaxes');
  const {
    wardNo,
    propertyNo,
    asseYearOptions,
    useTypeOptions,
    selectedAsseYear,
    selectedTypeOfUse,
    searchQuery,
    showInactive,
    summary,
    pageNumber,
    pageSize,
    totalPages,
    totalCount,
    setPageNumber,
    paginatedData,
    columns,
    handleClose,
    handleParamChange,
  } = useApplicableTaxes({
    asseYearsResponse,
    useGroupsResponse,
    valuationTab,
    taxApplicabilityPagedResponse,
    taxApplicabilityPropertyData,
    initialAsseYear,
    initialTypeOfUse,
  });

  // Compute effective Total Tax amount: prioritize TaxTotal row from API calculations if present
   const totalTaxRow = taxApplicabilityPagedResponse?.taxCalculations.find((item) => item.taxName === 'TaxTotal');
  const computedTotalTax = totalTaxRow?.taxAmount ?? summary.totalTax ?? 0;

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden dropdown-full-text">
      {/* Non-scrollable Body */}
      <div className="flex-1 p-3 flex flex-col overflow-hidden space-y-3">
        
        {/* Header Section */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 text-blue-600 p-2 rounded-lg border border-blue-100">
                <FileText size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">{t('appliedTaxes')}</h1>
                <p className="text-sm text-slate-500 font-medium">{t('mixedUsePropertyTaxDetails')}</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors border border-slate-200 bg-white">
              <X size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm">
              {t('property')} {wardNo || '—'} {propertyNo ? `/ ${propertyNo}` : ''}
            </div>
            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm">
              {useTypeOptions.find(o => o.value === selectedTypeOfUse)?.label || t('mixedConstruction')}
            </div>           
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-blue-50 border border-blue-100 rounded-xl py-2 px-3 shadow-xs flex flex-col justify-center gap-0.5">
            <span className="text-[10px] font-bold text-blue-600/70 uppercase tracking-wider">{t('totalTax')}</span>
            <span className="text-base font-black text-slate-800 leading-tight">
              {t('currencySymbol')} {computedTotalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl py-2 px-3 shadow-xs flex flex-col justify-center gap-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('residentialRV')}</span>
            <span className="text-sm font-bold text-slate-800 leading-tight">{t('currencySymbol')} {summary.residentialRV?.toLocaleString('en-IN')}</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl py-2 px-3 shadow-xs flex flex-col justify-center gap-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('commercialRV')}</span>
            <span className="text-sm font-bold text-slate-800 leading-tight">{t('currencySymbol')} {summary.commercialRV?.toLocaleString('en-IN')}</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl py-2 px-3 shadow-xs flex flex-col justify-center gap-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('area')}</span>
            <span className="text-sm font-bold text-slate-800 leading-tight">
              {typeof summary.area === 'number'
                ? summary.area.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : (Number(summary.area || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))} {t('squareMeters') || 'm²'}
            </span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl py-2 px-3 shadow-xs flex flex-col justify-center gap-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('toilets')}</span>
            <span className="text-sm font-bold text-slate-800 leading-tight">{summary.toilets}</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={searchQuery}
              onChange={(e) => handleParamChange('search', e.target.value)}
            />
          </div>
          <div className="w-48">
            <SearchSelect
              options={asseYearOptions}
              value={selectedAsseYear}
              onChange={(_, val) => handleParamChange('asseYear', val)}
              disableSearch={false}
              placeholder={t('selectAsseYear')}
            />
          </div>
          <div className="flex items-center">
            <Checkbox
              id="show-inactive"
              checked={showInactive}
              onCheckedChange={(checked) => handleParamChange('showInactive', checked as boolean)}
              label={t('showInactive')}
            />
          </div>
        </div>

        {/* Custom Master Table Container */}
        <div className="overflow-hidden min-h-0 bg-white border border-slate-200 rounded-xl shadow-sm relative">
          <TaxesTableTemplate
            columns={columns}
            data={paginatedData}
            pageNumber={pageNumber}
            pageSize={pageSize}
            totalCount={totalCount}
            totalPages={totalPages}
            onPageChange={(page) => setPageNumber(page)}
          />
        </div>
      </div>

      {/* Fixed Footer */}
      <FixedFooter onConfirm={handleClose} totalAmount={computedTotalTax} />
    </div>
  );
};

export default ApplicableTaxes;
