/**
 * Types for the WingDetailsMast API - the per-wing record for a property.
 * API: GET/POST/PUT /WingDetailsMast
 *
 * Cardinality: one SocietyDetailsMast row per property (society-level info
 * only), many WingDetailsMast rows per SocietyDetailsMast (one per wing).
 * WingDetailsMast.wingName is itself the short wing label (e.g. "A"), not a
 * separate code - there is no distinct "wingNo" field on this table.
 */

export interface SocietyWingDetailsPayload {
  isActive: boolean;
  createdBy: number;
  wingId: number;
  propertyId: number;
  societyDetailId: number;
  wingDetailsMastId: number;
  fromFloor: string;
  toFloor: string;
  oldWingName: string;
  newWingName: string;
  noOfFlat: number;
  noOfShop: number;
  noOfRowHouse: number;
}

export interface SocietyWingDetailsItem extends SocietyWingDetailsPayload {
  id: number;
}

export interface WingDetailsMastItem {
  id: number;
  isActive: boolean;
  createdBy: number;
  createdDate: string;
  updatedBy: number | null;
  updatedDate: string | null;
  societyDetailsMastId: number;
  wingMasterId: number;
  wingName: string | null;
  secretaryName: string | null;
  managerName: string | null;
  secretaryNameEnglish: string | null;
  managerNameEnglish: string | null;
  managerMobileNo: string | null;
  managerMobileNoRemarkId: number | null;
  secretaryMobileNo: string | null;
  secretaryMobileNoRemarkId: number | null;
  secretaryEmailId: string | null;
  managerEmailId: string | null;
  markedForDeletion: boolean;
  markedForDeletionDate: string | null;
  societyWingDetails: SocietyWingDetailsItem | null;
}

/**
 * Response shape from GET /WingDetailsMast?SocietyDetailsMastId=.
 * Note: the backend DTO names the array field "wingDetailsMast", not "items".
 */
export interface WingDetailsMastListResponse {
  wingDetailsMast: WingDetailsMastItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  oldWingDetails?: unknown[];
}

export interface CreateWingDetailsMastPayload {
  isActive: boolean;
  createdBy: number;
  societyDetailsMastId: number;
  wingMasterId: number;
  wingName?: string;
  secretaryName?: string;
  managerName?: string;
  secretaryNameEnglish?: string;
  managerNameEnglish?: string;
  managerMobileNo?: string;
  managerMobileNoRemarkId?: number;
  secretaryMobileNo?: string;
  secretaryMobileNoRemarkId?: number;
  secretaryEmailId?: string;
  managerEmailId?: string;
  wingPhotoDocumentIds?: string;
  societyWingDetails: SocietyWingDetailsPayload;
}

export interface UpdateWingDetailsMastPayload {
  isActive?: boolean;
  updatedBy?: number;
  wingName?: string | null;
  secretaryName?: string | null;
  managerName?: string | null;
  secretaryNameEnglish?: string | null;
  managerNameEnglish?: string | null;
  managerMobileNo?: string | null;
  managerMobileNoRemarkId?: number | null;
  secretaryMobileNo?: string | null;
  secretaryMobileNoRemarkId?: number | null;
  secretaryEmailId?: string | null;
  managerEmailId?: string | null;
  markedForDeletion?: boolean;
  markedForDeletionDate?: string | null;
  societyWingDetails?: Partial<SocietyWingDetailsPayload> | null;
}
