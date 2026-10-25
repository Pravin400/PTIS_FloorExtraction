'use client';

import React, { memo } from 'react';
import { FileText } from 'lucide-react';
import { Select, Input } from '@/components/common';

interface RetrospectiveTaxFormProps {
  t: (key: string) => string;
  getLabel: (key: string, fallback: string) => string;
  taxStartOptions: { label: string; value: string }[];
  useDateDropdownOptions: { label: string; value: string }[];
  limitOptions: { label: string; value: string }[];
  taxCalcOptions: { label: string; value: string }[];
  selectedTaxStartValue: string;
  onTaxStartsFromChange: (val: string) => void;
  selectedUseDateValue: string;
  onUseDateChange: (val: string) => void;
  selectedLimitValue: string;
  onRetrospectiveLimitChange: (val: string) => void;
  selectedCalcValue: string;
  onTaxCalculationChange: (val: string) => void;
  offsetMonths: number | string;
  onOffsetMonthsChange: (val: number | string) => void;
  earliestAllowedDate: string;
  onEarliestAllowedDateChange: (val: string) => void;
  maximumYears: number | string;
  onMaximumYearsChange: (val: number | string) => void;
  taxMultiplier: number | string;
  onTaxMultiplierChange: (val: number | string) => void;
  shouldShowUseDate: boolean;
  isFixedPolicyDate: boolean;
  isAfterSpecifiedMonths: boolean;
  isEarliestChargeable: boolean;
  isMaxYears: boolean;
  isSplitMultiplier: boolean;
  taxCalcColSpan: string;
  isLoading: boolean;
  formErrors?: Record<string, string>;
}

export const RetrospectiveTaxForm: React.FC<RetrospectiveTaxFormProps> = memo(({
  t,
  getLabel,
  taxStartOptions,
  useDateDropdownOptions,
  limitOptions,
  taxCalcOptions,
  selectedTaxStartValue,
  onTaxStartsFromChange,
  selectedUseDateValue,
  onUseDateChange,
  selectedLimitValue,
  onRetrospectiveLimitChange,
  selectedCalcValue,
  onTaxCalculationChange,
  offsetMonths,
  onOffsetMonthsChange,
  earliestAllowedDate,
  onEarliestAllowedDateChange,
  maximumYears,
  onMaximumYearsChange,
  taxMultiplier,
  onTaxMultiplierChange,
  shouldShowUseDate,
  isFixedPolicyDate,
  isAfterSpecifiedMonths,
  isEarliestChargeable,
  isMaxYears,
  isSplitMultiplier,
  taxCalcColSpan,
  isLoading,
  formErrors,
}) => {
  const hasLimitInput = isEarliestChargeable || isMaxYears || isFixedPolicyDate;
  const isFourColRow1 = isAfterSpecifiedMonths && hasLimitInput;

  return (
    <div className="p-2.5 rounded-lg border border-gray-200 bg-gray-50/40 space-y-2.5">
      <div className="flex items-center gap-2">
        <FileText className="w-3.5 h-3.5 text-gray-700" />
        <div>
          <h3 className="text-[11px] font-bold text-gray-900">{t('retrospectiveTaxTitle')}</h3>
          <p className="text-[10px] text-gray-500">{t('retrospectiveTaxSubtitle')}</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {/* Row 1 Grid */}
        <div className={`grid grid-cols-1 ${isFourColRow1 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'} gap-2.5 pt-0.5`}>
          <div>
            <Select
              label={getLabel('taxStartsFromLabel', 'Tax starts from')}
              required
              options={taxStartOptions}
              value={selectedTaxStartValue}
              onChange={(_e, val) => onTaxStartsFromChange(val)}
              disabled={isLoading}
              error={formErrors?.taxStartsFrom}
              selectSize="sm"
              className="w-full text-xs"
            />
          </div>

          {shouldShowUseDate ? (
            <div>
              <Select
                label={getLabel('useDateLabel', 'Use date')}
                required
                options={useDateDropdownOptions}
                value={selectedUseDateValue}
                onChange={(_e, val) => onUseDateChange(val)}
                disabled={isLoading}
                selectSize="sm"
                className="w-full text-xs"
              />
            </div>
          ) : (
            <div>
              <Select
                label={getLabel('limitLabel', 'Retrospective limit')}
                required
                options={limitOptions}
                value={selectedLimitValue}
                onChange={(_e, val) => onRetrospectiveLimitChange(val)}
                disabled={isLoading}
                error={formErrors?.retrospectiveLimit}
                selectSize="sm"
                className="w-full text-xs"
              />
            </div>
          )}

          {isAfterSpecifiedMonths ? (
            <div>
              <Input
                label={getLabel('monthsAfterLabel', 'Months after')}
                required
                type="number"
                min={1}
                max={120}
                value={offsetMonths}
                onChange={(e) => onOffsetMonthsChange(e.target.value === '' ? '' : Number(e.target.value))}
                error={formErrors?.offsetMonths}
                className="w-full text-xs"
              />
            </div>
          ) : shouldShowUseDate ? (
            <div>
              <Select
                label={getLabel('limitLabel', 'Retrospective limit')}
                required
                options={limitOptions}
                value={selectedLimitValue}
                onChange={(_e, val) => onRetrospectiveLimitChange(val)}
                disabled={isLoading}
                error={formErrors?.retrospectiveLimit}
                selectSize="sm"
                className="w-full text-xs"
              />
            </div>
          ) : (isEarliestChargeable || isFixedPolicyDate) ? (
            <div>
              <Input
                label={getLabel('earliestAllowedDateLabel', 'Earliest allowed date')}
                required
                type="date"
                value={earliestAllowedDate}
                onChange={(e) => onEarliestAllowedDateChange(e.target.value)}
                error={formErrors?.earliestAllowedDate}
                className="w-full text-xs"
              />
            </div>
          ) : isMaxYears ? (
            <div>
              <Input
                label={getLabel('maxYearsLabel', 'Maximum years')}
                required
                type="number"
                min={1}
                max={100}
                placeholder={t('maxYearsPlaceholder')}
                value={maximumYears}
                onChange={(e) => onMaximumYearsChange(e.target.value === '' ? '' : Number(e.target.value))}
                error={formErrors?.maximumYears}
                className="w-full text-xs"
              />
            </div>
          ) : null}

          {isFourColRow1 && (
            <div>
              <Select
                label={getLabel('limitLabel', 'Retrospective limit')}
                required
                options={limitOptions}
                value={selectedLimitValue}
                onChange={(_e, val) => onRetrospectiveLimitChange(val)}
                disabled={isLoading}
                error={formErrors?.retrospectiveLimit}
                selectSize="sm"
                className="w-full text-xs"
              />
            </div>
          )}
        </div>

        {/* Row 2 Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
          {shouldShowUseDate && isAfterSpecifiedMonths && !isFourColRow1 && (
            <div>
              <Select
                label={getLabel('limitLabel', 'Retrospective limit')}
                required
                options={limitOptions}
                value={selectedLimitValue}
                onChange={(_e, val) => onRetrospectiveLimitChange(val)}
                disabled={isLoading}
                error={formErrors?.retrospectiveLimit}
                selectSize="sm"
                className="w-full text-xs"
              />
            </div>
          )}

          {(isFourColRow1 || (shouldShowUseDate && !isAfterSpecifiedMonths)) && (isEarliestChargeable || isFixedPolicyDate) && (
            <div>
              <Input
                label={getLabel('earliestAllowedDateLabel', 'Earliest allowed date')}
                required
                type="date"
                value={earliestAllowedDate}
                onChange={(e) => onEarliestAllowedDateChange(e.target.value)}
                error={formErrors?.earliestAllowedDate}
                className="w-full text-xs"
              />
            </div>
          )}

          {(isFourColRow1 || (shouldShowUseDate && !isAfterSpecifiedMonths)) && isMaxYears && (
            <div>
              <Input
                label={getLabel('maxYearsLabel', 'Maximum years')}
                required
                type="number"
                min={1}
                max={100}
                placeholder={t('maxYearsPlaceholder')}
                value={maximumYears}
                onChange={(e) => onMaximumYearsChange(e.target.value === '' ? '' : Number(e.target.value))}
                error={formErrors?.maximumYears}
                className="w-full text-xs"
              />
            </div>
          )}

          <div className={taxCalcColSpan}>
            <Select
              label={getLabel('taxCalcLabel', 'Tax calculation')}
              required
              options={taxCalcOptions}
              value={selectedCalcValue}
              onChange={(_e, val) => onTaxCalculationChange(val)}
              disabled={isLoading}
              error={formErrors?.taxCalculation}
              selectSize="sm"
              className="w-full text-xs"
            />
          </div>

          {!isSplitMultiplier && (
            <div>
              <Input
                label={getLabel('multiplierLabel', 'Tax multiplier')}
                required
                type="number"
                step="0.1"
                min={0.1}
                max={10}
                value={taxMultiplier}
                onChange={(e) => onTaxMultiplierChange(e.target.value === '' ? '' : Number(e.target.value))}
                error={formErrors?.taxMultiplier}
                className="w-full text-xs"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

RetrospectiveTaxForm.displayName = 'RetrospectiveTaxForm';
