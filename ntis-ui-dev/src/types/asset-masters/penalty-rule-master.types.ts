export interface RawPenaltyRule {
  id?: number;
  penaltyCode?: string;
  penaltyName?: string;
  calculationType?: string;
  penaltyValue?: number;
  gracePeriodDays?: number;
  isActive?: boolean;
  createdDate?: string | null;
  updatedDate?: string | null;
  createdBy?: number | null;
  updatedBy?: number | null;
}

export interface PenaltyRule {
  [key: string]: unknown;
  id: number;
  penaltyCode: string;
  penaltyName: string;
  calculationType: string;
  penaltyValue: number;
  gracePeriodDays: number;
  isActive: boolean;
  createdDate?: string | null;
  updatedDate?: string | null;
  createdBy?: number | null;
  updatedBy?: number | null;
}

export interface PenaltyRuleFormModel {
  id?: number | null;
  penaltyCode: string;
  penaltyName: string;
  calculationType: string;
  penaltyValue: number | string;
  gracePeriodDays: number | string;
  isActive: boolean;
  createdBy?: number;
  updatedBy?: number;
}

export interface PenaltyRuleProps {
  data: PenaltyRule[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  sortBy?: string;
  sortOrder?: string;
  searchTerm?: string;
}
