import { PagedResponse } from './common.types';

/** Ward master lookup row (existing generic `/Ward` endpoint). */
export interface Ward {
  id: number;
  wardNo: string;
  zoneNo: string;
  description: string | null;
  descriptionEnglish: string | null;
  sequenceNo: number | null;
  isActive: boolean;
  createdBy: string | null;
  createdDate: string;
  updatedBy: string | null;
  updatedDate: string | null;
}

/** Tax zone master lookup row (existing generic `/TaxZone` endpoint). */
export interface TaxZone {
  id: number;
  taxZoneNo: string;
  taxZoneType: string;
  remark: string | null;
  createdDate: string;
  updatedDate: string | null;
  isActive: boolean;
}

/** Read model for a persisted tax zoning range/whole-ward assignment. */
export interface TaxZoningRange {
  id: number;
  wardId: number;
  wardNo: string;
  taxZoneId: number;
  taxZoneNo: string;
  fromPropertyNo: string | null;
  toPropertyNo: string | null;
  assignEntireWard: boolean;
  zoneDescription: string;
  isActive: boolean;
  createdDate: string | null;
  updatedDate: string | null;
  minPropertyNo: string | null;
  maxPropertyNo: string | null;
  totalProperties: number;
}

export interface CreateTaxZoningRangePayload {
  wardIds: number[];
  taxZoneId: number;
  assignEntireWard?: boolean;
  fromPropertyNo?: string;
  toPropertyNo?: string;
  zoneDescription: string;
  isActive?: boolean;
  createdBy?: number;
}

export interface UpdateTaxZoningRangePayload {
  wardId: number;
  taxZoneId: number;
  assignEntireWard?: boolean;
  fromPropertyNo?: string;
  toPropertyNo?: string;
  zoneDescription: string;
  isActive?: boolean;
  updatedBy?: number;
}

export interface TaxZoningRangeQuery {
  pageNumber: number;
  pageSize: number;
  wardId?: number;
  taxZoneId?: number;
  propertyNo?: string;
  description?: string;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface TaxZoningZoneWiseCount {
  taxZoneId: number;
  taxZoneNo: string;
  count: number;
}

export interface TaxZoningCoverage {
  totalProperties: number;
  coveredProperties: number;
  pendingProperties: number;
  zoneWiseCounts: TaxZoningZoneWiseCount[];
}

export interface WardZoningAbstractZoneCount {
  taxZoneId: number;
  taxZoneNo: string;
  count: number;
}

export interface WardZoningAbstractRow {
  wardId: number;
  wardNo: string;
  totalProperties: number;
  coveredProperties: number;
  pendingProperties: number;
  coveragePercent: number;
  zoneCounts: WardZoningAbstractZoneCount[];
}

export interface WardProperty {
  propertyId: number;
  wardId: number;
  wardNo: string;
  propertyNo: string | null;
  isActive: boolean;
}

export type BulkRowStatus = 'New' | 'Updated' | 'Invalid';

export interface BulkTaxZoningRangeRow {
  wardNo: string;
  wardId?: number;
  fromPropertyNo: string;
  toPropertyNo: string;
  taxZoneNo: string;
  taxZoneId?: number;
  zoneDescription: string;
  status: BulkRowStatus;
  errors?: string[];
}

export interface BulkTaxZoningRangeResult {
  successCount: number;
  failedCount: number;
  results: TaxZoningRange[];
  errors?: string[] | null;
  hasFailures: boolean;
  allSucceeded: boolean;
}

/** UI-only "kind" tag for the two Tax Zoning document slots; maps to real PTIS.ULBDocumentType codes. */
export type TaxZoningDocumentKind = 'LIST' | 'MAP';

export interface UlbDocument {
  id: number;
  documentTypeCode: string;
  documentTypeName: string;
  documentBindingId: number | null;
  originalFileName: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  documentGuid: string | null;
}

export interface CreateUlbDocumentPayload {
  documentTypeCode: string;
}

export interface TaxZoningRangeFormModel {
  id?: number;
  wardIds: number[];
  taxZoneId: number | '';
  assignEntireWard: boolean;
  fromPropertyNo: string;
  toPropertyNo: string;
  zoneDescription: string;
}

/** Generic action-result wrapper used by server actions in this feature. */
export type ActionResult<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; statusCode?: number };

export interface TaxZoningMasterPageProps {
  data: TaxZoningRange[];
  taxZones: PagedResponse<TaxZone>;
  wardsData: PagedResponse<Ward>;
  coverage: TaxZoningCoverage;
  totalCount: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  ulbName?: string;
  filters: {
    wardId?: number;
    fromPropertyNo?: string;
    toPropertyNo?: string;
    taxZoneId?: number;
    search?: string;
  };
}
