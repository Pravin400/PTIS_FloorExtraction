/**
 * Types for Property Range API
 * Used for creating single or bulk properties via /api/Property/Range endpoint
 */

/**
 * Template for property creation - contains all property fields
 */
export interface PropertyRangeTemplate {
  propertyTypeId: number;
  categoryId: number;
  taxZoneId: number; // Required field - must be a valid positive number
  wardId: number;
  ownerName?: string;
  // Optional fields from full schema
  builderMobileNo?: string;
  builderMobileRemarkId?: number;
  csn?: string;
  surveyRemark?: string;
  blockNo?: string;
  propertyMastOldId?: number;
  societyDetailId?: number;
  propertyAssessmentStatusId?: number;
  pinCode?: string;
  mobileNoRemarkId?: number;
  alternateMobileNo?: string;
  occupierMobileNo?: string;
  occupierMobileNoRemarkId?: number;
  propertyNo?: string;
  propertySeqNo?: number;
  partitionNo?: string;
  openPlot?: boolean;
  plotNo?: string;
  type?: string;
  partType?: string;
  ownerTitle?: string;
  ownerTitleEnglish?: string;
  ownerNameEnglish?: string;
  mobileNo?: string;
  emailId?: string;
  occupierTitle?: string;
  occupierTitleEnglish?: string;
  occupierName?: string;
  occupierNameEnglish?: string;
  flatOrShopNo?: string;
  flatOrShopNoEnglish?: string;
  flatOrShopName?: string;
  flatOrShopNameEnglish?: string;
  address?: string;
  addressEnglish?: string;
  location?: string;
  locationEnglish?: string;
  societyName?: string;
  societyNameEnglish?: string;
  societyAddress?: string;
  societyAddressEnglish?: string;
  secretaryName?: string;
  secretaryNameEnglish?: string;
  managerName?: string;
  managerNameEnglish?: string;
  landOwnerName?: string;
  landOwnerNameEnglish?: string;
  builderName?: string;
  builderNameEnglish?: string;
  managerMobileNo?: string;
  secretaryMobileNo?: string;
  societyEmailId?: string;
  secretaryEmailId?: string;
  managerEmailId?: string;
  lengthMtr?: number;
  widthMtr?: number;
  totalAreaSqMtr?: number;
  createdBy?: number;
  createdDate?: string;
}

/**
 * Request payload for creating properties via Range API
 * For single property: rangeFrom === rangeTo
 * For bulk: rangeFrom < rangeTo
 */
export interface PropertyRangeCreatePayload {
  rangeFrom: string;
  rangeTo: string;
  prefix?: string;
  suffix?: string;
  template: PropertyRangeTemplate;
  startSequenceNo?: number;
}

/**
 * Individual property result from range creation
 */
export interface PropertyRangeResultItem {
  propertyId: number;
  upicid: string;
  message: string;
  success: boolean;
  wardID: number;
}

/**
 * Response from Property/Range API
 */
export interface PropertyRangeCreateResponse {
  successCount: number;
  failedCount: number;
  results: PropertyRangeResultItem[];
}
