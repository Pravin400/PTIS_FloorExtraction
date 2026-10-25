'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getRules, getRulesSummary, getRuleById, createRule, updateRule, deleteRule, dryRunRule } from '@/lib/api/rule-engine/rule.service';
import {
  getFieldConfigurations, getScopes, getCorporations,
  getEffectTypes, getEffectTypeConfigs, getRateSections, getRuleCategories, getDynamicFieldOptions,
  createRuleField, updateRuleField, deleteRuleField
} from '@/lib/api/rule-engine/config.service';
import { RuleItem } from '@/types/rule-engine';
import { createLogger } from '@/lib/utils/server-logger';

const logger = createLogger('rule-engine:actions');

/** Server Action: Fetches paginated lightweight list of policy rules summary. */
export async function fetchRulesPagedAction(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  _policyTypeId?: number,
  ruleScopeId?: number
) {
  try {
    return await getRulesSummary(pageNumber, pageSize, searchTerm, ruleScopeId);
  } catch (error) {
    logger.error('fetchRulesPagedAction failed', { operation: 'fetchRulesPagedAction' }, error);
    return { items: [], totalCount: 0, pageNumber, pageSize, totalPages: 0, hasPrevious: false, hasNext: false };
  }
}

/** Server Action: Fetches full details of a specific rule configuration by ID. */
export async function fetchRuleByIdAction(id: number) {
  try {
    return await getRuleById(id);
  } catch (error) {
    logger.error('fetchRuleByIdAction failed', { operation: 'fetchRuleByIdAction', id }, error);
    return null;
  }
}

/** Server Action: Fetches full rule configurations including heavy JSON blobs for a scope. */
export async function fetchFullRulesAction(ruleScopeId?: number) {
  try {
    return await getRules(1, 500, undefined, undefined, ruleScopeId);
  } catch (error) {
    logger.error('fetchFullRulesAction failed', { operation: 'fetchFullRulesAction', ruleScopeId }, error);
    return { items: [], totalCount: 0, pageNumber: 1, pageSize: 500, totalPages: 0, hasPrevious: false, hasNext: false };
  }
}

/**
 * Server Action: Fetches all active rules as flat {label, value} pairs for the
 * "Skip Rules" MultiSelect in StopProcessingPanel.
 */
export async function fetchAllRulesForSkipAction(): Promise<{ label: string; value: string }[]> {
  try {
    const result = await getRules(1, 500);
    return (result.items ?? []).map((r) => ({
      label: r.description
        ? `[${r.ruleCode}] ${r.ruleName} — ${r.description}`
        : `[${r.ruleCode}] ${r.ruleName}`,
      value: String(r.id),
    }));
  } catch (error) {
    logger.error('fetchAllRulesForSkipAction failed', { operation: 'fetchAllRulesForSkipAction' }, error);
    return [];
  }
}


/** Server Action: Fetches scope-specific field metadata for visual builder inputs. */
export async function fetchFieldsForScopeAction(scopeId: number) {
  try {
    return await getFieldConfigurations(scopeId);
  } catch (error) {
    logger.error('fetchFieldsForScopeAction failed', { operation: 'fetchFieldsForScopeAction', scopeId }, error);
    return [];
  }
}

/** Server Action: Fetches active evaluation scopes. */
export async function fetchScopesAction() {
  try {
    return await getScopes();
  } catch (error) {
    logger.error('fetchScopesAction failed', { operation: 'fetchScopesAction' }, error);
    return [];
  }
}


/**
 * Server Action: Saves a rule (creates when no ID, updates when ID > 0).
 * Reads user_id from the auth cookie for audit trail.
 */
export async function saveRuleAction(payload: RuleItem) {
  try {
    const cookieStore = await cookies();
    const userIdVal = cookieStore.get('user_id')?.value;
    const userId = userIdVal ? parseInt(userIdVal, 10) : NaN;

    if (!Number.isFinite(userId) || userId <= 0) {
      return { success: false, message: 'Unable to determine authenticated user.' };
    }

    let result;
    if (payload.id && payload.id > 0) {
      result = await updateRule(payload.id, payload, userId);
    } else {
      result = await createRule(payload, userId);
    }

    if (result.success) {
      revalidatePath('/[locale]/property-tax/rule-engine', 'page');
    }
    return result;
  } catch (error) {
    logger.error('saveRuleAction failed', { operation: 'saveRuleAction', ruleId: payload.id }, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Server Action failed to save rule',
    };
  }
}

/** Server Action: Deletes a rule by ID. */
export async function deleteRuleAction(id: number) {
  try {
    const result = await deleteRule(id);
    if (result.success) {
      revalidatePath('/[locale]/property-tax/rule-engine', 'page');
    }
    return result;
  } catch (error) {
    logger.error('deleteRuleAction failed', { operation: 'deleteRuleAction', id }, error);
    return { success: false, message: error instanceof Error ? error.message : 'Server Action failed to delete rule' };
  }
}

/** Server Action: Fetches active corporations/ULBs. */
export async function fetchCorporationsAction() {
  try {
    return await getCorporations();
  } catch (error) {
    logger.error('fetchCorporationsAction failed', { operation: 'fetchCorporationsAction' }, error);
    return [];
  }
}

/** Server Action: Fetches active rule effect types. */
export async function fetchEffectTypesAction() {
  try {
    return await getEffectTypes();
  } catch (error) {
    logger.error('fetchEffectTypesAction failed', { operation: 'fetchEffectTypesAction' }, error);
    return [];
  }
}

/** Server Action: Fetches active rule effect type configurations. */
export async function fetchEffectTypeConfigsAction() {
  try {
    return await getEffectTypeConfigs();
  } catch (error) {
    logger.error('fetchEffectTypeConfigsAction failed', { operation: 'fetchEffectTypeConfigsAction' }, error);
    return [];
  }
}

/** Server Action: Fetches active rate sections for categories. */
export async function fetchRateSectionsAction() {
  try {
    return await getRateSections();
  } catch (error) {
    logger.error('fetchRateSectionsAction failed', { operation: 'fetchRateSectionsAction' }, error);
    return [];
  }
}

/** Server Action: Fetches active rule categories from PTIS.RuleCategoryMaster. */
export async function fetchRuleCategoriesAction() {
  try {
    return await getRuleCategories();
  } catch (error) {
    logger.error('fetchRuleCategoriesAction failed', { operation: 'fetchRuleCategoriesAction' }, error);
    return [];
  }
}


/**
 * Server Action: Dynamically fetches dropdown/multiselect options from any backend endpoint.
 * Used by ValueInput when a field has hasApiSource=true.
 * When apiResponseMapping is provided, uses the structured mapper (responsePath + displayTemplate).
 * Falls back to the generic heuristic mapper when mapping is absent or null.
 */
export async function fetchDynamicFieldOptionsAction(
  endpoint: string,
  method: string = 'GET',
  params?: string,
  mapping?: string
): Promise<{ label: string; value: string }[]> {
  try {
    return await getDynamicFieldOptions(endpoint, method, params, mapping);
  } catch (error) {
    logger.error('fetchDynamicFieldOptionsAction failed', { operation: 'fetchDynamicFieldOptionsAction', endpoint }, error);
    return [];
  }
}

/** Server Action: Saves a rule field (creates when no ID / id <= 0, updates when ID > 0). */
export async function saveRuleFieldAction(id: number, payload: unknown) {
  try {
    if (id > 0) {
      return await updateRuleField(id, payload);
    }
    return await createRuleField(payload);
  } catch (error) {
    logger.error('saveRuleFieldAction failed', { operation: 'saveRuleFieldAction', id }, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Server Action failed to save rule field',
    };
  }
}

/** Server Action: Deletes a rule field by ID. */
export async function deleteRuleFieldAction(id: number) {
  try {
    return await deleteRuleField(id);
  } catch (error) {
    logger.error('deleteRuleFieldAction failed', { operation: 'deleteRuleFieldAction', id }, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Server Action failed to delete rule field',
    };
  }
}


/** Server Action: Performs a trace dry-run of a category and inputs. */
export async function dryRunRuleAction(
  category: string,
  input: Record<string, unknown>,
  ruleJson?: string
) {
  try {
    return await dryRunRule(category, input, ruleJson);
  } catch (error) {
    logger.error('dryRunRuleAction failed', { operation: 'dryRunRuleAction', category }, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Server Action failed to perform dry-run',
    };
  }
}



