import { PagedResponse } from "@/types/common.types";

/**
 * A SocietyDetailsMast row represents society-level info for a property
 * (at most one row per property). Wing identity now lives on WingDetailsMast
 * (see wingDetailsMast.types.ts) - wingId/wingName here are vestigial/null.
 */
export interface SocietyDetailItem {
  propertyId: number;
  wingId: number | null;
  wingNo?: string;
  wingName: string | null;
  societyName: string;
  societyAddress: string;
  secretaryName: string;
  managerName: string;
  landOwnerName: string;
  builderName: string;
  secretaryNameEnglish: string;
  societyNameEnglish: string;
  societyAddressEnglish: string;
  managerNameEnglish: string;
  landOwnerNameEnglish: string;
  builderNameEnglish: string;
  managerMobileNo: string;
  secretaryMobileNo: string;
  societyEmailId: string;
  secretaryEmailId: string;
  managerEmailId: string;
  markedForDeletion: boolean;
  id: number;
  isActive: boolean;
  createdDate: string;
  updatedDate: string | null;
}

export type SocietyDetailsListResponse = PagedResponse<SocietyDetailItem>;

/**
 * Creates a society detail record. Wing identity remains optional for the
 * QuickDataEntry wing flow; zone-master wing records use WingDetailsMast.
 */
export interface CreateSocietyDetailPayload {
  isActive: boolean;
  createdBy: number;
  propertyId: number;
  wingId?: number;
  wingName?: string;
  societyName?: string;
  societyAddress?: string;
  secretaryName?: string;
  managerName?: string;
  landOwnerName?: string;
  builderName?: string;
}

/**
 * Payload for updating a society detail record.
 * Includes all editable fields to prevent data loss during partial updates.
 */
export interface UpdateSocietyDetailPayload {
  isActive?: boolean;
  updatedBy?: number;
  propertyId?: number;
  wingId?: number;
  wingName?: string;
  societyName?: string;
  societyAddress?: string;
  secretaryName?: string;
  managerName?: string;
  landOwnerName?: string;
  builderName?: string;
  secretaryNameEnglish?: string;
  societyNameEnglish?: string;
  societyAddressEnglish?: string;
  managerNameEnglish?: string;
  landOwnerNameEnglish?: string;
  builderNameEnglish?: string;
  managerMobileNo?: string;
  secretaryMobileNo?: string;
  societyEmailId?: string;
  secretaryEmailId?: string;
  managerEmailId?: string;
}
