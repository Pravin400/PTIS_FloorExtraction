import { apiClient } from '@/services/api.service';
import { RuleScope, PolicyType, EffectTypeConfig } from '@/types/rule-engine';

// ─── Scopes ───────────────────────────────────────────────────────────────────

interface ApiRuleScopeResponse {
  items: { id: number; ruleScope: string; isActive: boolean }[];
}

/** Fetches all available rule scopes from PTIS.RuleScope. */
export async function getScopes(): Promise<RuleScope[]> {
  const response = await apiClient.get<ApiRuleScopeResponse>('/RuleScope');
  if (!response.success || !response.data?.items) return [];

  return response.data.items.map((item) => ({
    id: item.id,
    scopeName: item.ruleScope,
    description: item.ruleScope,
  }));
}

// ─── Policy Types ─────────────────────────────────────────────────────────────

interface ApiPolicyTypeResponse {
  items: { id: number; policyType: string; isActive?: boolean }[];
}

/** Fetches all active policy types from the backend PolicyType endpoint. */
export async function getPolicyTypes(): Promise<PolicyType[]> {
  const response = await apiClient.get<ApiPolicyTypeResponse>('/PolicyType');
  if (!response.success || !response.data?.items) return [];
  return response.data.items
    .filter((item) => item.isActive !== false)
    .map((item) => ({ id: item.id, typeName: item.policyType, description: item.policyType }));
}

// ─── Corporations (ULBs) ──────────────────────────────────────────────────────

interface ApiULBResponse {
  items: { id: number; ulbCode: string; ulbName: string; isActive?: boolean }[];
}

/** Fetches all active ULBs/Corporations from ULBMaster. */
export async function getCorporations(): Promise<{ label: string; value: string }[]> {
  const response = await apiClient.get<ApiULBResponse>('/ULBMaster');
  if (!response.success || !response.data?.items) return [];
  return response.data.items
    .filter((item) => item.isActive !== false)
    .map((item) => ({ label: item.ulbName, value: item.ulbCode }));
}

// ─── Effect Types ─────────────────────────────────────────────────────────────

interface ApiRuleEffectTypeResponse {
  items: { id: number; effectType: string; isActive?: boolean }[];
}

/** Fetches active rule effect types from RuleEffectType. */
export async function getEffectTypes(): Promise<{ label: string; value: string }[]> {
  const response = await apiClient.get<ApiRuleEffectTypeResponse>('/RuleEffectType');
  if (!response.success || !response.data?.items) return [];
  return response.data.items
    .filter((item) => item.isActive !== false)
    .map((item) => ({ label: item.effectType, value: item.effectType }));
}

interface ApiRuleEffectTypeConfigResponse {
  items: {
    id: number;
    effectType: string;
    dataType: string;
    inputType: string;
    hasApiSource: boolean;
    apiEndpoint: string | null;
    apiMethod: string | null;
    apiParameters: string | null;
    staticApiEndpoint: string | null;
    staticApiInputType: string | null;
    staticApiMethod: string | null;
    staticApiParamter: string | null;
    staticApiResponseMapping: string | null;
    hasStaticValues: boolean;
    staticValuesJson: string | null;
    isRequired: boolean;
    defaultValue: string | null;
    validationRegex: string | null;
    minValue: number | null;
    maxValue: number | null;
    minLength: number | null;
    maxLength: number | null;
    expressionTemplate: string | null;
    isActive?: boolean;
  }[];
}

/** Fetches active rule effect type configurations from RuleEffectType. */
export async function getEffectTypeConfigs(): Promise<EffectTypeConfig[]> {
  const response = await apiClient.get<ApiRuleEffectTypeConfigResponse>('/RuleEffectType');
  if (!response.success || !response.data?.items) return [];
  return response.data.items
    .filter((item) => item.isActive !== false)
    .map((item) => ({
      effectTypeId: item.id,
      effectType: item.effectType,
      dataType: item.dataType,
      inputType: item.inputType,
      hasApiSource: item.hasApiSource,
      apiEndpoint: item.apiEndpoint,
      apiMethod: item.apiMethod,
      apiParameters: item.apiParameters,
      staticApiEndpoint: item.staticApiEndpoint,
      staticApiInputType: item.staticApiInputType,
      staticApiMethod: item.staticApiMethod,
      staticApiParamter: item.staticApiParamter,
      staticApiResponseMapping: item.staticApiResponseMapping,
      hasStaticValues: item.hasStaticValues,
      staticValuesJson: item.staticValuesJson,
      isRequired: item.isRequired,
      defaultValue: item.defaultValue,
      validationRegex: item.validationRegex,
      minValue: item.minValue !== null ? Number(item.minValue) : null,
      maxValue: item.maxValue !== null ? Number(item.maxValue) : null,
      minLength: item.minLength,
      maxLength: item.maxLength,
      expressionTemplate: item.expressionTemplate,
    }));
}

// ─── Rate Sections ────────────────────────────────────────────────────────────

interface ApiRateSectionResponse {
  items: { id: number; rateSectionNo: string; description: string; isActive?: boolean }[];
}

/** Fetches active rate sections from RateSection. */
export async function getRateSections(): Promise<{ label: string; value: string }[]> {
  const response = await apiClient.get<ApiRateSectionResponse>('/RateSection');
  if (!response.success || !response.data?.items) return [];
  return response.data.items
    .filter((item) => item.isActive !== false)
    .map((item) => ({ label: item.description || item.rateSectionNo, value: item.rateSectionNo }));
}

// ─── Rule Categories ──────────────────────────────────────────────────────────

interface ApiRuleCategoryResponse {
  items: {
    id: number;
    categoryCode: string;
    categoryName: string;
    description?: string | null;
    sortOrder: number;
    isActive?: boolean;
  }[];
}

/** Fetches active rule categories from PTIS.RuleCategoryMaster, ordered by SortOrder. */
export async function getRuleCategories(): Promise<{ label: string; value: string }[]> {
  const response = await apiClient.get<ApiRuleCategoryResponse>('/RuleCategory');
  if (!response.success || !response.data?.items) return [];
  return response.data.items
    .filter((item) => item.isActive !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({ label: item.categoryName, value: item.categoryCode }));
}

