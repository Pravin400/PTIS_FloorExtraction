'use server';

import {
  fetchRetrospectiveRulesServer,
  saveRetrospectiveRuleServer,
  saveTaxPolicyServer,
  fetchTaxPolicyServer,
  deleteRetrospectiveRuleServer,
  fetchRateModesServer,
  fetchPercentageModesServer,
  fetchRuleEvidenceStateServer,
  fetchTaxStartModesServer,
  fetchUseDateOptionsServer,
  fetchRetrospectiveLimitTypesServer,
  fetchTaxCalculationModesServer,
  fetchComparatorCodesServer,
  fetchRuleDetailServer,
} from '@/lib/api/retrospective-rule-library/retrospective-rule.service';
import type { ActionResult } from '@/types/common.types';
import { handleServerError } from '@/lib/utils/server-action-error-handler';
import { getUserIdFromCookies } from '@/lib/utils/cookie';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

/**
 * Server Action to fetch retrospective rules.
 */
export async function getRetrospectiveRulesAction() {
  try {
    const result = await fetchRetrospectiveRulesServer();
    if (!result.success || result.error) {
      return {
        success: false,
        data: [],
        stats: result.stats,
        error: result.error || 'Failed to fetch retrospective rules',
      };
    }
    return {
      success: true,
      data: result.data,
      stats: result.stats,
      error: undefined,
    };
  } catch (error: unknown) {
    const errRes = handleServerError(error, 'fetching retrospective rules');
    return {
      ...errRes,
      data: [],
      stats: {
        importedRulesCount: 0,
        readyActiveCount: 0,
        needReviewCount: 0,
        lookbackGuardrailYears: 6,
      },
    };
  }
}

/**
 * Server Action to save or update a retrospective rule.
 * @param ruleInput The rule data to save.
 * @param locale The current locale for revalidation.
 */
export async function saveRetrospectiveRuleAction(
  ruleInput: unknown,
  locale: string
): Promise<ActionResult<boolean>> {
  try {
    const store = await cookies();
    const userId = getUserIdFromCookies(store);

    if (!userId) {
      return {
        success: false,
        error: 'User authentication required. Please log in to perform this action.',
      };
    }

    const payload =
      typeof ruleInput === 'object' && ruleInput !== null
        ? { ...ruleInput, updatedBy: userId }
        : ruleInput;

    const response = await saveRetrospectiveRuleServer(payload);
    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to save retrospective rule',
      };
    }

    revalidatePath(`/${locale}/property-tax/retrospective-rule-library`);
    return {
      success: true,
      data: true,
    };
  } catch (error: unknown) {
    return handleServerError<boolean>(error, 'saving retrospective rule');
  }
}

/**
 * Server Action to save taxation policy.
 */
export async function saveTaxPolicyAction(
  policyInput: unknown,
  locale: string
): Promise<ActionResult<boolean>> {
  try {
    const store = await cookies();
    const userId = getUserIdFromCookies(store);

    if (!userId) {
      return {
        success: false,
        error: 'User authentication required. Please log in to perform this action.',
      };
    }

    const payload =
      typeof policyInput === 'object' && policyInput !== null
        ? { ...policyInput, updatedBy: userId }
        : policyInput;

    const response = await saveTaxPolicyServer(payload);
    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to save tax policy',
      };
    }

    revalidatePath(`/${locale}/property-tax/retrospective-rule-library`);
    return {
      success: true,
      data: true,
    };
  } catch (error: unknown) {
    return handleServerError<boolean>(error, 'saving tax policy');
  }
}

/**
 * Server Action to fetch active taxation policy.
 */
export async function getTaxPolicyAction() {
  try {
    const result = await fetchTaxPolicyServer();
    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to fetch tax policy',
      };
    }
    return {
      success: true,
      data: result.item,
    };
  } catch (error: unknown) {
    return handleServerError(error, 'fetching tax policy');
  }
}

/**
 * Server Action to delete a retrospective rule.
 * @param ruleId The ID of the rule to delete.
 * @param locale The current locale for revalidation.
 */
export async function deleteRetrospectiveRuleAction(
  ruleId: string,
  locale: string
): Promise<ActionResult<boolean>> {
  try {
    const response = await deleteRetrospectiveRuleServer(ruleId);
    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to delete retrospective rule',
      };
    }

    revalidatePath(`/${locale}/property-tax/retrospective-rule-library`);
    return {
      success: true,
      data: true,
    };
  } catch (error: unknown) {
    return handleServerError<boolean>(error, 'deleting retrospective rule');
  }
}

/**
 * Server Action to fetch tax rate modes.
 */
export async function getRateModesAction() {
  try {
    const result = await fetchRateModesServer();
    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to fetch rate modes',
      };
    }
    return {
      success: true,
      data: result.items,
    };
  } catch (error: unknown) {
    return handleServerError(error, 'fetching rate modes');
  }
}

/**
 * Server Action to fetch tax percentage modes.
 */
export async function getPercentageModesAction() {
  try {
    const result = await fetchPercentageModesServer();
    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to fetch percentage modes',
      };
    }
    return {
      success: true,
      data: result.items,
    };
  } catch (error: unknown) {
    return handleServerError(error, 'fetching percentage modes');
  }
}

/**
 * Server Action to fetch rule evidence state items.
 */
export async function getRuleEvidenceStateAction(ruleId: string) {
  if (!ruleId) {
    return {
      success: false,
      error: 'Rule ID is required to fetch rule evidence state',
    };
  }
  try {
    const result = await fetchRuleEvidenceStateServer(ruleId);
    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to fetch rule evidence state',
      };
    }
    return {
      success: true,
      data: result.items,
    };
  } catch (error: unknown) {
    return handleServerError(error, 'fetching rule evidence state');
  }
}

/**
 * Server Action to fetch tax start modes.
 */
export async function getTaxStartModesAction() {
  try {
    const result = await fetchTaxStartModesServer();
    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to fetch tax start modes',
      };
    }
    return {
      success: true,
      data: result.items,
    };
  } catch (error: unknown) {
    return handleServerError(error, 'fetching tax start modes');
  }
}

/**
 * Server Action to fetch retrospective limit types.
 */
export async function getRetrospectiveLimitTypesAction() {
  try {
    const result = await fetchRetrospectiveLimitTypesServer();
    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to fetch retrospective limit types',
      };
    }
    return {
      success: true,
      data: result.items,
    };
  } catch (error: unknown) {
    return handleServerError(error, 'fetching retrospective limit types');
  }
}

/**
 * Server Action to fetch tax calculation modes.
 */
export async function getTaxCalculationModesAction() {
  try {
    const result = await fetchTaxCalculationModesServer();
    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to fetch tax calculation modes',
      };
    }
    return {
      success: true,
      data: result.items,
    };
  } catch (error: unknown) {
    return handleServerError(error, 'fetching tax calculation modes');
  }
}

/**
 * Server Action to fetch use date options.
 */
export async function getUseDateOptionsAction() {
  try {
    const result = await fetchUseDateOptionsServer();
    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to fetch use date options',
      };
    }
    return {
      success: true,
      data: result.items,
    };
  } catch (error: unknown) {
    return handleServerError(error, 'fetching use date options');
  }
}
/**
 * Server Action to fetch comparator codes.
 */
export async function getComparatorCodesAction() {
  try {
    const result = await fetchComparatorCodesServer();
    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to fetch comparator codes',
      };
    }
    return {
      success: true,
      data: result.items,
    };
  } catch (error: unknown) {
    return handleServerError(error, 'fetching comparator codes');
  }
}

/**
 * Server Action to fetch rule detail by ID.
 */
export async function getRuleDetailAction(ruleId: string | number) {
  try {
    const result = await fetchRuleDetailServer(ruleId);
    if (!result.success) {
      return {
        success: false,
        error: result.error || `Failed to fetch detail for rule ${ruleId}`,
      };
    }
    return {
      success: true,
      data: result.data,
    };
  } catch (error: unknown) {
    return handleServerError(error, `fetching detail for rule ${ruleId}`);
  }
}
