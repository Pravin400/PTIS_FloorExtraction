/**
 * Property Search API Types
 * Interface definitions for API requests and responses from the .NET backend
 */

import type { PagedResponse } from "@/types/common.types";

/* ================= Zone API Types ================= */

export interface ZoneApiResponse {
  zoneId: number;
  zoneNo: string;
  description: string | null;
  sequenceNo: number | null;
  isActive: boolean;
}

/* ================= Ward API Types ================= */

export interface WardApiResponse {
  wardId: number;
  wardNo: string;
  zoneId: number;
  description: string | null;
  sequenceNo: number | null;
  isActive: boolean;
}

/* ================= Property Search API Types ================= */

export interface PropertySearchApiItem {
  propertyId: number;
  upicId: string | null;
  zoneName: string | null;
  wardName: string | null;
  propertyNo: string | null;
  partitionNo: string | null;
  oldPropertyNo: string | null;
  /** Correct spelling from current API */
  citySurveyNo: string | null;
  /** Legacy typo retained for backward compatibility */
  cityServeyNo?: string | null;
  plotNo: string | null;
  wingFlatNo: string | null;
  wing?: string | null;
  flatNo?: string | null;
  propertyCount?: number | null;
  childUnitCount?: number | null;
  categoryName: string | null;
  propertyDescription: string | null;
  mobile: string | null;
  alternateMobileNo?: string | null;
  occupierMobileNo?: string | null;
  propertyHolderName: string | null;
  occupierName: string | null;
  shopBuildingName: string | null;
  societyName: string | null;
  address: string | null;
  rv: number | null;
  cv: number | null;
  /** Legacy combined field retained for backward compatibility */
  rvcv?: number | null;
  totalTax: number | null;
  status: string | null;
  societyDetailId?: number | null;
  societyId?: number | null;
  wingDetailId?: number | null;
  wingId?: number | null;
}

export interface PropertySearchApiResponse {
  success: boolean;
  message: string | null;
  items: PagedResponse<PropertySearchApiItem>;
  errors: string | null;
  correlationId: string | null;
}

/* ================= Lookup Options API Types ================= */

export interface LookupOptionsApiResponse {
  propertyNos: string[];
  oldPropertyNos: string[];
  upicIds: string[];
  csns: string[];
  subZoneNos: string[];
}

/* ================= Search Criteria Payload ================= */

export interface PropertySearchCriteriaPayload {
  zoneId?: number | null;
  wardId?: number | null;
  categoryId?: number;
  propertyAssessmentStatusId?: number;
  workflowStageId?: number;
  propertyNoFrom?: string;
  propertyNoTo?: string;
  oldPropertyNo?: string;
  upicId?: string;
  citySurveyNo?: string;
  subZoneNo?: string;
  plotNo?: string;
  holderName?: string;
  occupierName?: string;
  mobile?: string;
  shopBuildingName?: string;
  societyName?: string;
  address?: string;
  dashboardFilter?: number;
  valuationMethod?: string;
  filterType?: string;
  /** Values & Dues: `RV` or `CV` or `TotalTax` */
  rvOrCv?: string;
  /** Valuation Type Filter: `RV` or `TotalTax` */
  valuationTypeFilter?: string;
  /** Values & Dues: `Equals` | `GreaterThan` | `LessThan` | `top` (Between uses AmountValue + AmountTo with no operator). */
  amountFilterOperator?: string;
  amountValue?: number;
  amountTo?: number;
  topCount?: number;
  pageNumber?: number;
  pageSize?: number;
}
