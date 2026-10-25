import type {
  PolicyModeItem,
  PolicyModesApiResponse,
  RuleActionModeItem,
  RuleActionModesApiResponse,
  RuleComparatorCodeItem,
  RuleComparatorCodesApiResponse,
  RuleEvidenceStateItem,
  RuleEvidenceStateApiResponse,
} from '@/types/retrospective-rule.types';
import { fetchWithCertSupport } from '@/lib/api/ptis/tab/base-api';

export async function fetchRateModesServer(): Promise<{
  success: boolean;
  items: PolicyModeItem[];
  error?: string;
}> {
  try {
    const res = await fetchWithCertSupport<PolicyModesApiResponse>(
      '/RetrospectiveTaxPolicy/rate-modes'
    );
    if (res.success && res.data?.items) {
      return { success: true, items: res.data.items };
    }
    return {
      success: false,
      items: [],
      error: res.error?.message || 'Failed to fetch rate modes',
    };
  } catch (error) {
    return {
      success: false,
      items: [],
      error: error instanceof Error ? error.message : 'Failed to fetch rate modes',
    };
  }
}

export async function fetchPercentageModesServer(): Promise<{
  success: boolean;
  items: PolicyModeItem[];
  error?: string;
}> {
  try {
    const res = await fetchWithCertSupport<PolicyModesApiResponse>(
      '/RetrospectiveTaxPolicy/percentage-modes'
    );
    if (res.success && res.data?.items) {
      return { success: true, items: res.data.items };
    }
    return {
      success: false,
      items: [],
      error: res.error?.message || 'Failed to fetch percentage modes',
    };
  } catch (error) {
    return {
      success: false,
      items: [],
      error: error instanceof Error ? error.message : 'Failed to fetch percentage modes',
    };
  }
}

export async function fetchRuleEvidenceStateServer(
  ruleId: string
): Promise<{
  success: boolean;
  items: RuleEvidenceStateItem[];
  error?: string;
}> {
  try {
    const res = await fetchWithCertSupport<RuleEvidenceStateApiResponse>(
      `/RetrospectiveRuleEvidenceCondition/rule/${ruleId}/evidence-state`
    );
    if (res.success && res.data?.items) {
      return { success: true, items: res.data.items };
    }
    return {
      success: false,
      items: [],
      error: res.error?.message || 'Failed to fetch rule evidence state',
    };
  } catch (error) {
    return {
      success: false,
      items: [],
      error: error instanceof Error ? error.message : 'Failed to fetch rule evidence state',
    };
  }
}

export async function fetchTaxStartModesServer(): Promise<{
  success: boolean;
  items: RuleActionModeItem[];
  error?: string;
}> {
  try {
    const res = await fetchWithCertSupport<RuleActionModesApiResponse>(
      '/RetrospectiveRuleAction/tax-start-modes'
    );
    if (res.success && res.data?.items) {
      return { success: true, items: res.data.items };
    }
    return {
      success: false,
      items: [],
      error: res.error?.message || 'Failed to fetch tax start modes',
    };
  } catch (error) {
    return {
      success: false,
      items: [],
      error: error instanceof Error ? error.message : 'Failed to fetch tax start modes',
    };
  }
}

export async function fetchRetrospectiveLimitTypesServer(): Promise<{
  success: boolean;
  items: RuleActionModeItem[];
  error?: string;
}> {
  try {
    const res = await fetchWithCertSupport<RuleActionModesApiResponse>(
      '/RetrospectiveRuleAction/retrospective-limit-types'
    );
    if (res.success && res.data?.items) {
      return { success: true, items: res.data.items };
    }
    return {
      success: false,
      items: [],
      error: res.error?.message || 'Failed to fetch retrospective limit types',
    };
  } catch (error) {
    return {
      success: false,
      items: [],
      error: error instanceof Error ? error.message : 'Failed to fetch retrospective limit types',
    };
  }
}

export async function fetchTaxCalculationModesServer(): Promise<{
  success: boolean;
  items: RuleActionModeItem[];
  error?: string;
}> {
  try {
    const res = await fetchWithCertSupport<RuleActionModesApiResponse>(
      '/RetrospectiveRuleAction/tax-calculation-modes'
    );
    if (res.success && res.data?.items) {
      return { success: true, items: res.data.items };
    }
    return {
      success: false,
      items: [],
      error: res.error?.message || 'Failed to fetch tax calculation modes',
    };
  } catch (error) {
    return {
      success: false,
      items: [],
      error: error instanceof Error ? error.message : 'Failed to fetch tax calculation modes',
    };
  }
}

export async function fetchUseDateOptionsServer(): Promise<{
  success: boolean;
  items: RuleActionModeItem[];
  error?: string;
}> {
  try {
    const res = await fetchWithCertSupport<RuleActionModesApiResponse>(
      '/RetrospectiveRuleAction/use-date-options'
    );
    if (res.success && res.data?.items) {
      return { success: true, items: res.data.items };
    }
    return {
      success: false,
      items: [],
      error: res.error?.message || 'Failed to fetch use date options',
    };
  } catch (error) {
    return {
      success: false,
      items: [],
      error: error instanceof Error ? error.message : 'Failed to fetch use date options',
    };
  }
}

export async function fetchComparatorCodesServer(): Promise<{
  success: boolean;
  items: RuleComparatorCodeItem[];
  error?: string;
}> {
  try {
    const res = await fetchWithCertSupport<RuleComparatorCodesApiResponse>(
      '/RetrospectiveRuleDateCondition/comparator-codes'
    );
    if (res.success && res.data?.items) {
      return { success: true, items: res.data.items };
    }
    return {
      success: false,
      items: [],
      error: res.error?.message || 'Failed to fetch comparator codes',
    };
  } catch (error) {
    return {
      success: false,
      items: [],
      error: error instanceof Error ? error.message : 'Failed to fetch comparator codes',
    };
  }
}
