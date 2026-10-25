import { RetrospectiveRuleLibrary } from '@/components/modules/property-tax/retrospective-rule-library';
import {
  getRetrospectiveRulesAction,
  getRateModesAction,
  getPercentageModesAction,
  getTaxPolicyAction,
  getTaxStartModesAction,
  getUseDateOptionsAction,
  getRetrospectiveLimitTypesAction,
  getTaxCalculationModesAction,
  getComparatorCodesAction,
} from './action';

export const dynamic = 'force-dynamic';

export default async function RetrospectiveRuleLibraryPage() {
  const [
    rulesResult,
    rateModesResult,
    percentageModesResult,
    taxPolicyResult,
    taxStartModesResult,
    useDateOptionsResult,
    limitTypesResult,
    taxCalculationModesResult,
    comparatorCodesResult,
  ] = await Promise.all([
    getRetrospectiveRulesAction(),
    getRateModesAction(),
    getPercentageModesAction(),
    getTaxPolicyAction(),
    getTaxStartModesAction(),
    getUseDateOptionsAction(),
    getRetrospectiveLimitTypesAction(),
    getTaxCalculationModesAction(),
    getComparatorCodesAction(),
  ]);

  return (
    <RetrospectiveRuleLibrary
      initialRules={rulesResult.data || []}
      initialStats={rulesResult.stats}
      fetchError={rulesResult.error}
      initialTaxationData={{
        rateModes: rateModesResult.data || [],
        percentageModes: percentageModesResult.data || [],
        activePolicy: (taxPolicyResult.data as { rateMode: string; percentageMode: string; [key: string]: unknown }) || null,
      }}
      initialActionData={{
        taxStartModes: taxStartModesResult.data || [],
        useDateOptions: useDateOptionsResult.data || [],
        limitTypes: limitTypesResult.data || [],
        taxCalculationModes: taxCalculationModesResult.data || [],
      }}
      initialComparatorCodes={comparatorCodesResult.data || []}
    />
  );
}

