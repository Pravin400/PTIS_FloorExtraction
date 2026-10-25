import { apiClient } from '@/services/api.service';
import { RuleItem, RuleListResponse, DryRunResult } from '@/types/rule-engine';
import { ApiResponse } from '@/types/common.types';

interface BackendRuleDto {
  id?: number;
  ruleCode?: string;
  ruleName?: string;
  ruleScopeId?: number;
  ruleScopeName?: string;
  propertyRuleEvaluationMasterId?: number;
  subRules?: RuleItem['subRules'];
  isEnabled?: boolean;
  conditionsJson?: string;
  effectJson?: string;
  targetFiltersJson?: string;
  description?: string;
  ruleCategory?: string;
  createdDate?: string;
  updatedDate?: string;
  priority?: number;
  stopProcessing?: boolean;
  skipRuleIds?: number[];
  exclusionReason?: string;
  ruleJson?: string;
}

interface RuleEngineBackendResponse {
  items?: BackendRuleDto[];
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
  hasPreviousPage?: boolean;
  hasPrevious?: boolean;
  hasNextPage?: boolean;
  hasNext?: boolean;
}

interface RuleResponseData {
  data?: BackendRuleDto;
  id?: number;
  ruleCode?: string;
  ruleName?: string;
  ruleScopeId?: number;
  ruleScopeName?: string;
  propertyRuleEvaluationMasterId?: number;
  subRules?: RuleItem['subRules'];
  isEnabled?: boolean;
  conditionsJson?: string;
  effectJson?: string;
  targetFiltersJson?: string;
  description?: string;
  ruleCategory?: string;
  createdDate?: string;
  updatedDate?: string;
  priority?: number;
  stopProcessing?: boolean;
  skipRuleIds?: number[];
  exclusionReason?: string;
  ruleJson?: string;
}

/**
 * Maps a backend RuleEngineDto to the frontend's visual RuleItem structure.
 * Reads conditionsJson/effectJson/targetFiltersJson directly from separate backend columns.
 */
function mapBackendDtoToRuleItem(dto: BackendRuleDto): RuleItem {
  const dtoWithActive = dto as BackendRuleDto & { isActive?: boolean };
  return {
    id: dto.id,
    ruleCode: dto.ruleCode || '',
    ruleName: dto.ruleName || '',
    ruleScopeId: dto.ruleScopeId || 0,
    ruleScopeName: dto.ruleScopeName,
    propertyRuleEvaluationMasterId: dto.propertyRuleEvaluationMasterId,
    subRules: dto.subRules,
    isActive: dto.isEnabled !== undefined ? !!dto.isEnabled : dtoWithActive.isActive !== undefined ? !!dtoWithActive.isActive : false,
    conditionsJson: dto.conditionsJson ?? '',
    effectJson: dto.effectJson ?? '',
    ruleJson: dto.ruleJson,
    targetFiltersJson: dto.targetFiltersJson ?? '',
    description: dto.description || '',
    ruleCategory: dto.ruleCategory || '',
    createdDate: dto.createdDate,
    updatedDate: dto.updatedDate,
    priority: dto.priority,
    stopProcessing: dto.stopProcessing,
    skipRuleIds: dto.skipRuleIds,
    exclusionReason: dto.exclusionReason,
  };
}


/**
 * Maps a frontend visual RuleItem to the backend Create/Update DTO.
 */
function mapRuleItemToBackendPayload(item: RuleItem, userId: number = 1) {
  return {
    ruleCode: item.ruleCode || '',
    ruleName: item.ruleName,
    description: item.description || '',
    ruleScopeId: item.ruleScopeId || 0,
    propertyRuleEvaluationMasterId: item.propertyRuleEvaluationMasterId || 0,
    ruleCategory: item.ruleCategory,
    conditionsJson: item.conditionsJson,
    effectJson: item.effectJson,
    targetFiltersJson: item.targetFiltersJson,
    isEnabled: item.isActive,
    changeReason: item.changeReason,
    isActive: item.isActive,
    createdBy: userId,
    updatedBy: userId,
    priority: item.priority,
    stopProcessing: item.stopProcessing,
    skipRuleIds: item.skipRuleIds,
    exclusionReason: item.exclusionReason,
    ...(item.ruleJson ? { ruleJson: item.ruleJson } : {}),
  };
}


/**
 * Fetches paginated rules from /api/RuleEngine endpoint.
 */
export async function getRules(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  _policyTypeId?: number,
  ruleScopeId?: number
): Promise<RuleListResponse> {
  const params = new URLSearchParams();
  params.set('PageNumber', pageNumber.toString());
  params.set('PageSize', pageSize.toString());

  if (searchTerm) params.set('SearchTerm', searchTerm);
  if (ruleScopeId) params.set('RuleScopeId', ruleScopeId.toString());

  const response = await apiClient.get<RuleEngineBackendResponse>(`/RuleEngine?${params.toString()}`);
  if (!response.success || !response.data) {
    return {
      items: [],
      totalCount: 0,
      pageNumber,
      pageSize,
      totalPages: 0,
      hasPrevious: false,
      hasNext: false,
    };
  }

  const normalizedItems = (response.data.items || []).map((item) => mapBackendDtoToRuleItem(item));

  return {
    items: normalizedItems,
    totalCount: response.data.totalCount || 0,
    pageNumber: response.data.pageNumber || pageNumber,
    pageSize: response.data.pageSize || pageSize,
    totalPages: response.data.totalPages || 0,
    hasPrevious: response.data.hasPreviousPage ?? response.data.hasPrevious ?? false,
    hasNext: response.data.hasNextPage ?? response.data.hasNext ?? false,
  };
}

/**
 * Fetches lightweight summary rules from /api/RuleEngine/summary endpoint.
 */
export async function getRulesSummary(
  pageNumber: number,
  pageSize: number,
  searchTerm?: string,
  ruleScopeId?: number
): Promise<RuleListResponse> {
  const params = new URLSearchParams();
  params.set('PageNumber', pageNumber.toString());
  params.set('PageSize', pageSize.toString());

  if (searchTerm) params.set('SearchTerm', searchTerm);
  if (ruleScopeId) params.set('RuleScopeId', ruleScopeId.toString());

  const response = await apiClient.get<RuleEngineBackendResponse>(`/RuleEngine/summary?${params.toString()}`);
  if (!response.success || !response.data) {
    return {
      items: [],
      totalCount: 0,
      pageNumber,
      pageSize,
      totalPages: 0,
      hasPrevious: false,
      hasNext: false,
    };
  }

  const normalizedItems = (response.data.items || []).map((item) => mapBackendDtoToRuleItem(item));

  return {
    items: normalizedItems,
    totalCount: response.data.totalCount || 0,
    pageNumber: response.data.pageNumber || pageNumber,
    pageSize: response.data.pageSize || pageSize,
    totalPages: response.data.totalPages || 0,
    hasPrevious: response.data.hasPreviousPage ?? response.data.hasPrevious ?? false,
    hasNext: response.data.hasNextPage ?? response.data.hasNext ?? false,
  };
}

/**
 * Fetches a single rule config by ID from /api/RuleEngine/{id}.
 */
export async function getRuleById(id: number | string): Promise<RuleItem | null> {
  const response = await apiClient.get<RuleResponseData>(`/RuleEngine/${id}`);
  if (!response.success || !response.data) return null;

  const dto = response.data.data || response.data;
  return mapBackendDtoToRuleItem(dto);
}

/**
 * Creates a new policy rule under /api/RuleEngine.
 */
export async function createRule(
  payload: RuleItem,
  userId: number = 1
): Promise<{ success: boolean; message: string; data?: RuleItem }> {
  const backendPayload = mapRuleItemToBackendPayload(payload, userId);
  const response = await apiClient.post<RuleResponseData>('/RuleEngine', backendPayload);
  if (!response.success || !response.data) {
    return { success: false, message: response.error || 'Failed to create rule' };
  }
  return {
    success: true,
    message: 'Rule created successfully',
    data: mapBackendDtoToRuleItem(response.data.data || response.data),
  };
}

/**
 * Updates an existing rule configuration under /api/RuleEngine/{id}.
 */
export async function updateRule(
  id: number | string,
  payload: RuleItem,
  userId: number = 1
): Promise<{ success: boolean; message: string; data?: RuleItem }> {
  const backendPayload = mapRuleItemToBackendPayload(payload, userId);
  const response = await apiClient.put<RuleResponseData>(`/RuleEngine/${id}`, backendPayload);
  if (!response.success || !response.data) {
    return { success: false, message: response.error || 'Failed to update rule' };
  }
  return {
    success: true,
    message: 'Rule updated successfully',
    data: mapBackendDtoToRuleItem(response.data.data || response.data),
  };
}

/**
 * Purges/deletes a rule by ID under /api/RuleEngine/{id}.
 */
export async function deleteRule(id: number | string): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.delete<null>(`/RuleEngine/${id}`);
  if (!response.success) {
    return { success: false, message: response.error || 'Failed to delete rule' };
  }
  return { success: true, message: 'Rule deleted successfully' };
}

/**
 * Performs a trace dry-run of a category and inputs.
 */
export async function dryRunRule(
  category: string,
  input: Record<string, unknown>,
  ruleJson?: string
): Promise<ApiResponse<DryRunResult>> {
  const response = await apiClient.post<DryRunResult>('/RuleEngine/dry-run', {
    category,
    input,
    ruleJson,
  });
  return response;
}


