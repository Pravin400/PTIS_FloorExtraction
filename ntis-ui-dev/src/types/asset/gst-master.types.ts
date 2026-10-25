/**
 * GST Master Types
 */

export interface GstMasterItem {
  id: number;
  taxCode: string;
  taxName: string;
  taxPercentage: number;
  effectiveFromDate: string;
  effectiveToDate: string | null;
  isActive: boolean;
}

export type GstMasterPayload = Omit<GstMasterItem, 'id'>;

export interface GstMasterListParams {
  PageNumber?: number;
  PageSize?: number;
  SearchTerm?: string;
  TaxCode?: string;
  TaxName?: string;
}

export interface GstMasterListResponse {
  items: GstMasterItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
