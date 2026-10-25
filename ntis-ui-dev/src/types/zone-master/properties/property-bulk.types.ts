/**
 * Types for Bulk Property Creation API
 * Used in Zone Master for generating building structure properties
 * API endpoint: POST /api/Property/Bulk
 */

/**
 * Single property item for bulk creation
 */
export interface BulkPropertyItem {
  taxZoneId: number;
  wardId: number;
  propertyNo: string;
  propertyTypeId: number;
  categoryId: number;
  partitionNo: string;
  flatOrShopNo: string | null;
  flatOrShopNoEnglish: string | null;
  address: string | null;
  addressEnglish: string | null;
  location: string | null;
  locationEnglish: string | null;
  societyDetailId?: number; // Deprecated FK - kept for backward compatibility, not validated server-side anymore
  wingDetailId?: number; // FK to WingDetailsMast.Id - required for apartment categories (replaces societyDetailId)
  propertyFloorId?: number; // Floor ID from building structure (optional for amenities/partitions)
  createdBy: number;
  createdDate: string;
}

/**
 * Result for each property in the bulk creation response
 */
export interface BulkPropertyResult {
  propertyId: number;
  upicid: string | null;
  message: string;
  success: boolean;
}

/**
 * Response from the bulk property creation API
 * POST /api/Property/Bulk
 */
export interface BulkPropertyCreateResponse {
  successCount: number;
  failedCount: number;
  results: BulkPropertyResult[];
  errors: string[] | null;
  hasFailures: boolean;
  allSucceeded: boolean;
}

/**
 * Configuration for generating bulk property payload
 * Used in BuildingPreviewModal to collect user inputs
 */
export interface BulkPropertyGenerateConfig {
  taxZoneId: number;
  wardId: number;
  basePropertyNo: string;
  propertyTypeId: number;
  categoryId: number;
  societyDetailId: number;
  address: string;
  addressEnglish: string;
  location: string;
  locationEnglish: string;
  createdBy: number;
}
