/**
 * PTIS Individual Property Types
 * Consolidated type definitions for Individual Property assessment screens.
 * Contains both backend API response DTO contracts and normalized UI domain models.
 */

// ============================================================================
// 1. Backend API Response Contracts (GET /api/Property/{propertyId}/individual)
// ============================================================================

export interface IndividualAdditionalRevenueDto {
  currentTax?: number | null;
  retroTax?: number | null;
  totalTax?: number | null;
  currentDemand?: number | null;
  totalDemand?: number | null;
  collection?: number | null;
  collectionPercentage?: number | null;
  totalBalance?: number | null;
  oldCurrentTax?: number | null;
  differenceAmount?: number | null;
  changePercent?: number | null;
  pendingCurrent?: number | null;
  pendingDemand?: number | null;
}

export interface IndividualPropertyDto {
  propertyId?: number | null;
  propertyNo?: string | null;
  upicId?: string | null;
  ownerName?: string | null;
  ownerNameEnglish?: string | null;
  ownerNameRegional?: string | null;
  owner?: string | null;
  propertyHolder?: string | null;
  holderRegional?: string | null;
  occupierName?: string | null;
  occupierNameEnglish?: string | null;
  occupierNameRegional?: string | null;
  occupierRegional?: string | null;
  ownerCategory?: string | null;
  category?: string | null;
  categoryName?: string | null;
  propertyCategory?: string | null;
  aadharNo?: string | null;
  ownerTitle?: string | null;
  aadharWithTitle?: string | null;
  mobileNo?: string | null;
  alternateMobileNo?: string | null;
  emailId?: string | null;
  address?: string | null;
  addressEnglish?: string | null;
  addressRegional?: string | null;
  pinCode?: string | null;
  fullAddress?: string | null;
  division?: string | null;
  moujaName?: string | null;
  surveyNo?: string | null;
  taxZone?: string | null;
  taxZoneNo?: string | null;
  subZoneNo?: string | null;
  subZone?: string | null;
  rateSectionName?: string | null;
  rateSection?: string | null;
  plotNo?: string | null;
  flatOrShopNo?: string | null;
  flatOrShopName?: string | null;
  flatOrShopNameEnglish?: string | null;
  wingDetailId?: number | string | null;
  wingName?: string | null;
  shopName?: string | null;
  shopNameRegional?: string | null;
  plotAreaFt?: number | string | null;
  plotAreaMtr?: number | string | null;
  carpetAreaFt?: number | string | null;
  carpetAreaMtr?: number | string | null;
  carpetAreasqFt?: number | string | null;
  carpetAreasqMtr?: number | string | null;
  builtUpAreaFt?: number | string | null;
  builtUpAreaMtr?: number | string | null;
  builtUpAreasqFt?: number | string | null;
  builtUpAreasqMtr?: number | string | null;
  oldCarpetAreaSqFeet?: number | string | null;
  oldCarpetAreaSqMeter?: number | string | null;
  oldBuiltupAreaSqFeet?: number | string | null;
  oldBuiltupAreaSqMeter?: number | string | null;
  propertyDescription?: string | null;
  individualPropertyGuid?: string | null;
  individualPropertyPhotoGuid?: string | null;
  societyBuildingPhotoGuid?: string | null;
  additionalRevenue?: IndividualAdditionalRevenueDto | IndividualAdditionalRevenueDto[] | null;
}

export interface IndividualPropertyApiResponse {
  success: boolean;
  message?: string;
  items?: IndividualPropertyDto | null;
  totalCount?: number | null;
  errors?: unknown;
  correlationId?: string | null;
}

// ============================================================================
// 2. Normalized UI Domain Models
// ============================================================================

export interface IndividualPerformanceData {
  thisAssessmentRevenue?: string;
  revenueGrowthPct?: string;
  isGrowthNegative?: boolean;
  currentTax?: string;
  retroTax?: string;
  totalTax?: string;
  totalDemand?: string;
  currentDemand?: string;
  pendingDemand?: string;
  collectionPercent?: string | number;
  collectionAmount?: string;
  totalBalance?: string;
  differenceAmount?: string;
  rawDifferenceAmount?: number | null;
  oldCurrentTax?: string;
  changePercent?: number | null;
}

export interface IndividualPropertyMasterData {
  propertyId?: number;
  wardId?: number;
  wardNo?: string;
  propertyNo?: string;
  upic?: string;
  societyName?: string;
  ownerName?: string;
  ownerNameEnglish?: string;
  ownerNameRegional?: string;
  landOwnerName?: string;
  owner?: string;
  propertyHolder?: string;
  holderRegional?: string;
  occupierName?: string;
  occupierNameEnglish?: string;
  occupierRegional?: string;
  occupierNameRegional?: string;
  ownerCategory?: string;
  division?: string;
  moujaName?: string;
  surveyNo?: string;
  taxZone?: string;
  taxZoneNo?: string;
  subZoneNo?: string;
  subZone?: string;
  rateSectionName?: string;
  taxZoneAndName?: string;
  subZoneCsnNo?: string;
  plotNo?: string;
  flatOrShopNo?: string;
  flatOrShopName?: string;
  wingDetailId?: number | string | null;
  wingName?: string;
  shopName?: string;
  shopNameRegional?: string;
  aadharNo?: string;
  title?: string;
  ownerTitle?: string;
  aadharWithTitle?: string;
  mobileNo?: string;
  altMobileNo?: string;
  alternateMobileNo?: string;
  emailId?: string;
  pinCode?: string;
  societyEmail?: string;
  societyAddress?: string;
  address?: string;
  addressEnglish?: string;
  addressRegional?: string;
  plotArea?: string;
  plotAreaFtMtr?: string;
  carpetAreaFtMtr?: string;
  builtUpAreaFtMtr?: string;
  carpetBuiltUpArea?: string;
  oldCarpetAreaFtMtr?: string;
  oldBuiltUpAreaFtMtr?: string;
  status?: string;
  category?: string;
  propertyCategory?: string;
  categoryId?: number | null;
  propertyTypeId?: number | null;
  propertyDescription?: string;
  propertyDescriptionRegional?: string;
  societyBuildingPhotoGuid?: string;
  imageUrl?: string;
  performance?: IndividualPerformanceData;
  [key: string]: unknown;
}

// ============================================================================
// 3. Mutation Payloads
// ============================================================================

export interface IndividualPatchPayload {
  ownerName?: string | null;
  ownerNameRegional?: string | null;
  ownerNameEnglish?: string | null;
  ownerTitle?: string | null;
  ownerTitleEnglish?: string | null;
  occupierName?: string | null;
  occupierNameRegional?: string | null;
  occupierNameEnglish?: string | null;
  occupierTitle?: string | null;
  occupierTitleEnglish?: string | null;
  ownerTypeId?: number | null;
  aadharNo?: string | null;
  mobileNo?: string | null;
  alternateMobileNo?: string | null;
  emailId?: string | null;
  address?: string | null;
  addressRegional?: string | null;
  addressEnglish?: string | null;
  pinCode?: string | null;
  moujaId?: number | null;
  taxZoneId?: number | null;
  surveyNo?: string | null;
  plotNo?: string | null;
  flatOrShopNo?: string | null;
  flatOrShopName?: string | null;
  flatOrShopNameEnglish?: string | null;
  categoryId?: number | null;
  propertyTypeId?: number | null;
}

export interface IndividualPatchResponseDto {
  ownerName?: string | null;
  ownerNameRegional?: string | null;
  ownerNameEnglish?: string | null;
  ownerTitle?: string | null;
  ownerTitleEnglish?: string | null;
  occupierName?: string | null;
  occupierNameRegional?: string | null;
  occupierNameEnglish?: string | null;
  occupierTitle?: string | null;
  occupierTitleEnglish?: string | null;
  ownerTypeId?: number | null;
  aadharNo?: string | null;
  mobileNo?: string | null;
  alternateMobileNo?: string | null;
  emailId?: string | null;
  address?: string | null;
  addressRegional?: string | null;
  addressEnglish?: string | null;
  pinCode?: string | null;
  moujaId?: number | null;
  taxZoneId?: number | null;
  surveyNo?: string | null;
  plotNo?: string | null;
  flatOrShopNo?: string | null;
  flatOrShopName?: string | null;
  flatOrShopNameEnglish?: string | null;
  categoryId?: number | null;
  propertyTypeId?: number | null;
}

export interface IndividualPatchApiResponse {
  success: boolean;
  message?: string;
  items?: IndividualPatchResponseDto | null;
  errors?: unknown;
}

