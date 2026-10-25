'use client';
/* eslint-disable i18next/no-literal-string */

import React, { useCallback } from 'react';
import type {
  RetrospectiveRule,
  CreateRetrospectiveRuleInput,
  InitialTaxationData,
  InitialActionData,
  RuleComparatorCodeItem,
} from '@/types/retrospective-rule.types';
import { useRetrospectiveRuleBuilder } from '@/hooks/retrospective-rule-library/useRetrospectiveRuleBuilder';
import { RetrospectiveRuleBuilderHeader } from './builder-sections/RetrospectiveRuleBuilderHeader';
import { TaxationSection } from './builder-sections/TaxationSection';
import { ConditionsSection } from './builder-sections/ConditionsSection';
import { ActionsSection } from './builder-sections/ActionsSection';
import { RetrospectiveRuleBuilderFooter } from './builder-sections/RetrospectiveRuleBuilderFooter';

interface RetrospectiveRuleBuilderProps {
  rule: RetrospectiveRule | null;
  mode: 'create' | 'edit';
  onBack: () => void;
  onPublish: (input: CreateRetrospectiveRuleInput) => Promise<{ success: boolean; errors: Record<string, string> }>;
  initialTaxationData?: InitialTaxationData;
  initialActionData?: InitialActionData;
  initialComparatorCodes?: RuleComparatorCodeItem[];
}

export const RetrospectiveRuleBuilder: React.FC<RetrospectiveRuleBuilderProps> = ({
  rule,
  mode,
  onBack,
  onPublish,
  initialTaxationData,
  initialActionData,
  initialComparatorCodes,
}) => {
  const {
    isDirty,
    taxationRate,
    setTaxationRate,
    taxPercentage,
    setTaxPercentage,
    ruleName,
    setRuleName,
    ruleCode,
    availableEvidence,
    unavailableEvidence,
    compareEvidenceDates,
    setCompareEvidenceDates,
    taxStartsFrom,
    setTaxStartsFrom,
    useDate,
    setUseDate,
    offsetMonths,
    setOffsetMonths,
    retrospectiveLimit,
    setRetrospectiveLimit,
    earliestAllowedDate,
    setEarliestAllowedDate,
    maximumYears,
    setMaximumYears,
    taxCalculation,
    setTaxCalculation,
    taxMultiplier,
    setTaxMultiplier,
    splitHigherRateStartsFrom,
    setSplitHigherRateStartsFrom,
    splitHigherRateContinuesUpTo,
    setSplitHigherRateContinuesUpTo,
    duringPeriodMultiplier,
    setDuringPeriodMultiplier,
    afterPeriodMultiplier,
    setAfterPeriodMultiplier,
    formErrors,
    testNotification,
    isAuthorized,
    toggleAvailableEvidence,
    toggleUnavailableEvidence,
    handlePublishClick,
    handleSaveTaxation,
    clearTestNotification,
  } = useRetrospectiveRuleBuilder({ rule, mode, onBack, onPublish });

  const handleSaveDraft = useCallback(() => {
    handlePublishClick(mode === 'edit' ? rule?.status || 'Active' : 'Draft');
  }, [handlePublishClick, mode, rule]);

  return (
    <div className="w-full bg-gray-50/60 pb-1">
      {/* Sticky Header */}
      <RetrospectiveRuleBuilderHeader onBack={onBack} />

      <div className="w-full p-2.5 space-y-2 mt-0.5">
        {/* Scenario Test Notification Banner */}
        {testNotification && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-semibold flex items-center justify-between shadow-xs">
            <span>{testNotification}</span>
            <button onClick={clearTestNotification} className="text-emerald-700 font-bold text-sm">✕</button>
          </div>
        )}

        {/* Server / Form Submit Error Banner */}
        {formErrors.submit && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold flex items-center justify-between shadow-xs">
            <span>⚠️ {formErrors.submit}</span>
          </div>
        )}

        {/* Section 1: Taxation Rate & Percentage */}
        <TaxationSection
          taxationRate={taxationRate}
          onTaxationRateChange={setTaxationRate}
          taxPercentage={taxPercentage}
          onTaxPercentageChange={setTaxPercentage}
          onSaveTaxation={handleSaveTaxation}
          mode={mode}
          initialData={initialTaxationData}
        />

        {/* Sections 2 & 3: Conditions and Actions side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 items-stretch">
          {/* Section 2: Conditions */}
          <ConditionsSection
            ruleName={ruleName}
            onRuleNameChange={setRuleName}
            availableEvidence={availableEvidence}
            unavailableEvidence={unavailableEvidence}
            onToggleAvailable={toggleAvailableEvidence}
            onToggleUnavailable={toggleUnavailableEvidence}
            compareEvidenceDates={compareEvidenceDates}
            onCompareDatesChange={setCompareEvidenceDates}
            isAuthorized={isAuthorized}
            formError={formErrors.ruleTitle}
            compareDatesError={formErrors.compareEvidenceDates}
            initialComparatorCodes={initialComparatorCodes}
          />

          {/* Section 3: Actions */}
          <ActionsSection
            taxStartsFrom={taxStartsFrom}
            onTaxStartsFromChange={setTaxStartsFrom}
            useDate={useDate}
            onUseDateChange={setUseDate}
            offsetMonths={offsetMonths}
            onOffsetMonthsChange={(val) => setOffsetMonths(val as number | '')}
            retrospectiveLimit={retrospectiveLimit}
            onRetrospectiveLimitChange={setRetrospectiveLimit}
            earliestAllowedDate={earliestAllowedDate}
            onEarliestAllowedDateChange={setEarliestAllowedDate}
            maximumYears={maximumYears}
            onMaximumYearsChange={(val) => setMaximumYears(val as number | '')}
            taxCalculation={taxCalculation}
            onTaxCalculationChange={setTaxCalculation}
            taxMultiplier={taxMultiplier}
            onTaxMultiplierChange={(val) => setTaxMultiplier(val as number | '')}
            splitHigherRateStartsFrom={splitHigherRateStartsFrom}
            onSplitHigherRateStartsFromChange={setSplitHigherRateStartsFrom}
            splitHigherRateContinuesUpTo={splitHigherRateContinuesUpTo}
            onSplitHigherRateContinuesUpToChange={setSplitHigherRateContinuesUpTo}
            duringPeriodMultiplier={duringPeriodMultiplier}
            onDuringPeriodMultiplierChange={(val) => setDuringPeriodMultiplier(val as number | '')}
            afterPeriodMultiplier={afterPeriodMultiplier}
            onAfterPeriodMultiplierChange={(val) => setAfterPeriodMultiplier(val as number | '')}
            isAuthorized={isAuthorized}
            ruleCode={ruleCode}
            availableEvidence={availableEvidence}
            compareEvidenceDates={compareEvidenceDates}
            formErrors={formErrors}
            initialData={initialActionData}
          />
        </div>

        {/* Bottom Action Footer */}
        <RetrospectiveRuleBuilderFooter
          onSaveDraft={handleSaveDraft}
          mode={mode}
          isDirty={isDirty}
        />
      </div>
    </div>
  );
};
