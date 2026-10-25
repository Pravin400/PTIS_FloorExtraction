/**
 * Penalty Rule Master Types
 */

export interface PenaltyRuleMasterItem {
  id: number;
  penaltyCode: string;
  penaltyName: string;
  calculationType: string; // 'Percentage', 'FlatAmount', 'PerDay'
  penaltyValue: number;
  gracePeriodDays: number;
  isActive: boolean;
}

export type PenaltyRuleMasterPayload = Omit<PenaltyRuleMasterItem, 'id'>;

export interface PenaltyRuleMasterListParams {
  PageNumber?: number;
  PageSize?: number;
  SearchTerm?: string;
  PenaltyCode?: string;
  PenaltyName?: string;
}

export interface PenaltyRuleMasterListResponse {
  items: PenaltyRuleMasterItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
