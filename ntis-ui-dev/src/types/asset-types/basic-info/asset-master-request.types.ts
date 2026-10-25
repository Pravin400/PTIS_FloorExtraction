import { AssetFieldValueRequest } from "./asset-wizard.types";

/**
 * Matches backend CreateAssetMasterDto exactly.
 * Only include fields the backend DTO declares.
 */
export interface AssetMasterRequest {
  // Required fields
  organizationId: number;
  assetName: string;
  assetRegionalName?: string | null;
  assetCategoryId: number;
  assetTypeId: number;
  hierarchyLevel: number;
  isActive: boolean;
  assetNo?: string | null;

  // Optional FK IDs — send null, NOT 0 or invalid fallback
  departmentId?: number | null;
  parentAssetId?: number | null;
  wardId?: number | null;
  zoneId?: number | null;
  subZoneId?: number | null;
  moujaId?: number | null;

  // Optional strings
  hierarchyPath?: string | null;
  address?: string | null;
  RegionalAddress?: string | null;
  csn?: string | null;
  constructionYear?: number | null;
  ownershipType?: string | null;
  occupancyStatus?: string | null;
  assetConditionId?: number | null;
  encroachmentStatus?: string | null;
  inChargeName?: string | null;
  inChargeRegionalName?: string | null;
  inChargeDesignationId?: number | null;
  inChargeMobile?: string | null;
  inChargeEmail?: string | null;
  locality?: string | null;
  pinCode?: string | null;
  partitionNo?: string | null;
  upicId?: string | null;
  propertyNo?: string | null;
  plotNo?: string | null;
  assetWardNo?: string | null;
  mpmsNo?: string | null;

  // Optional location
  latitude?: number | null;
  longitude?: number | null;

  // Optional area details
  lengthFt?: number | null;
  lengthMtr?: number | null;
  widthFt?: number | null;
  widthMtr?: number | null;
  landAreaSqFeet?: number | null;
  landAreaSqMeter?: number | null;
  totalLength?: number | null; // Keeping these just in case backend still accepts them
  averageWidth?: number | null;
  landRate?: number | null;

  // EAV dynamic field values
  fieldValues?: AssetFieldValueRequest[];
  fieldValuesJson?: string | null;

  // Photo files (typically used when sending form-data, but kept for type completeness)
  photoFiles?: File[] | null;
  photoMetadataJson?: string;

  // Base DTO fields
  createdBy?: number;
}

export interface AssetFormDataRequest {
  sectionCode: string;
  sectionName: string;
  formData: string; // JSON string representation of section fields
  displayOrder: number;
}

export interface AssetMasterResponse {
  id: number;
  isActive: boolean;
  assetCode: string;
  name: string;
  // ... other fields as needed
}
