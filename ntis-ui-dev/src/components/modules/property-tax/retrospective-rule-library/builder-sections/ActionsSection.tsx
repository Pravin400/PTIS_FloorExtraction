'use client';

import React, { memo, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Zap } from 'lucide-react';
import { Badge } from '@/components/common';
import { useRetrospectiveRuleActions } from '@/hooks/retrospective-rule-library/useRetrospectiveRuleActions';
import type { EvidenceItemCode, InitialActionData } from '@/types/retrospective-rule.types';

import { RetrospectiveTaxForm } from './actions-subcomponents/RetrospectiveTaxForm';
import { SplitPeriodTaxSection } from './actions-subcomponents/SplitPeriodTaxSection';
import { UnauthorizedPenaltyBanner } from './actions-subcomponents/UnauthorizedPenaltyBanner';
import { ActionsRuleSummary } from './actions-subcomponents/ActionsRuleSummary';

interface ActionsSectionProps {
  ruleCode?: string;
  ruleName?: string;
  initialData?: InitialActionData;

  // Row 1 fields
  taxStartsFrom: string;
  onTaxStartsFromChange: (val: string) => void;
  useDate: string;
  onUseDateChange: (val: string) => void;
  offsetMonths: number | string;
  onOffsetMonthsChange: (val: number | string) => void;
  retrospectiveLimit: string;
  onRetrospectiveLimitChange: (val: string) => void;

  // Row 2 dynamic limit input fields
  earliestAllowedDate: string;
  onEarliestAllowedDateChange: (val: string) => void;
  maximumYears: number | string;
  onMaximumYearsChange: (val: number | string) => void;

  // Tax calculation & multiplier
  taxCalculation: string;
  onTaxCalculationChange: (val: string) => void;
  taxMultiplier: number | string;
  onTaxMultiplierChange: (val: number | string) => void;

  // Split-period tax multiplier sub-section fields
  splitHigherRateStartsFrom: string;
  onSplitHigherRateStartsFromChange: (val: string) => void;
  splitHigherRateContinuesUpTo: string;
  onSplitHigherRateContinuesUpToChange: (val: string) => void;
  duringPeriodMultiplier: number | string;
  onDuringPeriodMultiplierChange: (val: number | string) => void;
  afterPeriodMultiplier: number | string;
  onAfterPeriodMultiplierChange: (val: number | string) => void;

  // Other props
  isAuthorized: boolean;
  availableEvidence: EvidenceItemCode[];
  compareEvidenceDates: string;
  formErrors?: Record<string, string>;
}

export const ActionsSection: React.FC<ActionsSectionProps> = memo((props) => {
  const {
    taxStartsFrom,
    onTaxStartsFromChange,
    useDate,
    onUseDateChange,
    offsetMonths,
    onOffsetMonthsChange,
    retrospectiveLimit,
    onRetrospectiveLimitChange,
    earliestAllowedDate,
    onEarliestAllowedDateChange,
    maximumYears,
    onMaximumYearsChange,
    taxCalculation,
    onTaxCalculationChange,
    taxMultiplier,
    onTaxMultiplierChange,
    splitHigherRateStartsFrom,
    onSplitHigherRateStartsFromChange,
    splitHigherRateContinuesUpTo,
    onSplitHigherRateContinuesUpToChange,
    duringPeriodMultiplier,
    onDuringPeriodMultiplierChange,
    afterPeriodMultiplier,
    onAfterPeriodMultiplierChange,
    isAuthorized,
    availableEvidence,
    compareEvidenceDates,
    formErrors,
    initialData,
  } = props;

  const t = useTranslations('retrospectiveRuleLibrary.builder.actions');

  const getLabel = React.useCallback(
    (key: string, fallback: string) => {
      try {
        const res = t(key);
        if (res && !res.includes('retrospectiveRuleLibrary.')) {
          return res;
        }
      } catch {
        // fallback
      }
      return fallback;
    },
    [t]
  );

  const {
    taxStartModes,
    useDateOptions: apiUseDateOptions,
    limitTypes,
    taxCalculationModes,
    isLoading,
  } = useRetrospectiveRuleActions({
    initialTaxStartModes: initialData?.taxStartModes,
    initialUseDateOptions: initialData?.useDateOptions,
    initialLimitTypes: initialData?.limitTypes,
    initialTaxCalculationModes: initialData?.taxCalculationModes,
  });

  // Resolve selection values matching code or label
  const selectedTaxStartValue = useMemo(() => {
    if (!taxStartModes || taxStartModes.length === 0) return taxStartsFrom || '';
    const match = taxStartModes.find((m) => m.code === taxStartsFrom || m.label === taxStartsFrom);
    return match ? match.code : taxStartsFrom || '';
  }, [taxStartModes, taxStartsFrom]);

  const resolveUseDateValue = React.useCallback(
    (val?: string) => {
      if (!val) return '';
      if (!apiUseDateOptions || apiUseDateOptions.length === 0) return val;
      const clean = val.trim().toUpperCase();
      const match = apiUseDateOptions.find((m) => {
        const code = (m.code || '').trim().toUpperCase();
        const label = (m.label || '').trim().toUpperCase();
        return (
          code === clean ||
          label === clean ||
          (code && clean.includes(code)) ||
          (label && clean.includes(label))
        );
      });
      return match ? match.code || match.label : val;
    },
    [apiUseDateOptions]
  );

  const selectedUseDateValue = useMemo(() => resolveUseDateValue(useDate) || useDate || '', [resolveUseDateValue, useDate]);
  const selectedSplitStartsFromValue = useMemo(() => resolveUseDateValue(splitHigherRateStartsFrom) || splitHigherRateStartsFrom || '', [resolveUseDateValue, splitHigherRateStartsFrom]);
  const selectedSplitContinuesUpToValue = useMemo(() => resolveUseDateValue(splitHigherRateContinuesUpTo) || splitHigherRateContinuesUpTo || '', [resolveUseDateValue, splitHigherRateContinuesUpTo]);

  const selectedLimitValue = useMemo(() => {
    if (!limitTypes || limitTypes.length === 0) return retrospectiveLimit || '';
    const match = limitTypes.find((m) => m.code === retrospectiveLimit || m.label === retrospectiveLimit);
    return match ? match.code : retrospectiveLimit || '';
  }, [limitTypes, retrospectiveLimit]);

  const selectedCalcValue = useMemo(() => {
    if (!taxCalculationModes || taxCalculationModes.length === 0) return taxCalculation || '';
    const match = taxCalculationModes.find((m) => m.code === taxCalculation || m.label === taxCalculation);
    return match ? match.code : taxCalculation || '';
  }, [taxCalculationModes, taxCalculation]);

  // Options Building
  const taxStartOptions = useMemo(() => {
    const apiOpts = (taxStartModes || []).map((m) => ({ label: m.label || m.code, value: m.code || m.label }));
    if (selectedTaxStartValue && !apiOpts.some((o) => o.value === selectedTaxStartValue || o.label === selectedTaxStartValue)) {
      apiOpts.unshift({ label: selectedTaxStartValue, value: selectedTaxStartValue });
    }
    return apiOpts;
  }, [taxStartModes, selectedTaxStartValue]);

  const useDateDropdownOptions = useMemo(() => {
    const apiOpts = (apiUseDateOptions || []).map((m) => ({ label: m.label || m.code, value: m.code || m.label }));
    [selectedUseDateValue, selectedSplitStartsFromValue, selectedSplitContinuesUpToValue].forEach((val) => {
      if (val && !apiOpts.some((o) => o.value === val || o.label === val)) {
        apiOpts.unshift({ label: val, value: val });
      }
    });
    return apiOpts;
  }, [apiUseDateOptions, selectedUseDateValue, selectedSplitStartsFromValue, selectedSplitContinuesUpToValue]);

  const limitOptions = useMemo(() => {
    const apiOpts = (limitTypes || []).map((m) => ({ label: m.label || m.code, value: m.code || m.label }));
    if (selectedLimitValue && !apiOpts.some((o) => o.value === selectedLimitValue || o.label === selectedLimitValue)) {
      apiOpts.unshift({ label: selectedLimitValue, value: selectedLimitValue });
    }
    return apiOpts;
  }, [limitTypes, selectedLimitValue]);

  const taxCalcOptions = useMemo(() => {
    const apiOpts = (taxCalculationModes || []).map((m) => ({ label: m.label || m.code, value: m.code || m.label }));
    if (selectedCalcValue && !apiOpts.some((o) => o.value === selectedCalcValue || o.label === selectedCalcValue)) {
      apiOpts.unshift({ label: selectedCalcValue, value: selectedCalcValue });
    }
    return apiOpts;
  }, [taxCalculationModes, selectedCalcValue]);

  // Helper checkToken
  const checkToken = React.useCallback(
    (val: string, items: { code: string; label: string }[], tokens: string[]) => {
      if (!val) return false;
      const cleanVal = val.toLowerCase();
      const matchObj = items.find(
        (m) => m.code === val || m.label === val || m.code?.toLowerCase() === cleanVal || m.label?.toLowerCase() === cleanVal
      );
      const code = (matchObj?.code || '').toLowerCase();
      const label = (matchObj?.label || '').toLowerCase();
      return tokens.some((t) => cleanVal.includes(t) || code.includes(t) || label.includes(t));
    },
    []
  );

  const shouldShowUseDate = useMemo(() => !checkToken(taxStartsFrom || selectedTaxStartValue, taxStartModes, ['fixed', 'policy', 'look-back', 'lookback', 'construction', 'later']), [taxStartsFrom, selectedTaxStartValue, taxStartModes, checkToken]);
  const isFixedPolicyDate = useMemo(() => checkToken(taxStartsFrom || selectedTaxStartValue, taxStartModes, ['fixed', 'policy']), [taxStartsFrom, selectedTaxStartValue, taxStartModes, checkToken]);
  const isAfterSpecifiedMonths = useMemo(() => checkToken(taxStartsFrom || selectedTaxStartValue, taxStartModes, ['after', 'specified', 'months_after']), [taxStartsFrom, selectedTaxStartValue, taxStartModes, checkToken]);
  const isEarliestChargeable = useMemo(() => checkToken(retrospectiveLimit || selectedLimitValue, limitTypes, ['earliest', 'chargeable', 'allowed', 'fixed_cutoff']), [retrospectiveLimit, selectedLimitValue, limitTypes, checkToken]);
  const isMaxYears = useMemo(() => checkToken(retrospectiveLimit || selectedLimitValue, limitTypes, ['max', 'years']), [retrospectiveLimit, selectedLimitValue, limitTypes, checkToken]);
  const isSplitMultiplier = useMemo(() => checkToken(taxCalculation || selectedCalcValue, taxCalculationModes, ['different', 'split', 'two dates']), [taxCalculation, selectedCalcValue, taxCalculationModes, checkToken]);

  const taxCalcColSpan = useMemo(() => {
    const hasLimitField = isEarliestChargeable || isMaxYears || isFixedPolicyDate;
    if (!hasLimitField && isSplitMultiplier) return 'sm:col-span-2 lg:col-span-3';
    if (hasLimitField && isSplitMultiplier) return 'sm:col-span-2';
    return 'sm:col-span-1';
  }, [isEarliestChargeable, isMaxYears, isFixedPolicyDate, isSplitMultiplier]);

  return (
    <section id="section-actions" className="bg-white rounded-xl border border-gray-200/90 shadow-2xs flex flex-col flex-1 h-full">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100">
            <Zap className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-gray-900">{t('title')}</h2>
            <p className="text-[11px] text-gray-500">{t('subtitle')}</p>
          </div>
        </div>
        <Badge variant="destructive" size="sm" className="font-bold tracking-wider">
          {t('badge')}
        </Badge>
      </div>

      <div className="p-2.5 space-y-2 flex flex-col">
        <RetrospectiveTaxForm
          t={t}
          getLabel={getLabel}
          taxStartOptions={taxStartOptions}
          useDateDropdownOptions={useDateDropdownOptions}
          limitOptions={limitOptions}
          taxCalcOptions={taxCalcOptions}
          selectedTaxStartValue={selectedTaxStartValue}
          onTaxStartsFromChange={onTaxStartsFromChange}
          selectedUseDateValue={selectedUseDateValue}
          onUseDateChange={onUseDateChange}
          selectedLimitValue={selectedLimitValue}
          onRetrospectiveLimitChange={onRetrospectiveLimitChange}
          selectedCalcValue={selectedCalcValue}
          onTaxCalculationChange={onTaxCalculationChange}
          offsetMonths={offsetMonths}
          onOffsetMonthsChange={onOffsetMonthsChange}
          earliestAllowedDate={earliestAllowedDate}
          onEarliestAllowedDateChange={onEarliestAllowedDateChange}
          maximumYears={maximumYears}
          onMaximumYearsChange={onMaximumYearsChange}
          taxMultiplier={taxMultiplier}
          onTaxMultiplierChange={onTaxMultiplierChange}
          shouldShowUseDate={shouldShowUseDate}
          isFixedPolicyDate={isFixedPolicyDate}
          isAfterSpecifiedMonths={isAfterSpecifiedMonths}
          isEarliestChargeable={isEarliestChargeable}
          isMaxYears={isMaxYears}
          isSplitMultiplier={isSplitMultiplier}
          taxCalcColSpan={taxCalcColSpan}
          isLoading={isLoading}
          formErrors={formErrors}
        />

        {isSplitMultiplier && (
          <SplitPeriodTaxSection
            getLabel={getLabel}
            evidenceDateOptions={useDateDropdownOptions}
            evidenceEndDateOptions={useDateDropdownOptions}
            selectedSplitStartsFromValue={selectedSplitStartsFromValue}
            onSplitHigherRateStartsFromChange={onSplitHigherRateStartsFromChange}
            selectedSplitContinuesUpToValue={selectedSplitContinuesUpToValue}
            onSplitHigherRateContinuesUpToChange={onSplitHigherRateContinuesUpToChange}
            duringPeriodMultiplier={duringPeriodMultiplier}
            onDuringPeriodMultiplierChange={onDuringPeriodMultiplierChange}
            afterPeriodMultiplier={afterPeriodMultiplier}
            onAfterPeriodMultiplierChange={onAfterPeriodMultiplierChange}
            isLoading={isLoading}
            formErrors={formErrors}
          />
        )}

        <UnauthorizedPenaltyBanner isAuthorized={isAuthorized} t={t} />

        <ActionsRuleSummary
          t={t}
          availableEvidence={availableEvidence}
          compareEvidenceDates={compareEvidenceDates}
          isSplitMultiplier={isSplitMultiplier}
          splitHigherRateStartsFrom={splitHigherRateStartsFrom}
          splitHigherRateContinuesUpTo={splitHigherRateContinuesUpTo}
          duringPeriodMultiplier={duringPeriodMultiplier}
          afterPeriodMultiplier={afterPeriodMultiplier}
          maximumYears={maximumYears}
          taxMultiplier={taxMultiplier}
          isAuthorized={isAuthorized}
        />
      </div>
    </section>
  );
});

ActionsSection.displayName = 'ActionsSection';
