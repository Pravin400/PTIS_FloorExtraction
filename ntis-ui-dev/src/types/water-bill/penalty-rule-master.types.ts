import type { ApiResponse, PagedResponse } from "../common.types";
import type { LookupOption, FinancialYearLookupOption } from "./lookups.types";

export interface WaterPenaltyRuleDto extends Record<string, unknown> {
  penaltyRuleId?: number;
  financialYearId?: number;
  financialYearName?: string | null;
  connectionCategoryId?: number | null;
  connectionCategoryName?: string | null;
  geographyUnitId?: number | null;
  geographyName?: string | null;
  chargeHeadId?: number | null;
  chargeHeadName?: string | null;
  penaltyType?: string;
  fromDay?: number;
  toDay?: number | null;
  percentageRate?: number | null;
  flatAmount?: number | null;
  maximumAmount?: number | null;
  effectiveFrom?: string;
  effectiveTo?: string;
  isCurrentBill?: boolean;
  isPendingBill?: boolean;
  isActive: boolean;
  createdDate?: string | null;
  updatedDate?: string | null;
  createdBy?: number | null;
  createdByName?: string | null;
  updatedBy?: string | number | null;
  updatedByName?: string | null;
  // Legacy / fallback aliases
  id?: number;
  penaltyCode?: string;
  penaltyName?: string;
  calculationType?: string;
  penaltyValue?: number;
  gracePeriodDays?: number;
}

export interface CreateWaterPenaltyRuleModel {
  financialYearId?: number;
  connectionCategoryId?: number | null;
  geographyUnitId?: number | null;
  chargeHeadId?: number | null;
  penaltyType?: string;
  fromDay?: number;
  toDay?: number | null;
  percentageRate?: number | null;
  flatAmount?: number | null;
  maximumAmount?: number | null;
  effectiveFrom?: string;
  effectiveTo?: string;
  isCurrentBill?: boolean;
  isPendingBill?: boolean;
  isActive?: boolean;
  // Legacy / fallback fields
  id?: number | null;
  penaltyCode?: string;
  penaltyName?: string;
  calculationType?: string;
  penaltyValue?: number | string;
  gracePeriodDays?: number | string;
  createdBy?: number;
  updatedBy?: number;
}

export interface UpdateWaterPenaltyRuleModel extends CreateWaterPenaltyRuleModel {
  penaltyRuleId?: number;
}

export interface WaterPenaltyRuleQueryParams {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  financialYearId?: number;
  connectionCategoryId?: number | null;
  geographyUnitId?: number;
  chargeHeadId?: number;
  penaltyType?: string;
  isCurrentBill?: boolean;
  isPendingBill?: boolean;
  isActive?: boolean;
  effectiveDate?: string;
}

export interface WaterPenaltyRuleMasterProps {
  data: WaterPenaltyRuleDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  searchTerm?: string;
  financialYearId?: number;
  connectionCategoryId?: number | null;
  geographyUnitId?: number;
  chargeHeadId?: number;
  penaltyType?: string;
  statusFilter?: "all" | "active" | "inactive";
  financialYearOptions?: FinancialYearLookupOption[];
  connectionCategoryOptions?: LookupOption[];
  geographyOptions?: LookupOption[];
  chargeHeadOptions?: LookupOption[];
}

export interface RawPenaltyRule {
  id?: number;
  penaltyRuleId?: number;
  penaltyCode?: string;
  penaltyName?: string;
  calculationType?: string;
  penaltyValue?: number;
  gracePeriodDays?: number;
  penaltyType?: string;
  fromDay?: number | null;
  toDay?: number | null;
  percentageRate?: number | null;
  flatAmount?: number | null;
  maximumAmount?: number | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  financialYearId?: number;
  connectionCategoryId?: number | null;
  geographyUnitId?: number | null;
  chargeHeadId?: number | null;
  isActive?: boolean;
  createdDate?: string | null;
  updatedDate?: string | null;
  createdBy?: number | null;
  updatedBy?: number | null;
}

export interface LegacyPenaltyRule {
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

export interface GenericPenaltyRuleFormModel {
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

// Unified Aliases
export type PenaltyRule = WaterPenaltyRuleDto;
export type PenaltyRuleProps = WaterPenaltyRuleMasterProps;
export type PenaltyRuleFormModel = CreateWaterPenaltyRuleModel;
export type CreatePenaltyRuleModel = CreateWaterPenaltyRuleModel;
export type UpdatePenaltyRuleModel = UpdateWaterPenaltyRuleModel;
export type PenaltyRuleQueryParams = WaterPenaltyRuleQueryParams;
export type PaginatedApiResponse<T> = ApiResponse<PagedResponse<T>>;
