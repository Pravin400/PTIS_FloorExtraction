export interface RuleScope {
  id: number;
  scopeName: string;
  description?: string;
}

export interface PolicyType {
  id: number;
  typeName: string;
  description?: string;
}

export interface TargetFilterState {
  propertyTypes?: string[];
  constructionTypes?: string[];
  zones?: string[];
  usageTypes?: string[];
}

export interface SkipRuleRef {
  ruleId: number;
  ruleCode: string;
  ruleName: string;
  reason?: string;
}

export interface RuleItem {
  id?: number;
  ruleName: string;
  ruleCode: string;
  policyTypeId?: number;
  ruleScopeId: number;
  isActive: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  conditionsJson: string;
  effectJson: string;
  ruleJson?: string;
  targetFiltersJson?: string;
  createdDate?: string;
  updatedDate?: string;
  description?: string;
  ruleCategory?: string;
  changeReason?: string;
  createdBy?: number;
  updatedBy?: number;
  priority?: number;
  isEnabled?: boolean;
  stopProcessing?: boolean;
  skipRuleIds?: number[];
  exclusionReason?: string;
  skipRules?: SkipRuleRef[];
  propertyRuleEvaluationMasterId?: number;
  ruleScopeName?: string;
  subRules?: {
    id: string;
    description: string | null;
    isEnabled: boolean;
    stopProcessing: boolean;
  }[];
}

export interface RuleListResponse {
  items: RuleItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}
