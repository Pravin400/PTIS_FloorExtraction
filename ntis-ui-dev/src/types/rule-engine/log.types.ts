export interface PropertyRuleLogItem {
  id: number;
  propertyId: number;
  propertyDetailsId: number;
  financeYear: number;
  ruleCategory: string;
  ruleCode: string;
  ruleName: string;
  effectType: string;
  effectValue: number;
  baseValue: number;
  computedValue: number;
  cumulativeValue: number;
  applyOrder: number;
  stopProcessing: boolean;
  appliedAt: string;
  isActive: boolean;
  markedForDeletion: boolean;
  createdDate: string;
  updatedDate: string;
  createdBy?: number | null;
  updatedBy?: number | null;
  applyRate?: number;
  ruleScopeId?: number;
  ruleScopeName?: string;
  floorId?: number | null;
  floorName?: string | null;
  typeOfUseId?: number | null;
  typeOfUseName?: string | null;
}

export interface PropertyRuleLogResponse {
  items: PropertyRuleLogItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}
