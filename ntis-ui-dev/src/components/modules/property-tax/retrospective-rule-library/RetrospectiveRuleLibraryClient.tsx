'use client';
/* eslint-disable i18next/no-literal-string */

import React from 'react';
import type { RetrospectiveRuleLibraryProps, RetrospectiveRule } from '@/types/retrospective-rule.types';
import { useRetrospectiveRules } from '@/hooks/retrospective-rule-library/useRetrospectiveRules';
import { ConfirmProvider } from '@/components/common';
import { RetrospectiveRuleHeader } from './RetrospectiveRuleHeader';
import { DefaultDateRulesSection } from './DefaultDateRulesSection';
import { RetrospectiveRuleBuilder } from './RetrospectiveRuleBuilder';

export const RetrospectiveRuleLibraryClient: React.FC<RetrospectiveRuleLibraryProps> = ({
  initialRules,
  initialStats,
  fetchError,
  initialTaxationData,
  initialActionData,
  initialComparatorCodes,
}) => {
  const {
    rules,
    filterState,
    viewMode,
    builderMode,
    selectedRule,
    handleCorporationFilterChange,
    openCreateRuleBuilder,
    openEditRuleBuilder,
    backToLibrary,
    handlePublishRule,
    handleExportJson,
  } = useRetrospectiveRules({
    initialRules,
    initialStats,
  });

  return (
    <ConfirmProvider>
      {viewMode === 'builder' ? (
        <RetrospectiveRuleBuilder
          rule={selectedRule}
          mode={builderMode}
          onBack={backToLibrary}
          onPublish={handlePublishRule}
          initialTaxationData={initialTaxationData}
          initialActionData={initialActionData}
          initialComparatorCodes={initialComparatorCodes}
        />
      ) : (
        <div className="bg-slate-50/50 p-3 sm:p-4 w-full">
          <div className="w-full space-y-3">
            {/* Error Banner if API error occurs */}
            {fetchError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm font-medium">
                ⚠️ {fetchError}
              </div>
            )}

            {/* Top Header */}
            <RetrospectiveRuleHeader
              selectedCorporation={filterState.corporationFilter}
              onCorporationChange={handleCorporationFilterChange}
              onExportJson={handleExportJson}
              onCreateRule={openCreateRuleBuilder}
            />

            {/* Default Date Rules Section */}
            <DefaultDateRulesSection
              initialRules={rules}
              onEditRule={(ruleItem) => {
                const existingRule = rules.find((r) => r.id === ruleItem.id);
                const isAuth = ruleItem.appliesTo.toLowerCase().includes('authorized');
                const targetRule: RetrospectiveRule = existingRule || {
                  id: ruleItem.id,
                  ruleCode: ruleItem.ruleCode || `RULE-${ruleItem.priority}`,
                  ruleTitle: ruleItem.ruleName,
                  conditionDescription: ruleItem.condition,
                  evidenceCategory: isAuth
                    ? 'Authorized: OC or CC available'
                    : 'Unauthorized: OC & CC unavailable',
                  startLogicTitle: ruleItem.defaultDateLogic,
                  startLogicBoundary: ruleItem.effectiveFrom,
                  commonTaxationBadge: 'Current-year for all years',
                  commonTaxationDescription: 'Current-year percentage for all years',
                  unauthorizedPenalty: isAuth
                    ? 'Not applicable — OC/CC available'
                    : 'Apply penalty as per the Act',
                  status: ruleItem.status,
                  priorityNo: ruleItem.priority,
                  availableEvidence: [],
                  unavailableEvidence: [],
                  compareEvidenceDates: '',
                  taxStartsFrom: '',
                  retrospectiveLimit: '',
                  maximumYears: '',
                  taxCalculation: '',
                  taxMultiplier: '',
                };
                openEditRuleBuilder(targetRule);
              }}
            />
          </div>
        </div>
      )}
    </ConfirmProvider>
  );
};
