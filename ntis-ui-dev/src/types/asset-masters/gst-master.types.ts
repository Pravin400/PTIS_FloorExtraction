export interface RawGstMaster {
  id?: number;
  taxCode?: string;
  taxName?: string;
  taxPercentage?: number;
  effectiveFromDate?: string | null;
  effectiveToDate?: string | null;
  isActive?: boolean;
  createdDate?: string | null;
  updatedDate?: string | null;
  createdBy?: number | null;
  updatedBy?: number | null;
}

export interface GstMaster {
  [key: string]: unknown;
  id: number;
  taxCode: string;
  taxName: string;
  taxPercentage: number;
  isActive: boolean;
  effectiveFromDate?: string | null;
  effectiveToDate?: string | null;
  createdDate?: string | null;
  updatedDate?: string | null;
  createdBy?: number | null;
  updatedBy?: number | null;
}

export interface GstMasterFormModel {
  id?: number | null;
  taxCode: string;
  taxName: string;
  taxPercentage: number | string;
  effectiveFromDate: string;
  effectiveToDate: string;
  isActive: boolean;
  createdBy?: number;
  updatedBy?: number;
}

export interface GstMasterProps {
  data: GstMaster[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  sortBy?: string;
  sortOrder?: string;
  searchTerm?: string;
}
